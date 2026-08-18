/**
 * Comprehensive Irish-English Translation Service for Enquire
 * Supports both real-time chat translation and data processing
 */

export interface TranslationOptions {
  targetLanguage: 'en' | 'ga';
  sourceLanguage?: 'en' | 'ga' | 'auto';
  context?: 'parliamentary' | 'general';
  preserveTerms?: string[]; // Parliamentary terms to not translate
}

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: 'en' | 'ga';
  targetLanguage: 'en' | 'ga';
  confidence: number;
  method: 'gemini' | 'google-translate' | 'cached' | 'parliamentary-dictionary';
  cost: number; // in USD
}

export interface BilingualContent {
  en: string;
  ga: string;
  detected_language?: 'en' | 'ga' | 'mixed';
}

class TranslationService {
  private static instance: TranslationService;
  private cache: Map<string, TranslationResult> = new Map();
  private parliamentaryTerms: Map<string, string> = new Map();
  private apiEndpoint: string;
  
  // Parliamentary terms that should be handled specially
  private readonly PARLIAMENTARY_TERMS_GA_TO_EN = new Map([
    ['Dáil', 'Dáil'],
    ['Seanad', 'Seanad'], 
    ['Oireachtas', 'Oireachtas'],
    ['Teachta Dála', 'TD'],
    ['Tánaiste', 'Tánaiste'],
    ['Taoiseach', 'Taoiseach'],
    ['Cathaoirleach', 'Chairperson'],
    ['Leas-Cathaoirleach', 'Deputy Chairperson'],
    ['Ceann Comhairle', 'Ceann Comhairle'],
    ['Deputy', 'Deputy'],
    ['Minister', 'Aire'],
    ['Tá', 'Yes (Tá)'],
    ['Níl', 'No (Níl)'],
    ['Staon', 'Abstain (Staon)'],
    ['Bille', 'Bill'],
    ['Acht', 'Act'],
    ['Céim', 'Stage'],
    ['agus', 'and'],
    ['nó', 'or'],
    ['le', 'with'],
    ['ar', 'on'],
    ['i', 'in'],
    ['go', 'to'],
    ['ach', 'but'],
    ['an', 'the'],
    ['na', 'the'],
    ['buíochas', 'thanks'],
    ['Gabhaim', 'I thank']
  ]);

  private readonly PARLIAMENTARY_TERMS_EN_TO_GA = new Map([
    ['Parliament', 'Parlaimint'],
    ['Government', 'Rialtas'],
    ['Opposition', 'Freasúra'],
    ['Committee', 'Coiste'],
    ['Motion', 'Rún'],
    ['Amendment', 'Leasú'],
    ['Division', 'Vótáil'],
    ['Question', 'Ceist'],
    ['Debate', 'Díospóireacht'],
    ['Speech', 'Óráid'],
    ['Member', 'Ball'],
    ['Constituency', 'Toghcheantar'],
    ['Election', 'Toghchán'],
    ['Vote', 'Vóta'],
    ['Session', 'Seisiún'],
    ['Order', 'Ordú'],
    ['Business', 'Gnó'],
    ['Proposal', 'Togra'],
    ['Report', 'Tuarascáil'],
    ['Public', 'Poiblí'],
    ['Private', 'Príobháideach'],
    ['Finance', 'Airgeadas'],
    ['Education', 'Oideachas'],
    ['Health', 'Sláinte'],
    ['Housing', 'Tithíocht'],
    ['Transport', 'Iompar'],
    ['Justice', 'Dlí agus Cirt']
  ]);

  constructor() {
    this.apiEndpoint = process.env.REACT_APP_API_BASE || '/api';
    this.initializeParliamentaryTerms();
  }

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  private initializeParliamentaryTerms(): void {
    // Combine both directions for comprehensive lookup
    this.PARLIAMENTARY_TERMS_GA_TO_EN.forEach((en, ga) => {
      this.parliamentaryTerms.set(ga.toLowerCase(), en);
    });
    this.PARLIAMENTARY_TERMS_EN_TO_GA.forEach((ga, en) => {
      this.parliamentaryTerms.set(en.toLowerCase(), ga);
    });
  }

