/**
 * Backend API Integration for Chat with Metrics
 * Implements the server-side chat endpoints with model routing and metrics collection
 */

import express, { Request, Response } from 'express';
import NodeCache from 'node-cache';
import { VertexAI } from '@google-cloud/vertexai';
import { Firestore } from '@google-cloud/firestore';
import { BigQuery } from '@google-cloud/bigquery';
import { initializeApp as adminInitApp, getApps as adminGetApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { NextFunction } from 'express';

// Initialise the Admin SDK once; Cloud Run's service account provides credentials automatically.
if (!adminGetApps().length) {
  adminInitApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT ?? process.env.VITE_FIREBASE_PROJECT_ID });
}

async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) { res.status(401).json({ error: 'Unauthorised' }); return; }
  try {
    const decoded = await getAdminAuth().verifyIdToken(token, true);
    const isAdmin = decoded['admin'] === true;
    if (!isAdmin && decoded['approved'] !== true) { res.status(403).json({ error: 'Account not approved' }); return; }
    if (!decoded.firebase?.sign_in_second_factor) { res.status(403).json({ error: 'Two-factor authentication required', code: 'auth/mfa-required' }); return; }
    (req as any).uid = decoded.uid;
    (req as any).isAdmin = isAdmin;
    next();
  } catch (error) { console.warn('[chat] Firebase token rejected:', error instanceof Error ? error.message : 'unknown error'); res.status(401).json({ error: 'Invalid token' }); }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!(req as any).isAdmin) { res.status(403).json({ error: 'Forbidden' }); return; }
  next();
}

interface ChatRequest {
  query: string;
  context: any[];
  model: 'gemini-flash' | 'gpt-4o-mini' | 'gemini-pro';
  userLanguage: 'en' | 'ga';
  prompt: string;
  sessionId: string;
  promptId?: string;
  filters?: any;
}

interface ChatResponse {
  text: string;
  tokensInput: number;
  tokensOutput: number;
  confidence: number;
  model: string;
  processingTime: number;
  cost: number;
  promptId?: string;
  analysisMode?: string;
}

interface PromptExecution {
  id: string;
  promptId?: string;
  sessionId: string;
  userId?: string;
  query: string;
  originalLanguage: 'en' | 'ga';
  targetLanguage: 'en' | 'ga';
  modelUsed: string;
  startTime: Date;
  endTime?: Date;
  processingTimeMs?: number;
  tokensInput: number;
  tokensOutput: number;
  cost: number;
  confidence: number;
  retrievedDocuments: number;
  response?: string;
  error?: string;
  status: 'running' | 'completed' | 'failed';
  filters?: any;
  thumbsUp?: boolean;
  thumbsDown?: boolean;
  feedbackText?: string;
  feedbackTimestamp?: Date;
}

const BQ_PROJECT = process.env.GOOGLE_CLOUD_PROJECT!;
const BQ_DATASET = process.env.BQ_DATASET || 'parliamentary_data';
const PARLIAMENT_DATA_SOURCE = process.env.PARLIAMENT_DATA_SOURCE || 'Houses of the Oireachtas Open Data API';

class ChatAPI {
  private db: Firestore;
  private vertexAI: VertexAI;
  private bq: BigQuery;
  private searchCache: NodeCache;
  
