import { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Hash, Users, MessageSquare, ArrowUpRight } from 'lucide-react';
import { API_URL } from '@/config/runtime';

interface TrendingTopic {
  id: string;
  title: string;
  description: string;
  trendingScore: number;
  weeklyGrowth: number;
  mentionCount: number;
  category: string;
  lastMentioned: string;
  keywords: string[];
  sources: {
    debates: number;
    questions: number;
    legislation: number;
    chatQueries: number;
  };
}

interface TrendingTopicsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TrendingTopicsModal({ isOpen, onClose }: TrendingTopicsModalProps) {
  const [topics, setTopics] = useState<TrendingTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchTrendingTopics();
    }
  }, [isOpen]);

  const fetchTrendingTopics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/api/ai-insights/trending-topics`);
      const data = await response.json();
      
      setTopics(data.topics || []);
      setLastUpdated(data.lastUpdated || '');
    } catch (error) {
      console.error('Failed to fetch trending topics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      housing: 'bg-blue-100 text-blue-800',
      health: 'bg-green-100 text-green-800',
      environment: 'bg-emerald-100 text-emerald-800',
      education: 'bg-purple-100 text-purple-800',
      economy: 'bg-orange-100 text-orange-800',
      justice: 'bg-red-100 text-red-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category as keyof typeof colors] || colors.other;
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const formatLastUpdated = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('en-IE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
                Trending Topics
              </h2>
              <p className="text-gray-600 mt-1">
                AI-powered analysis of current parliamentary discussions
              </p>
              {lastUpdated && (
                <p className="text-sm text-gray-500 mt-1">
                  Last updated: {formatLastUpdated(lastUpdated)}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading trending topics...</span>
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No trending topics available</h3>
              <p className="text-gray-600">Check back later for the latest parliamentary trends.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {topics.map((topic, index) => (
                <div key={topic.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-blue-600 text-white text-sm font-bold rounded-full">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(topic.category)}`}>
                            {topic.category.charAt(0).toUpperCase() + topic.category.slice(1)}
                          </span>
                          <span className="text-sm text-gray-500">
                            Trending Score: {topic.trendingScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-green-600 font-medium">
                        <ArrowUpRight className="w-4 h-4" />
                        +{topic.weeklyGrowth.toFixed(1)}%
                      </div>
                      <p className="text-xs text-gray-500">this week</p>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4">{topic.description}</p>

                  {/* Keywords */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Hash className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Keywords</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {topic.keywords.map((keyword) => (
                        <span
                          key={keyword}
                          className="px-3 py-1 bg-white border border-gray-200 rounded-full text-sm text-gray-700"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Sources */}
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageSquare className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">Sources</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                        <span className="text-gray-600">Debates:</span>
                        <span className="font-medium">{topic.sources.debates}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className="text-gray-600">Questions:</span>
                        <span className="font-medium">{topic.sources.questions}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                        <span className="text-gray-600">Legislation:</span>
                        <span className="font-medium">{topic.sources.legislation}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                        <span className="text-gray-600">Chat Queries:</span>
                        <span className="font-medium">{topic.sources.chatQueries}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" />
                        {topic.mentionCount} mentions
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Last mentioned {formatTimeAgo(topic.lastMentioned)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}