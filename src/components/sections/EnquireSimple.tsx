/**
 * Simple Enquire with Metrics Component
 * A simplified version that integrates with the existing architecture
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, ThumbsUp, ThumbsDown, BarChart3 } from 'lucide-react';
import MetricsDashboard from '../Dashboard/MetricsDashboard';
import { ChatMessage } from '../../interfaces/chat';

interface Message extends ChatMessage {
  executionId?: string;
  cost?: number;
  processingTime?: number;
  feedbackGiven?: boolean;
}

export default function EnquireSimple() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Filter states
  const [debate, setDebate] = useState('All');
  const [sittings, setSittings] = useState('All');
  const [term, setTerm] = useState('34th Dail');
  const [member, setMember] = useState('All');
  const [committee, setCommittee] = useState('All');

  const debateOptions = ['All', 'Dail', 'Seanad', 'Committee'];
  const sittingsOptions = ['All', 'Specific Dates', 'Dail or Seanad'];
  const termOptions = Array.from({ length: 34 }, (_, i) => `${34 - i}${getOrdinalSuffix(34 - i)} Dail`);
  const memberOptions = ['All', 'Roger'];
  const committeeOptions = ['All', 'Drug Use'];

  function getOrdinalSuffix(num: number): string {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) return 'st';
    if (j === 2 && k !== 12) return 'nd';
    if (j === 3 && k !== 13) return 'rd';
    return 'th';
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setInputValue('');

    try {
      // Simulate API call with metrics
      await new Promise(resolve => setTimeout(resolve, 1500)); // Mock delay
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: `Based on your query "${userMessage.text}", here's what I found in the Irish Parliament records. This is a mock response demonstrating the hybrid AI system with cost optimization.`,
        sender: 'bot',
        timestamp: new Date(),
        executionId: `exec_${Date.now()}`,
        cost: 0.0032,
        processingTime: 1247,
        metadata: {
          modelUsed: 'gemini-flash',
          cost: 0.0032,
          processingTime: 1247,
          confidence: 0.87,
          tokensUsed: 1250,
          retrievedDocuments: 8
        }
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: 'Sorry, I encountered an error processing your request. Please try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFeedback = async (messageId: string, thumbsUp: boolean) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId 
        ? { ...msg, feedbackGiven: true }
        : msg
    ));
    
    // In production, send feedback to API
    console.log(`Feedback for ${messageId}: ${thumbsUp ? 'thumbs up' : 'thumbs down'}`);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with Analytics */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Parliamentary Chat with Metrics</h2>
          <button
            onClick={() => setShowMetrics(!showMetrics)} aria-label="Perform action"
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart3 size={16} />
            {showMetrics ? 'Hide Analytics' : 'Show Analytics'}
          </button>
        </div>

        {/* Analytics Dashboard */}
        {showMetrics && (
          <div className="mb-4">
            <MetricsDashboard />
          </div>
        )}

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Debate</label>
            <select
              value={debate}
              onChange={(e) => setDebate(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {debateOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Sittings</label>
            <select
              value={sittings}
              onChange={(e) => setSittings(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {sittingsOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Term</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {termOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Member</label>
            <select
              value={member}
              onChange={(e) => setMember(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {memberOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Committee</label>
            <select
              value={committee}
              onChange={(e) => setCommittee(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {committeeOptions.map(option => (
                <option key={option} value={option}>{option}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-12">
            <h3 className="text-lg font-medium mb-2">Start Your Parliamentary Inquiry</h3>
            <p className="text-sm">Ask questions about Irish Parliament proceedings, legislation, and members.</p>
            <div className="mt-4 text-xs bg-blue-50 p-3 rounded-lg inline-block">
              <strong>AI System:</strong> Hybrid model routing with cost optimization and performance metrics
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-3xl p-4 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-800 border border-gray-200'
              }`}
            >
              <div className="mb-2">{message.text}</div>
              
              {/* Metadata for bot messages */}
              {message.sender === 'bot' && message.metadata && (
                <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-600">
                  <div className="flex flex-wrap gap-4">
                    <span>Model: {message.metadata.modelUsed}</span>
                    <span>Cost: ${message.metadata.cost?.toFixed(4) || '0.0000'}</span>
                    <span>Time: {message.metadata.processingTime}ms</span>
                    <span>Confidence: {(message.metadata.confidence * 100).toFixed(1)}%</span>
                    <span>Docs: {message.metadata.retrievedDocuments}</span>
                  </div>
                </div>
              )}

              {/* Feedback buttons */}
              {message.sender === 'bot' && message.executionId && !message.feedbackGiven && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
                  <button
                    onClick={() => handleFeedback(message.id, true)} aria-label="Perform action"
                    className="flex items-center gap-1 px-2 py-1 text-xs text-green-600 hover:bg-green-50 rounded"
                  >
                    <ThumbsUp size={12} />
                    Helpful
                  </button>
                  <button
                    onClick={() => handleFeedback(message.id, false)} aria-label="Perform action"
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded"
                  >
                    <ThumbsDown size={12} />
                    Not helpful
                  </button>
                </div>
              )}

              {message.feedbackGiven && (
                <div className="mt-2 text-xs text-gray-500">
                  Thank you for your feedback!
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-sm">AI is analyzing your query...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask about Irish Parliament proceedings, legislation, or members..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={16} />
            Send
          </button>
        </form>
      </div>
    </div>
  );
}