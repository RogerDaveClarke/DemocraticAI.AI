/**
 * Chat Service with Hybrid AI Model Architecture and Comprehensive Metrics
 * Implements cost-optimized routing between Gemini Flash and GPT-4o-mini
 */

import { translationService, BilingualContent } from './TranslationService';
import { ChatMessage, PromptExecution, ChatMetrics } from '../interfaces/chat';

export type { ChatMessage, PromptExecution, ChatMetrics };

export interface ModelSelectionCriteria {
  complexity: number; // 0-1 scale
  contextSize: number; // tokens
  requiresDeepReasoning: boolean;
  isUrgent: boolean;
  costBudget: 'low' | 'medium' | 'high';
}

export interface ModelRoutingDecision {
  model: 'gemini-flash' | 'gpt-4o-mini' | 'gemini-pro';
  reasoning: string;
  estimatedCost: number;
  estimatedTokens: number;
  confidence: number;
}

class ChatService {
  private static instance: ChatService;
  private apiEndpoint: string;
  private sessionId: string;
  private userId?: string;

  // Model pricing (per 1M tokens)
  private readonly MODEL_PRICING = {
    'gemini-flash': { input: 0.075, output: 0.30 },
    'gpt-4o-mini': { input: 0.15, output: 0.60 },
    'gemini-pro': { input: 3.50, output: 10.50 }
  };

  constructor() {
    this.apiEndpoint = process.env.REACT_APP_API_BASE || '/api';
    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
  }