  // Model pricing per 1M tokens
  private readonly MODEL_PRICING = {
    'gemini-flash': { input: 0.075, output: 0.30 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gemini-pro': { input: 3.50, output: 10.50 }
  };

  constructor() {
    this.db = new Firestore({ projectId: BQ_PROJECT });
    this.bq = new BigQuery({ projectId: BQ_PROJECT });
    // 10-minute TTL; checked every 2 minutes
    this.searchCache = new NodeCache({ stdTTL: 600, checkperiod: 120 });
    this.vertexAI = new VertexAI({
      project: BQ_PROJECT,
      location: 'us-central1'
    });
  }

  private isModelUnavailableError(error: unknown): boolean {
    const message = error instanceof Error ? error.message : String(error);
    return (
      message.includes('Publisher model') ||
      message.includes('SERVICE_DISABLED') ||
      message.includes('PERMISSION_DENIED') ||
      message.includes('NOT_FOUND') ||
      message.includes('aiplatform.googleapis.com') ||
      message.includes('model is unavailable') ||
      message.includes('not integrated')
    );
  }

  private async generateWithModelFallback(
    modelIds: string[],
    fullPrompt: string,
    generationConfig: {
      maxOutputTokens: number;
      temperature: number;
      topP: number;
    }
  ): Promise<string> {
    let lastError: unknown;

    for (const modelId of modelIds) {
      try {
        const model = this.vertexAI.preview.getGenerativeModel({
          model: modelId,
          generationConfig,
        });

        const result = await model.generateContent(fullPrompt);
        const response = result.response;
        const candidates = response.candidates;
        const text = candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (text.trim().length > 0) {
          return text;
        }
      } catch (error) {
        lastError = error;
      }
    }

    throw (lastError instanceof Error
      ? lastError
      : new Error('All configured Gemini models failed to generate a response'));
  }

  private getAnalysisMode(promptId?: string): string {
    const analysisModes: Record<string, string> = {
      'bias-framing': 'Bias framing analysis',
      'sentiment': 'Sentiment analysis',
      'emotion': 'Emotion analysis',
      'stance-opinion': 'Stance and opinion analysis',
      'topic-trends': 'Topic and theme analysis',
      'speaker-comparison': 'Cross-speaker comparison',
      'policy-impact': 'Policy impact analysis',
      'plain-answer': 'General retrieval and answer mode'
    };

    if (!promptId) {
      return 'General retrieval and answer mode';
    }

    return analysisModes[promptId] || 'General retrieval and answer mode';
  }

  /**
   * Main chat endpoint
   */
  async handleChatRequest(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();
    let execution: PromptExecution | null = null;

    try {
      const {
        query,
        context,
        model,
        userLanguage,
        prompt,
        sessionId,
        promptId,
        filters
      }: ChatRequest = req.body;

      // Input validation
      if (!query || typeof query !== 'string' || query.trim().length < 3) {
        res.status(400).json({
          error: 'Invalid query',
          message: 'Query must be a string with at least 3 characters'
        });
        return;
      }

      if (query.length > 2000) {
        res.status(400).json({
          error: 'Query too long',
          message: 'Query must be less than 2000 characters'
        });
        return;
      }

      // Sanitize query input
      const sanitizedQuery = query
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();

      if (!sanitizedQuery) {
        res.status(400).json({
          error: 'Invalid query content',
          message: 'Query contains invalid or malicious content'
        });
        return;
      }

      // Create execution record
      execution = {
        id: this.generateExecutionId(),
        sessionId,
        userId: (req as Request & { uid?: string }).uid,
        query: sanitizedQuery,
        originalLanguage: this.detectLanguage(sanitizedQuery),
        targetLanguage: userLanguage,
        modelUsed: model,
        startTime: new Date(),
        tokensInput: 0,
        tokensOutput: 0,
        cost: 0,
        confidence: 0,
        retrievedDocuments: context.length,
        status: 'running',
        filters
      };

      // Log execution start
      await this.logExecution(execution);

      // Route to appropriate model
      let response: ChatResponse;
      
      switch (model) {
        case 'gemini-flash':
          response = await this.executeWithGeminiFlash(prompt, query, context, promptId);
          break;
        case 'gpt-4o-mini':
          response = await this.executeWithGPT4oMini(prompt, query, context, promptId);
          break;
        case 'gemini-pro':
          response = await this.executeWithGeminiPro(prompt, query, context, promptId);
          break;
        default:
          throw new Error(`Unsupported model: ${model}`);
      }

      // Update execution record
      const endTime = Date.now();
      execution.endTime = new Date();
      execution.processingTimeMs = endTime - startTime;
      execution.tokensInput = response.tokensInput;
      execution.tokensOutput = response.tokensOutput;
      execution.cost = this.calculateCost(model, response.tokensInput, response.tokensOutput);
      execution.confidence = response.confidence;
      execution.response = response.text;
      execution.status = 'completed';

      // Log completed execution
      await this.logExecution(execution);
      await this.logModelPerformance(model, execution);

      res.json({
        ...response,
        executionId: execution.id,
        cost: execution.cost,
        processingTime: execution.processingTimeMs,
        promptId,
        analysisMode: this.getAnalysisMode(promptId)
      });

    } catch (error) {
      if (execution) {
        execution.error = error instanceof Error ? error.message : 'Unknown error';
        execution.status = 'failed';
        execution.endTime = new Date();
        execution.processingTimeMs = Date.now() - startTime;
        await this.logExecution(execution);
      }

      console.error('Chat request failed:', error);

      if (this.isModelUnavailableError(error)) {
        res.status(503).json({
          error: 'Model unavailable',
          message: 'The selected AI model is currently unavailable. Please try again later or choose a different query mode.',
          details: error instanceof Error ? error.message : 'Model backend unavailable'
        });
        return;
      }

      res.status(500).json({
        error: 'Chat request failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  /**
   * Execute with Gemini Flash (cost-optimized)
   */
  private async executeWithGeminiFlash(
    prompt: string,
    query: string,
    context: any[],
    _promptId?: string
  ): Promise<ChatResponse> {
    try {
      const generationConfig = {
        maxOutputTokens: 2048,
        temperature: 0.1,
        topP: 0.8,
      };
      const fullPrompt = `${prompt}\n\nContext: ${JSON.stringify(context)}\n\nQuery: ${query}`;
      const inputTokens = this.estimateTokens(fullPrompt);
      const text = await this.generateWithModelFallback(
        ['gemini-2.5-flash', 'gemini-2.5-flash-lite'],
        fullPrompt,
        generationConfig
      );
      const outputTokens = this.estimateTokens(text);

      return {
        text,
        tokensInput: inputTokens,
        tokensOutput: outputTokens,
        confidence: 0.85,
        model: 'gemini-flash',
        processingTime: 0,
        cost: this.calculateCost('gemini-flash', inputTokens, outputTokens)
      };
    } catch (error) {
      console.warn('Gemini Flash unavailable:', error);
      throw new Error(`Model unavailable: Gemini Flash. ${error instanceof Error ? error.message : 'Unknown model error'}`);
    }
  }

  /**
   * Execute with GPT-4o-mini (balanced performance)
   */
  private async executeWithGPT4oMini(
    _prompt: string,
    query: string,
    _context: any[],
    promptId?: string
  ): Promise<ChatResponse> {
    const mode = this.getAnalysisMode(promptId);
    throw new Error(`Model unavailable: gpt-4o-mini is not integrated for production responses (requested mode: ${mode}, query: ${query.slice(0, 80)}).`);
  }

  /**
   * Execute with Gemini Pro (highest quality)
   */
  private async executeWithGeminiPro(
    prompt: string,
    query: string,
    context: any[],
    _promptId?: string
  ): Promise<ChatResponse> {
    try {
      const generationConfig = {
        maxOutputTokens: 4096,
        temperature: 0.1,
        topP: 0.8,
      };
      const fullPrompt = `${prompt}\n\nContext: ${JSON.stringify(context)}\n\nQuery: ${query}`;
      const inputTokens = this.estimateTokens(fullPrompt);
      const text = await this.generateWithModelFallback(
        ['gemini-2.5-pro', 'gemini-2.5-flash'],
        fullPrompt,
        generationConfig
      );
      const outputTokens = this.estimateTokens(text);

      return {
        text,
        tokensInput: inputTokens,
        tokensOutput: outputTokens,
        confidence: 0.95,
        model: 'gemini-pro',
        processingTime: 0,
        cost: this.calculateCost('gemini-pro', inputTokens, outputTokens)
      };
    } catch (error) {
      console.warn('Gemini Pro unavailable:', error);
      throw new Error(`Model unavailable: Gemini Pro. ${error instanceof Error ? error.message : 'Unknown model error'}`);
    }
  }

  /**
   * Record user feedback
   */
  async recordFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { executionId, thumbsUp, thumbsDown, feedbackText } = req.body;

      const feedback = {
        executionId,
        thumbsUp,
        thumbsDown,
        feedbackText,
        timestamp: new Date()
      };

      // Store feedback
      await this.db.collection('chat_feedback').add(feedback);

      // Update execution record
      await this.db.collection('chat_executions').doc(executionId).update({
        thumbsUp,
        thumbsDown,
        feedbackText,
        feedbackTimestamp: new Date()
      });

      res.json({ success: true });
    } catch (error) {
      console.error('Failed to record feedback:', error);
      res.status(500).json({ error: 'Failed to record feedback' });
    }
  }

  async recordAccessRequest(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim().toLowerCase())) {
        res.status(400).json({ error: 'Valid email required' });
        return;
      }
      const normalised = email.trim().toLowerCase().slice(0, 254);

      // Prevent duplicates -- reject if a pending or approved request already exists
      const existing = await this.db.collection('access_requests')
        .where('email', '==', normalised)
        .where('status', 'in', ['pending', 'approved'])
        .limit(1)
        .get();
      if (!existing.empty) {
        const existingStatus = existing.docs[0].data().status as string;
        res.json({ success: true, alreadySubmitted: true, status: existingStatus });
        return;
      }

      await this.db.collection('access_requests').add({
        email: normalised,
        requestedAt: new Date(),
        status: 'pending',
      });

      // Fire-and-forget: never block the response on email delivery
      this.sendAccessRequestNotification(normalised).catch(e =>
        console.error('[email] Access request notification failed:', e)
      );
      res.json({ success: true, alreadySubmitted: false });
    } catch (error) {
      console.error('Failed to record access request:', error);
      res.status(500).json({ error: 'Failed to record request' });
    }
  }
  async recordStructuredFeedback(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId, messageId, executionId, queryText, sentiment, category, verbatim } = req.body;
      if (!sentiment || !['up', 'down'].includes(sentiment)) {
        res.status(400).json({ error: 'Invalid sentiment value' });
        return;
      }
      await this.db.collection('feedback').add({
        sessionId: sessionId ?? null,
        messageId: messageId ?? null,
        executionId: executionId ?? null,
        queryText: queryText ?? null,
        sentiment,
        category: category ?? null,
        verbatim: verbatim ?? null,
        timestamp: new Date(),
      });
      res.json({ success: true });
    } catch (error) {
      console.error('Failed to record structured feedback:', error);
      res.status(500).json({ error: 'Failed to record feedback' });
    }
  }

  /**
   * Get comprehensive metrics
   */
  async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const { timeRange = '24h' } = req.query;
      const hoursBack = this.parseTimeRange(timeRange as string);
      const cutoffTime = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

      // Query executions
      const executionsRef = this.db.collection('chat_executions');
      const snapshot = await executionsRef
        .where('startTime', '>=', cutoffTime)
        .get();

      const executions: PromptExecution[] = [];
      snapshot.forEach(doc => {
        executions.push({ id: doc.id, ...doc.data() } as PromptExecution);
      });

      // Calculate metrics
      const totalQueries = executions.length;
      const completedExecutions = executions.filter(e => e.status === 'completed');
      const failedExecutions = executions.filter(e => e.status === 'failed');

      // Model usage
      const modelUsage: Record<string, number> = {};
      executions.forEach(exec => {
        modelUsage[exec.modelUsed] = (modelUsage[exec.modelUsed] || 0) + 1;
      });

      // Performance metrics
      const averageProcessingTime = completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => sum + (e.processingTimeMs || 0), 0) / completedExecutions.length
        : 0;

      const averageCost = completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => sum + e.cost, 0) / completedExecutions.length
        : 0;

      const averageConfidence = completedExecutions.length > 0
        ? completedExecutions.reduce((sum, e) => sum + e.confidence, 0) / completedExecutions.length
        : 0;

      const averageRetrievedDocs = executions.length > 0
        ? executions.reduce((sum, e) => sum + e.retrievedDocuments, 0) / executions.length
        : 0;

      // User satisfaction
      const thumbsUpCount = executions.filter(e => e.thumbsUp).length;
      const thumbsDownCount = executions.filter(e => e.thumbsDown).length;
      const totalFeedback = thumbsUpCount + thumbsDownCount;
      const satisfactionRatio = totalFeedback > 0 ? thumbsUpCount / totalFeedback : 0;

      // Cost breakdown
      const costByModel: Record<string, number> = {};
      executions.forEach(exec => {
        costByModel[exec.modelUsed] = (costByModel[exec.modelUsed] || 0) + exec.cost;
      });
      const totalCost = Object.values(costByModel).reduce((sum, cost) => sum + cost, 0);

      // Prompt library usage
      const promptExecutions = executions.filter(e => e.promptId);
      const promptUsage: Record<string, { count: number; satisfaction: number[] }> = {};
      const analysisModeUsage: Record<string, { count: number; satisfaction: number[] }> = {};
      
      promptExecutions.forEach(exec => {
        if (!promptUsage[exec.promptId!]) {
          promptUsage[exec.promptId!] = { count: 0, satisfaction: [] };
        }
        promptUsage[exec.promptId!].count++;
        if (exec.thumbsUp !== undefined) {
          promptUsage[exec.promptId!].satisfaction.push(exec.thumbsUp ? 1 : 0);
        }

        const analysisMode = this.getAnalysisMode(exec.promptId);
        if (!analysisModeUsage[analysisMode]) {
          analysisModeUsage[analysisMode] = { count: 0, satisfaction: [] };
        }
        analysisModeUsage[analysisMode].count++;
        if (exec.thumbsUp !== undefined) {
          analysisModeUsage[analysisMode].satisfaction.push(exec.thumbsUp ? 1 : 0);
        }
      });

      const topPrompts = Object.entries(promptUsage)
        .map(([promptId, data]) => ({
          promptId,
          count: data.count,
          satisfaction: data.satisfaction.length > 0 
            ? data.satisfaction.reduce((sum, val) => sum + val, 0) / data.satisfaction.length
            : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      const topAnalysisModes = Object.entries(analysisModeUsage)
        .map(([analysisMode, data]) => ({
          analysisMode,
          count: data.count,
          satisfaction: data.satisfaction.length > 0
            ? data.satisfaction.reduce((sum, val) => sum + val, 0) / data.satisfaction.length
            : 0
        }))
        .sort((a, b) => b.count - a.count);

      const metrics = {
        totalQueries,
        modelUsage,
        averageProcessingTime: Math.round(averageProcessingTime),
        averageCost,
        userSatisfaction: {
          thumbsUp: thumbsUpCount,
          thumbsDown: thumbsDownCount,
          ratio: satisfactionRatio
        },
        promptLibraryUsage: {
          total: promptExecutions.length,
          topPrompts
        },
        analysisModeUsage: {
          total: promptExecutions.length,
          topAnalysisModes
        },
        costBreakdown: {
          totalCost,
          costByModel,
          averageCostPerQuery: totalQueries > 0 ? totalCost / totalQueries : 0
        },
        performanceMetrics: {
          averageConfidence,
          averageRetrievedDocs,
          errorRate: totalQueries > 0 ? failedExecutions.length / totalQueries : 0
        }
      };

      res.json(metrics);
    } catch (error) {
      console.error('Failed to get metrics:', error);
      res.status(500).json({ error: 'Failed to get metrics' });
    }
  }

  /**
   * Return the last ingestion date from BigQuery ingestion_metadata
   */
  async getDataStatus(_req: Request, res: Response): Promise<void> {
    try {
      const [rows] = await this.bq.query({
        query: `
          SELECT table_name, last_ingested_date, last_run_at, record_count
          FROM \`${BQ_PROJECT}.${BQ_DATASET}.ingestion_metadata\`
          ORDER BY last_run_at DESC
          LIMIT 10
        `,
        location: 'US',
      });

      const tables: Record<string, any> = {};
      let latestRunAt: string | null = null;

      for (const row of rows as any[]) {
        tables[row.table_name] = {
          lastIngestedDate: row.last_ingested_date,
          lastRunAt: row.last_run_at?.value || row.last_run_at,
          recordCount: row.record_count,
        };
        const runAt = row.last_run_at?.value || row.last_run_at;
        if (runAt && (!latestRunAt || runAt > latestRunAt)) {
          latestRunAt = runAt;
        }
      }

      res.json({
        lastUpdated: latestRunAt,
        tables,
        model: 'Google Gemini (Vertex AI)',
        dataSource: PARLIAMENT_DATA_SOURCE,
      });
    } catch (error) {
      // BigQuery dataset may not exist yet â€” return graceful degraded response
      res.json({ lastUpdated: null, tables: {}, model: 'Google Gemini (Vertex AI)', dataSource: PARLIAMENT_DATA_SOURCE });
    }
  }

  /**
   * Delete all chat history for a given sessionId (GDPR Article 17)
   */
  async deleteChatHistory(req: Request, res: Response): Promise<void> {
    try {
      const { sessionId } = req.body;
      if (!sessionId || typeof sessionId !== 'string') {
        res.status(400).json({ error: 'sessionId is required' });
        return;
      }

      const snapshot = await this.db
        .collection('chat_executions')
        .where('sessionId', '==', sessionId)
        .get();

      const batch = this.db.batch();
      snapshot.docs.forEach(doc => batch.delete(doc.ref));
      await batch.commit();

      const feedbackSnap = await this.db
        .collection('chat_feedback')
        .where('sessionId', '==', sessionId)
        .get();
      const feedbackBatch = this.db.batch();
      feedbackSnap.docs.forEach(doc => feedbackBatch.delete(doc.ref));
      await feedbackBatch.commit();

      res.json({ deleted: snapshot.size + feedbackSnap.size });
    } catch (error) {
      console.error('Delete history failed:', error);
      res.status(500).json({ error: 'Failed to delete history' });
    }
  }

  /**
   * Search and retrieve context documents from BigQuery
   */
  async searchContext(req: Request, res: Response): Promise<void> {
    try {
      const { query, limit = 20, filters } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length < 2) {
        res.status(400).json({ error: 'Invalid query' });
        return;
      }

      const clampedLimit = Math.min(Number(limit) || 20, 50);
      const cacheKey = JSON.stringify({ q: query.trim().toLowerCase(), limit: clampedLimit, filters });
      const cached = this.searchCache.get<any[]>(cacheKey);
      if (cached) {
        res.json({ documents: cached });
        return;
      }

      const documents = await this.queryBigQueryContext(query.trim(), clampedLimit, filters);
      this.searchCache.set(cacheKey, documents);
      res.json({ documents });
    } catch (error) {
      console.error('Search failed:', error);
      res.status(500).json({ error: 'Search failed' });
    }
  }

  /**
   * Search parliamentary data in BigQuery using keyword matching.
   * Uses parameterised queries to prevent SQL injection.
   */
  private async queryBigQueryContext(
    query: string,
    limit: number,
    filters?: any
  ): Promise<any[]> {
    // Split into up to 4 meaningful terms (â‰¥3 chars) for OR matching
    const terms = query
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length >= 3)
      .slice(0, 4);

    if (terms.length === 0) terms.push(query.toLowerCase());

    // Build LIKE conditions for each term across all text fields.
    // Each term is a separate named parameter so no user input is
    // interpolated into the SQL string.
    const buildLike = (field: string, paramName: string): string =>
      `LOWER(COALESCE(${field}, '')) LIKE CONCAT('%', @${paramName}, '%')`;

    const termParams = terms.map((t, i) => ({
      name: `term${i}`,
      value: t,
    }));

    const billsWhere = terms
      .map((_, i) =>
        `(${buildLike('title', `term${i}`)} OR ${buildLike('short_title', `term${i}`)} OR ${buildLike('status', `term${i}`)})`
      )
      .join(' OR ');

    const debatesWhere = terms
      .map((_, i) =>
        `(${buildLike('show_as', `term${i}`)} OR ${buildLike('speech_text', `term${i}`)} OR ${buildLike('speaker', `term${i}`)})`
      )
      .join(' OR ');

    const questionsWhere = terms
      .map((_, i) =>
        `(${buildLike('subject', `term${i}`)} OR ${buildLike('asked_by', `term${i}`)} OR ${buildLike('directed_to', `term${i}`)})`
      )
      .join(' OR ');

    // Optional date filter
    const dateFrom = filters?.dateFrom as string | undefined;
    const dateClauseBills     = dateFrom ? `AND date_introduced >= '${dateFrom}'` : '';
    const dateClauseDebates   = dateFrom ? `AND date >= '${dateFrom}'` : '';
    const dateClauseQuestions = dateFrom ? `AND date >= '${dateFrom}'` : '';

    const sql = `
      (
        SELECT
          'bill'              AS source_type,
          bill_id             AS id,
          COALESCE(short_title, title, bill_id) AS title,
          SUBSTR(COALESCE(title, ''), 0, 800)   AS content,
          CAST(date_introduced AS STRING)        AS date,
          uri,
          0.9                                   AS relevance
        FROM \`${BQ_PROJECT}.${BQ_DATASET}.bills\`
        WHERE (${billsWhere}) ${dateClauseBills}
      )
      UNION ALL
      (
        SELECT
          'debate'            AS source_type,
          speech_id           AS id,
          COALESCE(show_as, speech_id) AS title,
          SUBSTR(COALESCE(speech_text, show_as, ''), 0, 800) AS content,
          CAST(date AS STRING) AS date,
          uri,
          0.85                AS relevance
        FROM \`${BQ_PROJECT}.${BQ_DATASET}.debates\`
        WHERE (${debatesWhere}) ${dateClauseDebates}
      )
      UNION ALL
      (
        SELECT
          'question'          AS source_type,
          question_id         AS id,
          COALESCE(subject, 'Parliamentary Question') AS title,
          SUBSTR(COALESCE(subject, ''), 0, 800)       AS content,
          CAST(date AS STRING) AS date,
          uri,
          0.8                 AS relevance
        FROM \`${BQ_PROJECT}.${BQ_DATASET}.questions\`
        WHERE (${questionsWhere}) ${dateClauseQuestions}
      )
      ORDER BY date DESC, relevance DESC
      LIMIT @limit
    `;

    // Inject limit as a validated integer (already clamped to 50 above)
    const safeLimit = Number(limit);
    const sqlWithLimit = sql.replace('@limit', String(safeLimit));

    const [rows] = await this.bq.query({
      query: sqlWithLimit,
      params: Object.fromEntries(termParams.map(p => [p.name, p.value])),
      location: 'US',
    });

    return (rows as any[]).map(row => ({
      id:          row.id,
      title:       row.title,
      content:     row.content,
      source:      row.source_type,
      date:        row.date,
      uri:         row.uri,
      relevance:   row.relevance,
    }));
  }

  // Utility methods
  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private detectLanguage(text: string): 'en' | 'ga' {
    const irishIndicators = ['agus', 'go', 'an', 'na', 'ach', 'ar', 'le', 'tÃ¡', 'nÃ­l'];
    const normalizedText = text.toLowerCase();
    const irishCount = irishIndicators.filter(word => normalizedText.includes(word)).length;
    return irishCount > 0 ? 'ga' : 'en';
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.MODEL_PRICING[model as keyof typeof this.MODEL_PRICING];
    return (inputTokens * pricing.input / 1000000) + (outputTokens * pricing.output / 1000000);
  }

  private parseTimeRange(range: string): number {
    switch (range) {
      case '1h': return 1;
      case '24h': return 24;
      case '7d': return 24 * 7;
      case '30d': return 24 * 30;
      default: return 24;
    }
  }

  private async logExecution(execution: PromptExecution): Promise<void> {
    try {
      await this.db.collection('chat_executions').doc(execution.id).set(execution, { merge: true });
    } catch (error) {
      console.error('Failed to log execution:', error);
    }
  }

  private async logModelPerformance(model: string, execution: PromptExecution): Promise<void> {
    try {
      const performance = {
        model,
        sessionId: execution.sessionId,
        processingTime: execution.processingTimeMs,
        cost: execution.cost,
        confidence: execution.confidence,
        tokensUsed: execution.tokensInput + execution.tokensOutput,
        success: execution.status === 'completed',
        timestamp: new Date()
      };

      await this.db.collection('model_performance').add(performance);
    } catch (error) {
      console.error('Failed to log model performance:', error);
    }
  }

  // Sends an admin notification email when a new access request is submitted
  private async sendAccessRequestNotification(requesterEmail: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
    if (!apiKey || !adminEmail) return;
    const adminPanelUrl = process.env.PASSWORDLESS_CONTINUE_URL!.replace(/\/$/, '') + '/admin';
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM!,
        to: [adminEmail],
        subject: 'New access request: ' + requesterEmail,
        html: [
          '<div style="font-family:sans-serif;max-width:480px;margin:auto;color:#1e293b">',
          '<h2 style="color:#0b1f3a">New Access Request</h2>',
          '<p><strong>' + requesterEmail + '</strong> has requested access to Democratic AI.</p>',
          '<p style="text-align:center;margin:32px 0">',
          '  <a href="' + adminPanelUrl + '" ',
          '     style="background:#14b8a6;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600">',
          '     Review in Admin Panel</a>',
          '</p>',
          '</div>',
        ].join('')
      }),
    });
    if (!res.ok) throw new Error('Resend error ' + res.status);
    console.log('[email] Access request notification sent for', requesterEmail);
  }
}

// Export API class and route setup
export default ChatAPI;

export function setupChatRoutes(app: express.Application): void {
  const chatAPI = new ChatAPI();
  
  app.post('/api/chat',           requireAuth, (req, res) => chatAPI.handleChatRequest(req, res));
  app.post('/api/chat/feedback',  requireAuth, (req, res) => chatAPI.recordFeedback(req, res));
  app.post('/api/feedback',       requireAuth, (req, res) => chatAPI.recordStructuredFeedback(req, res));
  app.get('/api/chat/metrics',    requireAuth, (req, res) => chatAPI.getMetrics(req, res));
  app.post('/api/search',         requireAuth, (req, res) => chatAPI.searchContext(req, res));
  app.get('/api/data-status',         (req, res) => chatAPI.getDataStatus(req, res));
  app.post('/api/access-requests',     (req, res) => chatAPI.recordAccessRequest(req, res));
  app.delete('/api/chat/history', requireAuth, (req, res) => chatAPI.deleteChatHistory(req, res));
}