  /**
   * Detect language of input text
   */
  public detectLanguage(text: string): 'en' | 'ga' | 'mixed' {
    if (!text || text.trim().length === 0) return 'en';

    const normalizedText = text.toLowerCase();
    
    // Irish language indicators
    const irishIndicators = [
      'agus', 'go', 'an', 'na', 'ach', 'ar', 'le', 'gabhaim', 'buíochas',
      'tá', 'níl', 'staon', 'bille', 'acht', 'aire', 'teachta', 'oireachtas',
      'dáil', 'seanad', 'taoiseach', 'tánaiste', 'ceann comhairle'
    ];

    // English indicators  
    const englishIndicators = [
      'the', 'and', 'to', 'of', 'in', 'that', 'thank', 'minister',
      'yes', 'no', 'bill', 'act', 'deputy', 'parliament', 'government',
      'committee', 'motion', 'debate', 'question', 'member'
    ];

    const irishCount = irishIndicators.filter(indicator => 
      normalizedText.includes(indicator)
    ).length;

    const englishCount = englishIndicators.filter(indicator => 
      normalizedText.includes(indicator)
    ).length;

    if (irishCount > englishCount) return 'ga';
    if (englishCount > irishCount) return 'en';
    
    // Check for Irish fada marks (áéíóú)
    const irishAccents = /[áéíóúÁÉÍÓÚ]/g;
    if (irishAccents.test(text)) return 'ga';
    
    return 'mixed';
  }

