import express from 'express';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 86400 }); // 24 hours cache

interface SentimentData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  topics: {
    topic: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    mentions: number;
  }[];
}

interface SentimentAnalysis {
  overview: {
    avgPositive: number;
    avgNegative: number;
    avgNeutral: number;
    totalAnalyzed: number;
    trendsDirection: 'improving' | 'declining' | 'stable';
  };
  timeframe: string;
  dailyBreakdown: SentimentData[];
  topTopics: {
    topic: string;
    overallSentiment: 'positive' | 'negative' | 'neutral';
    avgConfidence: number;
    totalMentions: number;
    trend: string;
  }[];
  insights: string[];
}

const generateMockSentimentData = (timeframe: string): SentimentAnalysis => {
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const dailyBreakdown: SentimentData[] = [];
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Generate sentiment percentages that add up to 100
    const positive = Math.floor(Math.random() * 40) + 25; // 25-65%
    const negative = Math.floor(Math.random() * 30) + 15; // 15-45%
    const neutral = 100 - positive - negative;
    
    const topics = [
      { topic: 'Healthcare', sentiment: 'negative' as const, confidence: 0.82, mentions: Math.floor(Math.random() * 50) + 20 },
      { topic: 'Housing Crisis', sentiment: 'negative' as const, confidence: 0.91, mentions: Math.floor(Math.random() * 60) + 30 },
      { topic: 'Economic Recovery', sentiment: 'positive' as const, confidence: 0.76, mentions: Math.floor(Math.random() * 40) + 15 },
      { topic: 'Climate Action', sentiment: 'neutral' as const, confidence: 0.68, mentions: Math.floor(Math.random() * 35) + 10 },
      { topic: 'Education Reform', sentiment: 'positive' as const, confidence: 0.73, mentions: Math.floor(Math.random() * 30) + 12 }
    ]; // Remove artificial slice to show all topics
    
    dailyBreakdown.push({
      date: date.toISOString().split('T')[0],
      positive,
      negative,
      neutral,
      topics
    });
  }
  
  // Calculate overview metrics
  const avgPositive = Math.round(dailyBreakdown.reduce((sum, day) => sum + day.positive, 0) / dailyBreakdown.length);
  const avgNegative = Math.round(dailyBreakdown.reduce((sum, day) => sum + day.negative, 0) / dailyBreakdown.length);
  const avgNeutral = Math.round(dailyBreakdown.reduce((sum, day) => sum + day.neutral, 0) / dailyBreakdown.length);
  
  // Determine trend direction
  const recentAvg = dailyBreakdown.slice(-7).reduce((sum, day) => sum + day.positive, 0) / 7;
  const olderAvg = dailyBreakdown.slice(0, Math.min(7, dailyBreakdown.length - 7)).reduce((sum, day) => sum + day.positive, 0) / Math.min(7, dailyBreakdown.length - 7);
  const trendsDirection = recentAvg > olderAvg + 3 ? 'improving' : recentAvg < olderAvg - 3 ? 'declining' : 'stable';
  
  const topTopics = [
    { topic: 'Housing Crisis', overallSentiment: 'negative' as const, avgConfidence: 0.89, totalMentions: 1247, trend: '-12.3%' },
    { topic: 'Healthcare System', overallSentiment: 'negative' as const, avgConfidence: 0.84, totalMentions: 982, trend: '-8.7%' },
    { topic: 'Economic Recovery', overallSentiment: 'positive' as const, avgConfidence: 0.78, totalMentions: 756, trend: '+15.2%' },
    { topic: 'Climate Policy', overallSentiment: 'neutral' as const, avgConfidence: 0.71, totalMentions: 623, trend: '+3.1%' },
    { topic: 'Education Reform', overallSentiment: 'positive' as const, avgConfidence: 0.76, totalMentions: 445, trend: '+7.8%' }
  ];
  
  const insights = [
    `Overall sentiment has been ${trendsDirection} over the selected timeframe`,
    `Housing and healthcare consistently drive negative sentiment (${avgNegative}% average)`,
    `Economic discussions show ${avgPositive > 35 ? 'strong' : 'moderate'} positive sentiment`,
    `Neutral sentiment dominates ${avgNeutral > 40 ? 'significantly' : 'moderately'} at ${avgNeutral}%`,
    `Sentiment confidence averages 78.3% across all analyzed statements`
  ];
  
  return {
    overview: {
      avgPositive,
      avgNegative,
      avgNeutral,
      totalAnalyzed: Math.floor(Math.random() * 5000) + 15000,
      trendsDirection
    },
    timeframe,
    dailyBreakdown,
    topTopics,
    insights
  };
};

// GET /api/sentiment-analysis
router.get('/', (req, res) => {
  try {
    const timeframe = (req.query.timeframe as string) || '30d';
    const cacheKey = `sentiment_analysis_${timeframe}`;
    
    let sentimentData = cache.get<SentimentAnalysis>(cacheKey);
    
    if (!sentimentData) {
      sentimentData = generateMockSentimentData(timeframe);
      cache.set(cacheKey, sentimentData);
    }
    
    res.json({
      success: true,
      data: sentimentData,
      cached: !!cache.get(cacheKey),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching sentiment analysis:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sentiment analysis data'
    });
  }
});

export default router;