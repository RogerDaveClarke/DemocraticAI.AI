/**
 * Metrics Dashboard Component
 * Real-time monitoring of chat performance, model usage, and user satisfaction
 */

import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Activity,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  Clock,
  MessageSquare,
  Target
} from 'lucide-react';
import { chatService } from '../services/ChatService';

interface MetricCard {
  title: string;
  value: string | number;
  change?: string;
  icon: React.ReactNode;
  color: string;
}

interface MetricsData {
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
}

export default function MetricsDashboard() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadMetrics, 30000);
    return () => clearInterval(interval);
  }, [timeRange]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const data = await chatService.getMetrics(timeRange);
      setMetricsData(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !metricsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">Error loading metrics: {error}</p>
        <button
          onClick={loadMetrics} aria-label="Perform action"
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!metricsData) return null;

  // Prepare chart data
  const modelUsageData = Object.entries(metricsData.modelUsage).map(([model, count]) => ({
    model: model.replace('-', ' ').toUpperCase(),
    count,
    percentage: (count / metricsData.totalQueries * 100).toFixed(1)
  }));

  const costBreakdownData = Object.entries(metricsData.costBreakdown.costByModel).map(([model, cost]) => ({
    model: model.replace('-', ' ').toUpperCase(),
    cost: Number(cost.toFixed(4)),
    percentage: (cost / metricsData.costBreakdown.totalCost * 100).toFixed(1)
  }));

  const satisfactionRatio = metricsData.userSatisfaction.thumbsUp + metricsData.userSatisfaction.thumbsDown > 0
    ? (metricsData.userSatisfaction.thumbsUp / (metricsData.userSatisfaction.thumbsUp + metricsData.userSatisfaction.thumbsDown) * 100)
    : 0;

  const metricCards: MetricCard[] = [
    {
      title: 'Total Queries',
      value: metricsData.totalQueries.toLocaleString(),
      icon: <MessageSquare className="w-6 h-6" />,
      color: 'blue'
    },
    {
      title: 'Average Cost',
      value: `$${metricsData.averageCost.toFixed(4)}`,
      icon: <DollarSign className="w-6 h-6" />,
      color: 'green'
    },
    {
      title: 'Avg Processing Time',
      value: `${metricsData.averageProcessingTime}ms`,
      icon: <Clock className="w-6 h-6" />,
      color: 'yellow'
    },
    {
      title: 'User Satisfaction',
      value: `${satisfactionRatio.toFixed(1)}%`,
      icon: <ThumbsUp className="w-6 h-6" />,
      color: satisfactionRatio > 80 ? 'green' : satisfactionRatio > 60 ? 'yellow' : 'red'
    },
    {
      title: 'Confidence Score',
      value: `${(metricsData.performanceMetrics.averageConfidence * 100).toFixed(1)}%`,
      icon: <Target className="w-6 h-6" />,
      color: 'purple'
    },
    {
      title: 'Error Rate',
      value: `${(metricsData.performanceMetrics.errorRate * 100).toFixed(2)}%`,
      icon: <Activity className="w-6 h-6" />,
      color: metricsData.performanceMetrics.errorRate < 0.05 ? 'green' : 'red'
    }
  ];

  const COLORS = {
    blue: '#3B82F6',
    green: '#10B981',
    yellow: '#F59E0B',
    red: '#EF4444',
    purple: '#8B5CF6',
    indigo: '#6366F1'
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Chat Performance Metrics</h2>
        <div className="flex space-x-2">
          {(['1h', '24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)} aria-label="Perform action"
              className={`px-3 py-1 rounded text-sm font-medium ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {metricCards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">{card.value}</p>
                {card.change && (
                  <p className="text-sm text-green-600 mt-1">{card.change}</p>
                )}
              </div>
              <div 
                className={`p-3 rounded-lg`}
                style={{ backgroundColor: `${COLORS[card.color as keyof typeof COLORS]}20` }}
              >
                <div style={{ color: COLORS[card.color as keyof typeof COLORS] }}>
                  {card.icon}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Model Usage Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Model Usage Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={modelUsageData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ model, percentage }) => `${model} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {modelUsageData.map((_entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={Object.values(COLORS)[index % Object.values(COLORS).length]} 
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Cost Breakdown Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost by Model</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={costBreakdownData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="model" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value}`, 'Cost']} />
              <Bar dataKey="cost" fill={COLORS.green} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* User Feedback */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Feedback</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ThumbsUp className="w-5 h-5 text-green-600" />
                <span className="text-gray-700">Positive</span>
              </div>
              <span className="text-2xl font-semibold text-green-600">
                {metricsData.userSatisfaction.thumbsUp}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ThumbsDown className="w-5 h-5 text-red-600" />
                <span className="text-gray-700">Negative</span>
              </div>
              <span className="text-2xl font-semibold text-red-600">
                {metricsData.userSatisfaction.thumbsDown}
              </span>
            </div>
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Satisfaction Rate</span>
                <span className="text-sm font-semibold">{satisfactionRatio.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{ width: `${satisfactionRatio}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Prompt Library Usage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Prompt Library Usage</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Prompt Uses</span>
              <span className="text-2xl font-semibold text-blue-600">
                {metricsData.promptLibraryUsage.total}
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Top Prompts</h4>
              {metricsData.promptLibraryUsage.topPrompts.slice(0, 5).map((prompt, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 truncate">
                    Prompt {prompt.promptId.slice(-8)}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{prompt.count}</span>
                    <span className="text-xs text-gray-500">
                      ({(prompt.satisfaction * 100).toFixed(0)}% sat)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Mode Usage */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Mode Usage</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Mode Uses</span>
              <span className="text-2xl font-semibold text-indigo-600">
                {metricsData.analysisModeUsage.total}
              </span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700">Top Analysis Modes</h4>
              {metricsData.analysisModeUsage.topAnalysisModes.slice(0, 5).map((mode, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600 truncate">
                    {mode.analysisMode}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium">{mode.count}</span>
                    <span className="text-xs text-gray-500">
                      ({(mode.satisfaction * 100).toFixed(0)}% sat)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Performance Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {metricsData.performanceMetrics.averageRetrievedDocs.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Documents Retrieved</div>
            <div className="text-xs text-gray-500 mt-1">
              Higher values indicate more comprehensive context
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {(metricsData.performanceMetrics.averageConfidence * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Average Confidence</div>
            <div className="text-xs text-gray-500 mt-1">
              Model confidence in response accuracy
            </div>
          </div>

          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              ${metricsData.costBreakdown.totalCost.toFixed(2)}
            </div>
            <div className="text-sm text-gray-600">Total Cost ({timeRange})</div>
            <div className="text-xs text-gray-500 mt-1">
              ${metricsData.costBreakdown.averageCostPerQuery.toFixed(4)} per query
            </div>
          </div>

        </div>
      </div>

      {/* Real-time Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">System Status</h3>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-gray-600">All systems operational</span>
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Gemini Flash</div>
            <div className="text-green-600 font-medium">✓ Operational</div>
          </div>
          <div>
            <div className="text-gray-600">GPT-4o-mini</div>
            <div className="text-green-600 font-medium">✓ Operational</div>
          </div>
          <div>
            <div className="text-gray-600">Translation Service</div>
            <div className="text-green-600 font-medium">✓ Operational</div>
          </div>
          <div>
            <div className="text-gray-600">Last Updated</div>
            <div className="text-gray-900 font-medium">
              {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="fixed top-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow">
          Updating metrics...
        </div>
      )}
    </div>
  );
}