  /**
   * Translate text using the most appropriate method
   */
  public async translateText(
    text: string, 
    options: TranslationOptions
  ): Promise<TranslationResult> {
    
    // Check cache first
    const cacheKey = `${text}_${options.targetLanguage}_${options.sourceLanguage || 'auto'}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Detect source language if not specified
    const sourceLanguage = options.sourceLanguage === 'auto' || !options.sourceLanguage
      ? this.detectLanguage(text)
      : options.sourceLanguage;

    // Skip translation if already in target language
    if (sourceLanguage === options.targetLanguage) {
      const result: TranslationResult = {
        translatedText: text,
        sourceLanguage: sourceLanguage as 'en' | 'ga',
        targetLanguage: options.targetLanguage,
        confidence: 1.0,
        method: 'cached',
        cost: 0
      };
      this.cache.set(cacheKey, result);
      return result;
    }

    // Try parliamentary dictionary first for common terms
    const dictionaryResult = this.translateWithDictionary(text, options);
    if (dictionaryResult) {
      this.cache.set(cacheKey, dictionaryResult);
      return dictionaryResult;
    }

    // Use AI translation for complex text
    try {
      const aiResult = await this.translateWithAI(text, options, sourceLanguage as 'en' | 'ga');
      this.cache.set(cacheKey, aiResult);
      return aiResult;
    } catch (error) {
      console.error('AI translation failed, falling back to Google Translate:', error);
      return this.translateWithGoogleTranslate(text, options, sourceLanguage as 'en' | 'ga');
    }
  }

  /**
   * Translate using parliamentary dictionary for common terms
   */
  private translateWithDictionary(
    text: string, 
    options: TranslationOptions
  ): TranslationResult | null {
    
    const normalizedText = text.toLowerCase().trim();
    
    // Check if it's a simple parliamentary term
    if (this.parliamentaryTerms.has(normalizedText)) {
      const translation = this.parliamentaryTerms.get(normalizedText)!;
      
      return {
        translatedText: translation,
        sourceLanguage: options.sourceLanguage as 'en' | 'ga' || 'ga',
        targetLanguage: options.targetLanguage,
        confidence: 0.95,
        method: 'parliamentary-dictionary',
        cost: 0
      };
    }

    return null;
  }

  /**
   * Translate using AI (Gemini Flash for cost efficiency)
   */
  private async translateWithAI(
    text: string,
    options: TranslationOptions,
    sourceLanguage: 'en' | 'ga'
  ): Promise<TranslationResult> {
    
    const prompt = this.buildTranslationPrompt(text, options, sourceLanguage);
    
    const response = await fetch(`${this.apiEndpoint}/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        sourceLanguage,
        targetLanguage: options.targetLanguage,
        context: options.context || 'parliamentary',
        prompt,
        model: 'gemini-flash' // Cost-effective choice
      })
    });

    if (!response.ok) {
      throw new Error(`Translation API error: ${response.status}`);
    }

    const result = await response.json();
    
    return {
      translatedText: result.translatedText,
      sourceLanguage,
      targetLanguage: options.targetLanguage,
      confidence: result.confidence || 0.85,
      method: 'gemini',
      cost: result.cost || 0.001 // Estimate for Gemini Flash
    };
  }

  /**
   * Fallback to Google Translate API
   */
  private async translateWithGoogleTranslate(
    text: string,
    options: TranslationOptions,
    sourceLanguage: 'en' | 'ga'
  ): Promise<TranslationResult> {
    
    // This would integrate with Google Translate API
    // For now, return a placeholder
    return {
      translatedText: `[Google Translate: ${text}]`,
      sourceLanguage,
      targetLanguage: options.targetLanguage,
      confidence: 0.75,
      method: 'google-translate',
      cost: 0.00002 // Google Translate pricing
    };
  }

  /**
   * Build context-aware translation prompt for AI
   */
  private buildTranslationPrompt(
    text: string,
    options: TranslationOptions,
    _sourceLanguage: 'en' | 'ga'
  ): string {
    
    const isToIrish = options.targetLanguage === 'ga';
    const contextHint = options.context === 'parliamentary' 
      ? 'This is Irish parliamentary/political content. '
      : '';

    if (isToIrish) {
      return `${contextHint}Translate the following English text to Irish (Gaeilge). 
      Preserve parliamentary terms like 'Dáil', 'Seanad', 'Teachta Dála', 'Taoiseach', etc. 
      Use formal parliamentary language appropriate for official proceedings.
      
      Text to translate: "${text}"
      
      Provide only the Irish translation, no explanations.`;
    } else {
      return `${contextHint}Translate the following Irish (Gaeilge) text to English. 
      Preserve parliamentary terms and provide context where helpful (e.g., "Tá" as "Yes (Tá)").
      Use formal English appropriate for parliamentary proceedings.
      
      Text to translate: "${text}"
      
      Provide only the English translation, no explanations.`;
    }
  }

  /**
   * Translate chat messages in real-time
   */
  public async translateChatMessage(
    message: string,
    userLanguagePreference: 'en' | 'ga' = 'en'
  ): Promise<BilingualContent> {
    
    const detectedLanguage = this.detectLanguage(message);
    
    // If user prefers English and message is in Irish, translate to English
    if (userLanguagePreference === 'en' && detectedLanguage === 'ga') {
      const translation = await this.translateText(message, {
        targetLanguage: 'en',
        sourceLanguage: 'ga',
        context: 'parliamentary'
      });
      
      return {
        en: translation.translatedText,
        ga: message,
        detected_language: 'ga'
      };
    }
    
    // If user prefers Irish and message is in English, translate to Irish
    if (userLanguagePreference === 'ga' && detectedLanguage === 'en') {
      const translation = await this.translateText(message, {
        targetLanguage: 'ga',
        sourceLanguage: 'en',
        context: 'parliamentary'
      });
      
      return {
        en: message,
        ga: translation.translatedText,
        detected_language: 'en'
      };
    }
    
    // Return original message in both fields if no translation needed
    return {
      en: detectedLanguage === 'en' ? message : '',
      ga: detectedLanguage === 'ga' ? message : '',
      detected_language: detectedLanguage
    };
  }

  /**
   * Get bilingual content from your existing data
   */
  public extractBilingualContent(data: any): BilingualContent | null {
    // Handle legislation data
    if (data.short_title_en && data.short_title_ga) {
      return {
        en: data.short_title_en,
        ga: data.short_title_ga
      };
    }
    
    // Handle long titles
    if (data.long_title_en && data.long_title_ga) {
      return {
        en: this.cleanHtmlContent(data.long_title_en),
        ga: this.cleanHtmlContent(data.long_title_ga)
      };
    }
    
    return null;
  }

  /**
   * Clean HTML content (similar to your existing method)
   */
  private cleanHtmlContent(content: string): string {
    if (!content) return '';
    return content.replace(/<[^>]*>/g, '').trim();
  }

  /**
   * Get translation statistics
   */
  public getTranslationStats(): {
    cacheSize: number;
    totalTranslations: number;
    costSavings: number;
  } {
    return {
      cacheSize: this.cache.size,
      totalTranslations: this.cache.size,
      costSavings: Array.from(this.cache.values())
        .filter(result => result.method === 'parliamentary-dictionary' || result.method === 'cached')
        .length * 0.001 // Estimated savings per translation
    };
  }

  /**
   * Clear translation cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const translationService = TranslationService.getInstance();
export default TranslationService;