import React from 'react';

interface MetricsDashboardProps {
  className?: string;
}

const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ className = '' }) => {
  return (
    <div className={`bg-white p-6 rounded-lg shadow ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Chat Metrics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded">
          <div className="text-2xl font-bold text-blue-600">42</div>
          <div className="text-sm text-gray-600">Total Queries</div>
        </div>
        <div className="bg-green-50 p-4 rounded">
          <div className="text-2xl font-bold text-green-600">1.2s</div>
          <div className="text-sm text-gray-600">Avg Response Time</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded">
          <div className="text-2xl font-bold text-yellow-600">$0.04</div>
          <div className="text-sm text-gray-600">Cost per Query</div>
        </div>
        <div className="bg-purple-50 p-4 rounded">
          <div className="text-2xl font-bold text-purple-600">92%</div>
          <div className="text-sm text-gray-600">Satisfaction</div>
        </div>
      </div>
    </div>
  );
};

export default MetricsDashboard;