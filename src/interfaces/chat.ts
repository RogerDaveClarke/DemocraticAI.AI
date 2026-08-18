// Shared interfaces for Chat components
export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  originalLanguage?: 'en' | 'ga';
  bilingualContent?: {
    en: string;
    ga: string;
  };
  metadata?: {
    modelUsed: string;
    cost: number;
    processingTime: number;
    confidence: number;
    tokensUsed: number;
    retrievedDocuments: number;
    analysisMode?: string;
  };
}

export interface PromptExecution {
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
  bilingualResponse?: {
    en: string;
    ga: string;
  };
  error?: string;
  status: 'running' | 'completed' | 'failed';
  filters?: any;
  analysisMode?: string;
  thumbsUp?: boolean;
  thumbsDown?: boolean;
  feedbackText?: string;
  feedbackTimestamp?: Date;
}

export interface ChatMetrics {
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
    topPrompts: Array<{
      promptId: string;
      count: number;
      satisfaction: number;
    }>;
  };
  analysisModeUsage: {
    total: number;
    topAnalysisModes: Array<{
      analysisMode: string;
      count: number;
      satisfaction: number;
    }>;
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
}