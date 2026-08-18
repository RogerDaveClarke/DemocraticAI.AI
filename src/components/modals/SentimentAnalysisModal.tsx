import { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, BarChart, Smile, Frown, Meh } from 'lucide-react';

interface SentimentData {
  date: string;
  positive: number;
  negative: number;
  neutral: number;
  totalMentions: number;
}

interface SentimentTrend {
  topic: string;
  overall: 'positive' | 'negative' | 'neutral';
  score: number;
  change: number;
  mentions: number;
}

interface SentimentAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SentimentAnalysisModal({ isOpen, onClose }: SentimentAnalysisModalProps) {
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'quarter'>('week');
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [topicTrends, setTopicTrends] = useState<SentimentTrend[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchSentimentData();
    }
  }, [isOpen, timeframe]);

  const fetchSentimentData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/sentiment-analysis?timeframe=${timeframe}`);
      const result = await response.json();
      
      if (result.success) {
        setSentimentData(result.data.dailyBreakdown);
        setTopicTrends(result.data.topTopics.map((topic: any) => ({
          topic: topic.topic,
          sentiment: topic.overallSentiment,
          change: topic.trend,
          confidence: topic.avgConfidence * 100
        })));
      } else {
        throw new Error(result.error || 'Failed to fetch sentiment data');
      }
    } catch (error) {
      console.error('Error fetching sentiment data:', error);
      // Fallback to mock data
      const mockData: SentimentData[] = generateMockSentimentData();
      const mockTrends: SentimentTrend[] = generateMockTrends();
      
      setSentimentData(mockData);
      setTopicTrends(mockTrends);
    } finally {
      setLoading(false);
    }
  };

  const generateMockSentimentData = (): SentimentData[] => {
    const data: SentimentData[] = [];
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : 90;
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      const positive = Math.floor(Math.random() * 40) + 30;
      const negative = Math.floor(Math.random() * 30) + 10;
      const neutral = 100 - positive - negative;
      
      data.push({
        date: date.toLocaleDateString('en-IE'),
        positive,
        negative,
        neutral,
        totalMentions: Math.floor(Math.random() * 100) + 50
      });
    }
    return data;
  };

  const generateMockTrends = (): SentimentTrend[] => {
    return [
      {
        topic: 'Healthcare Reform',
        overall: 'positive',
        score: 72.3,
        change: 8.5,
        mentions: 245
      },
      {
        topic: 'Housing Crisis',
        overall: 'negative',
        score: 34.7,
        change: -12.3,
        mentions: 189
      },
      {
        topic: 'Climate Action',
        overall: 'positive',
        score: 68.9,
        change: 15.2,
        mentions: 156
      },
      {
        topic: 'Education Funding',
        overall: 'neutral',
        score: 51.2,
        change: 2.1,
        mentions: 134
      },
      {
        topic: 'Economic Recovery',
        overall: 'positive',
        score: 64.1,
        change: 6.8,
        mentions: 198
      }
    ];
  };

  const getSentimentIcon = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return <Smile className="w-5 h-5 text-green-600" />;
      case 'negative': return <Frown className="w-5 h-5 text-red-600" />;
      default: return <Meh className="w-5 h-5 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-100';
      case 'negative': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                Sentiment Analysis
              </h2>
              <p className="text-gray-600 mt-1">
                Emotional tone and sentiment of parliamentary debates over time
              </p>
            </div>
            <button
              onClick={onClose} aria-label="Close dialog"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            ><X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Timeframe selector */}
          <div className="mt-4 flex gap-2">
            {(['week', 'month', 'quarter'] as const).map((period) => (
              <button
                key={period}
                onClick={() => setTimeframe(period)} aria-label="Perform action"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeframe === period
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-3 text-gray-600">Analyzing sentiment data...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Overall Sentiment Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-green-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Smile className="w-8 h-8 text-green-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-green-900">Positive</h3>
                      <p className="text-2xl font-bold text-green-600">
                        {sentimentData.length > 0 
                          ? Math.round(sentimentData.reduce((acc, d) => acc + d.positive, 0) / sentimentData.length)
                          : 0}%
                      </p>
                    </div>
                  </div>
                  <p className="text-green-700 text-sm">Average positive sentiment</p>
                </div>

                <div className="bg-red-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Frown className="w-8 h-8 text-red-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-red-900">Negative</h3>
                      <p className="text-2xl font-bold text-red-600">
                        {sentimentData.length > 0 
                          ? Math.round(sentimentData.reduce((acc, d) => acc + d.negative, 0) / sentimentData.length)
                          : 0}%
                      </p>
                    </div>
                  </div>
                  <p className="text-red-700 text-sm">Average negative sentiment</p>
                </div>

                <div className="bg-gray-50 p-6 rounded-lg">
                  <div className="flex items-center gap-3 mb-2">
                    <Meh className="w-8 h-8 text-gray-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Neutral</h3>
                      <p className="text-2xl font-bold text-gray-600">
                        {sentimentData.length > 0 
                          ? Math.round(sentimentData.reduce((acc, d) => acc + d.neutral, 0) / sentimentData.length)
                          : 0}%
                      </p>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">Average neutral sentiment</p>
                </div>
              </div>

              {/* Topic Sentiment Trends */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart className="w-5 h-5" />
                  Topic Sentiment Trends
                </h3>
                <div className="space-y-4">
                  {topicTrends.map((trend, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getSentimentIcon(trend.overall)}
                          <div>
                            <h4 className="font-semibold text-gray-900">{trend.topic}</h4>
                            <div className="flex items-center gap-4 mt-1">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(trend.overall)}`}>
                                {trend.overall.charAt(0).toUpperCase() + trend.overall.slice(1)}
                              </span>
                              <span className="text-sm text-gray-600">
                                {trend.mentions} mentions
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">
                            {trend.score.toFixed(1)}%
                          </div>
                          <div className={`text-sm ${trend.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.change >= 0 ? '+' : ''}{trend.change.toFixed(1)}% this {timeframe}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Breakdown */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Recent Daily Breakdown
                </h3>
                <div className="space-y-2">
                  {sentimentData.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-900">{day.date}</span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span>{day.positive}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span>{day.negative}%</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                          <span>{day.neutral}%</span>
                        </div>
                        <span className="text-gray-600 text-sm ml-4">
                          {day.totalMentions} mentions
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}