  public static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService();
    }
    return ChatService.instance;
  }

  /**
   * Analyze query complexity to determine optimal model routing
   */
  public analyzeQueryComplexity(query: string, context?: any[]): ModelSelectionCriteria {
    const wordCount = query.split(/\s+/).length;
    const contextSize = context ? this.estimateTokens(JSON.stringify(context)) : 0;
    
    // Complexity indicators
    const complexityIndicators = [
      query.includes('compare'), // Comparative analysis
      query.includes('analyze'), // Deep analysis
      query.includes('trend'), // Trend analysis  
      query.includes('relationship'), // Relationship mapping
      query.includes('summary'), // Summarization
      query.includes('pattern'), // Pattern recognition
      wordCount > 20, // Long queries
      contextSize > 30000 // Large context
    ];

    const complexity = complexityIndicators.filter(Boolean).length / complexityIndicators.length;
    
    const requiresDeepReasoning = [
      'why', 'how', 'explain', 'analyze', 'compare', 'evaluate', 
      'assess', 'determine', 'conclude', 'infer'
    ].some(term => query.toLowerCase().includes(term));

    return {
      complexity,
      contextSize,
      requiresDeepReasoning,
      isUrgent: false, // Could be determined by UI indicators
      costBudget: complexity > 0.7 ? 'high' : 'low'
    };
  }

  /**
   * Route query to optimal model based on analysis
   */
  public routeToOptimalModel(criteria: ModelSelectionCriteria): ModelRoutingDecision {
    const { complexity, contextSize, requiresDeepReasoning, costBudget } = criteria;

    // Conservative cost approach - prefer Gemini Flash
    if (complexity < 0.4 && contextSize < 20000 && !requiresDeepReasoning) {
      return {
        model: 'gemini-flash',
        reasoning: 'Simple query, cost-optimized routing',
        estimatedCost: this.calculateCost('gemini-flash', contextSize + 1000, 500),
        estimatedTokens: contextSize + 1500,
        confidence: 0.85
      };
    }

    // Use GPT-4o-mini for complex reasoning
    if (requiresDeepReasoning || complexity > 0.7) {
      return {
        model: 'gpt-4o-mini',
        reasoning: 'Complex reasoning required',
        estimatedCost: this.calculateCost('gpt-4o-mini', contextSize + 1500, 800),
        estimatedTokens: contextSize + 2300,
        confidence: 0.92
      };
    }

    // Use Gemini Pro for very large context or high-stakes queries
    if (contextSize > 40000 || costBudget === 'high') {
      return {
        model: 'gemini-pro',
        reasoning: 'Large context or high accuracy required',
        estimatedCost: this.calculateCost('gemini-pro', contextSize + 2000, 1000),
        estimatedTokens: contextSize + 3000,
        confidence: 0.95
      };
    }

    // Default to Gemini Flash
    return {
      model: 'gemini-flash',
      reasoning: 'Default cost-effective routing',
      estimatedCost: this.calculateCost('gemini-flash', contextSize + 1000, 600),
      estimatedTokens: contextSize + 1600,
      confidence: 0.80
    };
  }

  /**
   * Execute chat query with full metrics tracking
   */
  public async executeQuery(
    query: string,
    promptId?: string,
    filters?: any,
    userLanguage: 'en' | 'ga' = 'en'
  ): Promise<{ response: ChatMessage; execution: PromptExecution }> {
    
    const startTime = new Date();
    const detectedLanguage = translationService.detectLanguage(query);
    
    // Create execution record
    const execution: PromptExecution = {
      id: this.generateExecutionId(),
      promptId,
      sessionId: this.sessionId,
      userId: this.userId,
      query,
      originalLanguage: detectedLanguage as 'en' | 'ga',
      targetLanguage: userLanguage,
      modelUsed: 'gemini-flash', // Will be updated
      startTime,
      tokensInput: 0,
      tokensOutput: 0,
      cost: 0,
      confidence: 0,
      retrievedDocuments: 0,
      filters,
      status: 'running'
    };

    try {
      // Step 1: Retrieve relevant context
      const context = await this.retrieveContext(query, filters);
      execution.retrievedDocuments = context.length;

      // Step 2: Analyze complexity and route to optimal model
      const criteria = this.analyzeQueryComplexity(query, context);
      const routing = this.routeToOptimalModel(criteria);
      execution.modelUsed = routing.model;

      // Step 3: Execute query with selected model
      const response = await this.executeWithModel(
        query,
        context,
        routing.model,
        userLanguage
      );

      // Step 4: Calculate metrics
      const endTime = new Date();
      execution.endTime = endTime;
      execution.processingTimeMs = endTime.getTime() - startTime.getTime();
      execution.tokensInput = response.tokensInput;
      execution.tokensOutput = response.tokensOutput;
      execution.cost = this.calculateCost(routing.model, response.tokensInput, response.tokensOutput);
      execution.confidence = response.confidence;
      execution.response = response.text;
      execution.bilingualResponse = response.bilingualContent;
      execution.status = 'completed';

      // Step 5: Create chat message
      const chatMessage: ChatMessage = {
        id: this.generateMessageId(),
        text: response.text,
        bilingualContent: response.bilingualContent,
        sender: 'bot',
        timestamp: endTime,
        originalLanguage: userLanguage,
        metadata: {
          modelUsed: routing.model,
          tokensUsed: response.tokensInput + response.tokensOutput,
          cost: execution.cost,
          confidence: response.confidence,
          processingTime: execution.processingTimeMs,
          retrievedDocuments: context.length
        }
      };

      // Step 6: Log metrics
      await this.logExecution(execution);
      await this.logModelPerformance(routing.model, execution);

      return { response: chatMessage, execution };

    } catch (error) {
      execution.error = error instanceof Error ? error.message : 'Unknown error';
      execution.status = 'failed';
      execution.endTime = new Date();
      execution.processingTimeMs = execution.endTime.getTime() - startTime.getTime();
      
      await this.logExecution(execution);
      throw error;
    }
  }

  /**
   * Execute query with specific model
   */
  private async executeWithModel(
    query: string,
    context: any[],
    model: 'gemini-flash' | 'gpt-4o-mini' | 'gemini-pro',
    userLanguage: 'en' | 'ga'
  ): Promise<{
    text: string;
    bilingualContent?: BilingualContent;
    tokensInput: number;
    tokensOutput: number;
    confidence: number;
  }> {
    
    const optimizedContext = this.optimizeContext(query, context, model);
    const prompt = this.buildPrompt(query, optimizedContext, userLanguage);
    
    const response = await fetch(`${this.apiEndpoint}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({
        query,
        context: optimizedContext,
        model,
        userLanguage,
        prompt,
        sessionId: this.sessionId
      })
    });

    if (!response.ok) {
      throw new Error(`Chat API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    // Translate response if needed
    let bilingualContent: BilingualContent | undefined;
    if (userLanguage !== 'en') {
      bilingualContent = await translationService.translateChatMessage(
        result.text,
        userLanguage
      );
    }

    return {
      text: result.text,
      bilingualContent,
      tokensInput: result.tokensInput || this.estimateTokens(prompt),
      tokensOutput: result.tokensOutput || this.estimateTokens(result.text),
      confidence: result.confidence || 0.85
    };
  }

  /**
   * Optimize context for token efficiency
   */
  private optimizeContext(query: string, context: any[], model: string): any[] {
    const maxTokens = model === 'gemini-pro' ? 40000 : 
                    model === 'gpt-4o-mini' ? 30000 : 25000;
    
    // Score relevance and trim context
    const scoredContext = context.map(doc => ({
      ...doc,
      relevanceScore: this.calculateRelevance(query, doc)
    }));

    scoredContext.sort((a, b) => b.relevanceScore - a.relevanceScore);

    let tokenCount = 0;
    const optimized = [];

    for (const doc of scoredContext) {
      const docTokens = this.estimateTokens(JSON.stringify(doc));
      if (tokenCount + docTokens < maxTokens) {
        optimized.push(doc);
        tokenCount += docTokens;
      } else {
        break;
      }
    }

    return optimized;
  }

  /**
   * Build context-aware prompt
   */
  private buildPrompt(query: string, context: any[], userLanguage: 'en' | 'ga'): string {
    const languageInstruction = userLanguage === 'ga' 
      ? 'Respond in Irish (Gaeilge) unless the user specifically requests English.'
      : 'Respond in English unless the user specifically requests Irish (Gaeilge).';

    return `You are an expert assistant for the Irish Parliament (Oireachtas) with access to comprehensive parliamentary data.

${languageInstruction}

CONTEXT (Parliamentary Data):
${JSON.stringify(context, null, 2)}

INSTRUCTIONS:
- Provide accurate, fact-based answers using ONLY the provided context
- Cite specific documents, dates, and sources
- Preserve parliamentary terms (Dáil, Seanad, Taoiseach, etc.)
- If information is not in the context, clearly state this
- For voting records, include vote tallies and key positions
- For legislation, reference bill numbers, stages, and sponsors
- For debates, cite speakers and key points
- Be concise but comprehensive

USER QUERY: ${query}

RESPONSE:`;
  }

  /**
   * Record user feedback
   */
  public async recordFeedback(
    executionId: string,
    thumbsUp?: boolean,
    thumbsDown?: boolean,
    feedbackText?: string
  ): Promise<void> {
    
    const feedback = {
      executionId,
      sessionId: this.sessionId,
      userId: this.userId,
      thumbsUp,
      thumbsDown,
      feedbackText,
      timestamp: new Date()
    };

    await fetch(`${this.apiEndpoint}/chat/feedback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(feedback)
    });

    // Update execution record
    await this.updateExecutionFeedback(executionId, feedback);
  }

  /**
   * Get metrics for dashboard
   */
  public async getMetrics(timeRange: '1h' | '24h' | '7d' | '30d' = '24h'): Promise<{
    totalQueries: number;
    modelUsage: Record<string, number>;
    averageProcessingTime: number;
    averageCost: number;
    userSatisfaction: {
      thumbsUp: number;
      thumbsDown: number;
      ratio: number;
    };
    promptLibraryUsage: {
      total: number;
      topPrompts: Array<{ promptId: string; count: number; satisfaction: number }>;
    };
    analysisModeUsage: {
      total: number;
      topAnalysisModes: Array<{ analysisMode: string; count: number; satisfaction: number }>;
    };
    costBreakdown: {
      totalCost: number;
      costByModel: Record<string, number>;
      averageCostPerQuery: number;
    };
    performanceMetrics: {
      averageConfidence: number;
      averageRetrievedDocs: number;
      errorRate: number;
    };
  }> {
    
    const response = await fetch(`${this.apiEndpoint}/chat/metrics?timeRange=${timeRange}`, {
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metrics: ${response.status}`);
    }

    return response.json();
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getUserId(): string | undefined {
    return localStorage.getItem('userId') || undefined;
  }

  private getAuthToken(): string {
    return localStorage.getItem('authToken') || '';
  }

  private estimateTokens(text: string): number {
    return Math.ceil(text.length / 4); // Rough approximation
  }

  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = this.MODEL_PRICING[model as keyof typeof this.MODEL_PRICING];
    return (inputTokens * pricing.input / 1000000) + (outputTokens * pricing.output / 1000000);
  }

  private calculateRelevance(query: string, document: any): number {
    // Simple relevance scoring - could be enhanced with vector similarity
    const queryTerms = query.toLowerCase().split(/\s+/);
    const docText = JSON.stringify(document).toLowerCase();
    
    const matches = queryTerms.filter(term => docText.includes(term)).length;
    return matches / queryTerms.length;
  }

  async getDataStatus(): Promise<{ lastUpdated: string | null; model: string; dataSource: string }> {
    try {
      const response = await fetch(`${this.apiEndpoint}/data-status`);
      if (response.ok) return response.json();
    } catch (_) { /* ignore */ }
    return { lastUpdated: null, model: 'Google Gemini', dataSource: 'Oireachtas Open Data' };
  }

  async deleteChatHistory(): Promise<{ deleted: number }> {
    const response = await fetch(`${this.apiEndpoint}/chat/history`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${this.getAuthToken()}` },
      body: JSON.stringify({ sessionId: this.sessionId }),
    });
    if (!response.ok) throw new Error('Failed to delete history');
    return response.json();
  }

  private async retrieveContext(query: string, filters?: any): Promise<any[]> {
    // This would integrate with your RAG system
    const response = await fetch(`${this.apiEndpoint}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify({
        query,
        filters,
        limit: 20 // Configurable
      })
    });

    if (response.ok) {
      const result = await response.json();
      return result.documents || [];
    }
    
    return [];
  }

  private async logExecution(execution: PromptExecution): Promise<void> {
    await fetch(`${this.apiEndpoint}/metrics/executions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(execution)
    });
  }

  private async logModelPerformance(model: string, execution: PromptExecution): Promise<void> {
    const performance = {
      model,
      sessionId: this.sessionId,
      processingTime: execution.processingTimeMs,
      cost: execution.cost,
      confidence: execution.confidence,
      tokensUsed: execution.tokensInput + execution.tokensOutput,
      success: execution.status === 'completed',
      timestamp: new Date()
    };

    await fetch(`${this.apiEndpoint}/metrics/model-performance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(performance)
    });
  }

  private async updateExecutionFeedback(executionId: string, feedback: any): Promise<void> {
    await fetch(`${this.apiEndpoint}/metrics/executions/${executionId}/feedback`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.getAuthToken()}`
      },
      body: JSON.stringify(feedback)
    });
  }
}

export const chatService = ChatService.getInstance();
export default ChatService;