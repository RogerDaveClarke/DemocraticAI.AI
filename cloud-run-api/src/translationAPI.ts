/**
 * Backend Translation API Integration
 * Cloud Run service endpoints for handling translation requests
 */

import express from 'express';
import { Request, Response } from 'express';

interface TranslationRequest {
  text: string;
  sourceLanguage: 'en' | 'ga' | 'auto';
  targetLanguage: 'en' | 'ga';
  context?: 'parliamentary' | 'general';
  model?: 'gemini-flash' | 'gemini-pro' | 'google-translate';
  prompt?: string;
}

interface TranslationResponse {
  translatedText: string;
  sourceLanguage: 'en' | 'ga';
  targetLanguage: 'en' | 'ga';
  confidence: number;
  method: 'gemini' | 'google-translate' | 'cached';
  cost: number;
  tokensUsed?: {
    input: number;
    output: number;
  };
}

/**
 * Translation service using Gemini Flash for cost-effective Irish translation
 */
class TranslationAPI {
  private cache: Map<string, TranslationResponse> = new Map();
  // private vertexAI: any; // Would be imported from @google-cloud/vertexai
  
  constructor() {
    // Initialize Vertex AI client
    // this.vertexAI = new VertexAI({...});
  }

  /**
   * Main translation endpoint
   */
  async translateText(req: Request, res: Response): Promise<void> {
    try {
      const {
        text,
        sourceLanguage,
        targetLanguage,
        context = 'parliamentary',
        model = 'gemini-flash'
      }: TranslationRequest = req.body;

      // Validate input
      if (!text || !targetLanguage) {
        res.status(400).json({ error: 'Missing required fields: text, targetLanguage' });
        return;
      }

      // Check cache first
      const cacheKey = `${text}_${sourceLanguage}_${targetLanguage}_${context}`;
      if (this.cache.has(cacheKey)) {
        const cachedResult = this.cache.get(cacheKey)!;
        res.json(cachedResult);
        return;
      }

      // Detect source language if auto
      const detectedSource = sourceLanguage === 'auto' 
        ? this.detectLanguage(text)
        : sourceLanguage;

      // Skip translation if already in target language
      if (detectedSource === targetLanguage) {
        const result: TranslationResponse = {
          translatedText: text,
          sourceLanguage: detectedSource as 'en' | 'ga',
          targetLanguage,
          confidence: 1.0,
          method: 'cached',
          cost: 0
        };
        res.json(result);
        return;
      }

      // Perform translation based on model choice
      let result: TranslationResponse;
      
      switch (model) {
        case 'gemini-flash':
          result = await this.translateWithGeminiFlash(text, detectedSource as 'en' | 'ga', targetLanguage, context);
          break;
        case 'gemini-pro':
          result = await this.translateWithGeminiPro(text, detectedSource as 'en' | 'ga', targetLanguage, context);
          break;
        case 'google-translate':
          result = await this.translateWithGoogleTranslate(text, detectedSource as 'en' | 'ga', targetLanguage);
          break;
        default:
          result = await this.translateWithGeminiFlash(text, detectedSource as 'en' | 'ga', targetLanguage, context);
      }

      // Cache result
      this.cache.set(cacheKey, result);

      res.json(result);
    } catch (error) {
      console.error('Translation error:', error);
      res.status(500).json({ 
        error: 'Translation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      });
    }
  }

  /**
   * Detect language using simple heuristics
   */
  private detectLanguage(text: string): 'en' | 'ga' {
    const normalizedText = text.toLowerCase();
    
    // Irish language indicators
    const irishIndicators = [
      'agus', 'go', 'an', 'na', 'ach', 'ar', 'le', 'gabhaim', 'buíochas',
      'tá', 'níl', 'staon', 'bille', 'acht', 'aire', 'teachta', 'oireachtas',
      'dáil', 'seanad', 'taoiseach', 'tánaiste', 'ceann comhairle',
      'coiste', 'díospóireacht', 'rún', 'leasú', 'ceist', 'ball',
      'toghcheantar', 'parlaimint', 'rialtas'
    ];

    // English indicators  
    const englishIndicators = [
      'the', 'and', 'to', 'of', 'in', 'that', 'thank', 'minister',
      'yes', 'no', 'bill', 'act', 'deputy', 'parliament', 'government',
      'committee', 'motion', 'debate', 'question', 'member', 'constituency',
      'election', 'vote', 'session', 'business', 'proposal', 'report'
    ];

    const irishCount = irishIndicators.filter(indicator => 
      normalizedText.includes(indicator)
    ).length;

    const englishCount = englishIndicators.filter(indicator => 
      normalizedText.includes(indicator)
    ).length;

    // Check for Irish fada marks
    const irishAccents = /[áéíóúÁÉÍÓÚ]/g;
    const hasIrishAccents = irishAccents.test(text);

    if (irishCount > englishCount || hasIrishAccents) {
      return 'ga';
    }
    
    return 'en';
  }

  /**
   * Translate using Gemini Flash (cost-effective)
   */
  private async translateWithGeminiFlash(
    text: string,
    sourceLanguage: 'en' | 'ga',
    targetLanguage: 'en' | 'ga',
    context: string
  ): Promise<TranslationResponse> {
    
    const prompt = this.buildTranslationPrompt(text, sourceLanguage, targetLanguage, context);
    
    // Estimate token count (rough approximation)
    const inputTokens = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = Math.ceil(text.length / 3); // Translation usually shorter

    try {
      // This would be the actual Vertex AI call
      // const response = await this.vertexAI.preview.generateContent({
      //   model: 'gemini-1.5-flash',
      //   contents: [{ role: 'user', parts: [{ text: prompt }] }],
      //   generationConfig: {
      //     maxOutputTokens: 2048,
      //     temperature: 0.1, // Low temperature for consistent translation
      //   }
      // });

      // Mock response for development
      const mockTranslation = this.getMockTranslation(text, sourceLanguage, targetLanguage);
      
      const result: TranslationResponse = {
        translatedText: mockTranslation,
        sourceLanguage,
        targetLanguage,
        confidence: 0.88,
        method: 'gemini',
        cost: this.calculateGeminiCost(inputTokens, estimatedOutputTokens, 'flash'),
        tokensUsed: {
          input: inputTokens,
          output: estimatedOutputTokens
        }
      };

      return result;
    } catch (error) {
      console.error('Gemini Flash translation failed:', error);
      throw new Error(`Gemini translation failed: ${error}`);
    }
  }

  /**
   * Translate using Gemini Pro (higher quality, higher cost)
   */
  private async translateWithGeminiPro(
    text: string,
    sourceLanguage: 'en' | 'ga',
    targetLanguage: 'en' | 'ga',
    context: string
  ): Promise<TranslationResponse> {
    
    const prompt = this.buildTranslationPrompt(text, sourceLanguage, targetLanguage, context);
    const inputTokens = Math.ceil(prompt.length / 4);
    const estimatedOutputTokens = Math.ceil(text.length / 3);

    // Similar implementation to Flash but with gemini-1.5-pro model
    const mockTranslation = this.getMockTranslation(text, sourceLanguage, targetLanguage);
    
    return {
      translatedText: mockTranslation,
      sourceLanguage,
      targetLanguage,
      confidence: 0.92,
      method: 'gemini',
      cost: this.calculateGeminiCost(inputTokens, estimatedOutputTokens, 'pro'),
      tokensUsed: {
        input: inputTokens,
        output: estimatedOutputTokens
      }
    };
  }

  /**
   * Fallback to Google Translate API
   */
  private async translateWithGoogleTranslate(
    text: string,
    sourceLanguage: 'en' | 'ga',
    targetLanguage: 'en' | 'ga'
  ): Promise<TranslationResponse> {
    
    // This would integrate with Google Cloud Translate API
    const mockTranslation = this.getMockTranslation(text, sourceLanguage, targetLanguage);
    
    return {
      translatedText: mockTranslation,
      sourceLanguage,
      targetLanguage,
      confidence: 0.82,
      method: 'google-translate',
      cost: 0.00002 // Google Translate pricing per character
    };
  }

  /**
   * Build context-aware translation prompt
   */
  private buildTranslationPrompt(
    text: string,
    _sourceLanguage: 'en' | 'ga',
    targetLanguage: 'en' | 'ga',
    context: string
  ): string {
    
    const isToIrish = targetLanguage === 'ga';
    const parliamentaryContext = context === 'parliamentary' 
      ? 'This is Irish parliamentary/political content. ' 
      : '';

    if (isToIrish) {
      return `${parliamentaryContext}Translate the following English text to Irish (Gaeilge). 
      
      Important guidelines:
      - Preserve parliamentary terms like 'Dáil', 'Seanad', 'Teachta Dála', 'Taoiseach', 'Tánaiste'
      - Use formal parliamentary Irish appropriate for official proceedings
      - Maintain the tone and register of the original
      - For voting terms: "Yes" = "Tá", "No" = "Níl", "Abstain" = "Staon"
      - For titles: "Minister" = "Aire", "Deputy" = "Teachta"
      
      Text to translate: "${text}"
      
      Provide only the Irish translation without explanations or notes.`;
    } else {
      return `${parliamentaryContext}Translate the following Irish (Gaeilge) text to English. 
      
      Important guidelines:
      - Preserve parliamentary terms and provide context where helpful
      - Use formal English appropriate for parliamentary proceedings
      - For voting terms: "Tá" = "Yes (Tá)", "Níl" = "No (Níl)", "Staon" = "Abstain (Staon)"
      - Maintain the formal tone of parliamentary language
      - Keep Irish titles like 'Taoiseach', 'Tánaiste' with brief explanations if needed
      
      Text to translate: "${text}"
      
      Provide only the English translation without explanations or notes.`;
    }
  }

  /**
   * Calculate Gemini API costs
   */
  private calculateGeminiCost(
    inputTokens: number, 
    outputTokens: number, 
    model: 'flash' | 'pro'
  ): number {
    
    const pricing = model === 'flash' 
      ? { input: 0.075 / 1000000, output: 0.30 / 1000000 }  // Flash pricing
      : { input: 3.50 / 1000000, output: 10.50 / 1000000 }; // Pro pricing

    return (inputTokens * pricing.input) + (outputTokens * pricing.output);
  }

  /**
   * Mock translation for development
   */
  private getMockTranslation(
    text: string, 
    sourceLanguage: 'en' | 'ga', 
    targetLanguage: 'en' | 'ga'
  ): string {
    
    if (sourceLanguage === 'en' && targetLanguage === 'ga') {
      // Simple English to Irish mappings for demo
      return text
        .replace(/parliament/gi, 'parlaimint')
        .replace(/government/gi, 'rialtas')
        .replace(/minister/gi, 'aire')
        .replace(/committee/gi, 'coiste')
        .replace(/bill/gi, 'bille')
        .replace(/act/gi, 'acht')
        .replace(/debate/gi, 'díospóireacht')
        .replace(/question/gi, 'ceist')
        .replace(/member/gi, 'ball')
        .replace(/and/gi, 'agus')
        .replace(/the/gi, 'an')
        .replace(/yes/gi, 'tá')
        .replace(/no/gi, 'níl');
    } else if (sourceLanguage === 'ga' && targetLanguage === 'en') {
      // Simple Irish to English mappings for demo
      return text
        .replace(/parlaimint/gi, 'parliament')
        .replace(/rialtas/gi, 'government')
        .replace(/aire/gi, 'minister')
        .replace(/coiste/gi, 'committee')
        .replace(/bille/gi, 'bill')
        .replace(/acht/gi, 'act')
        .replace(/díospóireacht/gi, 'debate')
        .replace(/ceist/gi, 'question')
        .replace(/ball/gi, 'member')
        .replace(/agus/gi, 'and')
        .replace(/tá/gi, 'yes (Tá)')
        .replace(/níl/gi, 'no (Níl)')
        .replace(/staon/gi, 'abstain (Staon)');
    }
    
    return text; // Return original if no translation rules apply
  }

  /**
   * Get translation statistics
   */
  async getTranslationStats(_req: Request, res: Response): Promise<void> {
    const stats = {
      cacheSize: this.cache.size,
      totalTranslations: this.cache.size,
      costSavings: Array.from(this.cache.values())
        .filter(result => result.cost === 0)
        .length * 0.001,
      averageConfidence: Array.from(this.cache.values())
        .reduce((sum, result) => sum + result.confidence, 0) / this.cache.size || 0
    };

    res.json(stats);
  }

  /**
   * Clear translation cache
   */
  async clearCache(_req: Request, res: Response): Promise<void> {
    this.cache.clear();
    res.json({ message: 'Translation cache cleared' });
  }
}

// Export the API class and setup routes
export default TranslationAPI;

// Router setup for Express app
export function setupTranslationRoutes(app: express.Application): void {
  const translationAPI = new TranslationAPI();
  
  app.post('/api/translate', (req, res) => translationAPI.translateText(req, res));
  app.get('/api/translation-stats', (req, res) => translationAPI.getTranslationStats(req, res));
  app.delete('/api/translation-cache', (req, res) => translationAPI.clearCache(req, res));
}