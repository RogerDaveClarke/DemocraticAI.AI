/**
 * Enhanced Enquire Component with Full Metrics Integration
 * Implements hybrid AI model architecture with comprehensive tracking
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Lightbulb, ThumbsUp, ThumbsDown, BarChart3, Trash2 } from 'lucide-react';
import { chatService } from '../../services/ChatService';
import MetricsDashboard from '../Dashboard/MetricsDashboard';
import { 
  TranslationProvider, 
  TranslationToggle, 
  BilingualMessage, 
  useTranslation 
} from '../Translation/TranslationComponents';
import { ChatMessage, PromptExecution } from '../../interfaces/chat';

interface EnhancedMessage extends ChatMessage {
  executionId?: string;
  feedbackGiven?: boolean;
}

interface PromptLibraryItem {
  id: string;
  title: string;
  description: string;
  template: string;
  variables: string[];
  tags: string[];
  usage_count: number;
  satisfaction_score: number;
}

function EnquireContent() {
  const [messages, setMessages] = useState<EnhancedMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [showMetricsDashboard, setShowMetricsDashboard] = useState(false);
  const [currentExecution, setCurrentExecution] = useState<PromptExecution | null>(null);
  const [dataStatus, setDataStatus] = useState<{ lastUpdated: string | null; model: string } | null>(null);
  const [deletingHistory, setDeletingHistory] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { userLanguage, isTranslating } = useTranslation();

  // Filter states
  const [filters, setFilters] = useState({
    debate: 'All',
    sittings: 'All',
    term: '34th Dail',
    member: '',
    committee: 'All',
    fromDate: '',
    toDate: ''
  });

  // Prompt library state
  const [promptLibrary, setPromptLibrary] = useState<PromptLibraryItem[]>([]);
  const [selectedPrompt, setSelectedPrompt] = useState<PromptLibraryItem | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    loadPromptLibrary();
    chatService.getDataStatus().then(s => setDataStatus(s));
  }, []);

  const loadPromptLibrary = async () => {
    try {
      const response = await fetch('/api/prompts');
      if (response.ok) {
        const prompts = await response.json();
        setPromptLibrary(prompts);
      }
    } catch (error) {
      console.error('Failed to load prompt library:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: EnhancedMessage = {
      id: `user_${Date.now()}`,
      text: inputValue,
      sender: 'user',
      timestamp: new Date(),
      originalLanguage: userLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const { response, execution } = await chatService.executeQuery(
        inputValue,
        selectedPrompt?.id,
        filters,
        userLanguage
      );

      const botMessage: EnhancedMessage = {
        ...response,
        executionId: execution.id,
        feedbackGiven: false
      };

      setMessages(prev => [...prev, botMessage]);
      setCurrentExecution(execution);

      // Track prompt library usage if prompt was used
      if (selectedPrompt) {
        await trackPromptUsage(selectedPrompt.id, execution.id);
      }

    } catch (error) {
      const errorMessage: EnhancedMessage = {
        id: `error_${Date.now()}`,
        text: userLanguage === 'ga' 
          ? 'Tharla earráid. Bain triail eile as ar ball.'
          : 'An error occurred. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
        originalLanguage: userLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setSelectedPrompt(null);
    }
  };

  const handleFeedback = async (
    messageId: string, 
    executionId: string, 
    thumbsUp?: boolean, 
    thumbsDown?: boolean,
    feedbackText?: string
  ) => {
    try {
      await chatService.recordFeedback(executionId, thumbsUp, thumbsDown, feedbackText);
      
      // Update message to show feedback was given
      setMessages(prev => prev.map(msg => 
        msg.id === messageId 
          ? { ...msg, feedbackGiven: true }
          : msg
      ));

      // Update prompt library satisfaction scores if applicable
      if (selectedPrompt) {
        await updatePromptSatisfaction(selectedPrompt.id, thumbsUp ? 1 : 0);
      }

    } catch (error) {
      console.error('Failed to record feedback:', error);
    }
  };

  const handlePromptSelect = (prompt: PromptLibraryItem) => {
    setSelectedPrompt(prompt);
    setInputValue(prompt.template);
    setShowPromptLibrary(false);
    inputRef.current?.focus();
  };

  const trackPromptUsage = async (promptId: string, executionId: string) => {
    try {
      await fetch('/api/prompts/usage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ promptId, executionId, timestamp: new Date() })
      });
    } catch (error) {
      console.error('Failed to track prompt usage:', error);
    }
  };

  const updatePromptSatisfaction = async (promptId: string, satisfaction: number) => {
    try {
      await fetch(`/api/prompts/${promptId}/satisfaction`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ satisfaction })
      });
    } catch (error) {
      console.error('Failed to update prompt satisfaction:', error);
    }
  };

  // Bilingual example prompts
  const handleDeleteHistory = async () => {
    if (!window.confirm('Delete all your chat history for this session? This cannot be undone.')) return;
    setDeletingHistory(true);
    try {
      const result = await chatService.deleteChatHistory();
      setMessages([]);
      alert(`${result.deleted} records deleted.`);
    } catch {
      alert('Failed to delete history. Please try again.');
    } finally {
      setDeletingHistory(false);
    }
  };

  const examplePrompts = [
    {
      en: "What bills were passed last month?",
      ga: "Cad iad na billí a ritheadh an mhí seo caite?"
    },
    {
      en: "Show me voting records for healthcare legislation",
      ga: "Taispeáin dom taifid vótála do reachtaíocht sláinte"
    },
    {
      en: "Who are the most active members in debates?",
      ga: "Cé hiad na baill is gníomhaí sna díospóireachtaí?"
    },
    {
      en: "What committees are currently active?",
      ga: "Cad iad na coistí atá gníomhach faoi láthair?"
    }
  ];

  const getCurrentPromptExamples = () => {
    return examplePrompts.map(example => 
      userLanguage === 'ga' ? example.ga : example.en
    );
  };

  if (showMetricsDashboard) {
    return (
      <div className="h-screen bg-gray-50">
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex justify-between items-center max-w-6xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
            <button
              onClick={() => setShowMetricsDashboard(false)} aria-label="Perform action"
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Back to Chat
            </button>
          </div>
        </div>
        <div className="p-6 max-w-6xl mx-auto">
          <MetricsDashboard />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {userLanguage === 'ga' ? 'Fiosrú' : 'Parliamentary AI Assistant'}
            </h1>
            <p className="text-gray-600">
              {userLanguage === 'ga' 
                ? 'Cuir ceisteanna faoi Pharlaimint na hÉireann'
                : 'Ask questions about the Irish Parliament'
              }
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowMetricsDashboard(true)} aria-label="Perform action"
              className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded"
              title="View Analytics"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={handleDeleteHistory}
              disabled={deletingHistory}
              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-40"
              title="Delete my chat history (GDPR Article 17)"
              aria-label="Delete chat history"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <TranslationToggle />
          </div>
        </div>
      </div>

      {/* AI Disclosure & Data Status Banner */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs text-blue-700">
          <span>
            🤖 <strong>AI-assisted</strong> — responses generated by {dataStatus?.model ?? 'Google Gemini'} using retrieved parliamentary records. Verify important information at{' '}
            <a href="https://www.oireachtas.ie" target="_blank" rel="noopener noreferrer" className="underline">Democratic AI</a>.
          </span>
          <span className="text-blue-500">
            {dataStatus?.lastUpdated
              ? `Data current as of ${new Date(dataStatus.lastUpdated).toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' })}`
              : 'Data status loading…'}
          </span>
        </div>
      </div>
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <select
              value={filters.debate}
              onChange={(e) => setFilters({...filters, debate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{userLanguage === 'ga' ? 'Díospóireacht' : 'Debate'}</option>
              <option value="All">All</option>
              <option value="Dáil">Dáil</option>
              <option value="Seanad">Seanad</option>
              <option value="Committee">Committee</option>
            </select>

            <select
              value={filters.sittings}
              onChange={(e) => setFilters({...filters, sittings: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{userLanguage === 'ga' ? 'Suíomhanna' : 'Sittings'}</option>
              <option value="All">All</option>
              <option value="Specific Dates">Specific Dates</option>
            </select>

            <select
              value={filters.term}
              onChange={(e) => setFilters({...filters, term: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{userLanguage === 'ga' ? 'Téarma' : 'Term'}</option>
              <option value="34th Dail">34th Dáil</option>
              <option value="33rd Dail">33rd Dáil</option>
            </select>

            <input
              type="text"
              value={filters.member}
              onChange={(e) => setFilters({...filters, member: e.target.value})}
              placeholder={userLanguage === 'ga' ? 'Ball' : 'Member'}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            <select
              value={filters.committee}
              onChange={(e) => setFilters({...filters, committee: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{userLanguage === 'ga' ? 'Coiste' : 'Committee'}</option>
              <option value="All">All</option>
            </select>

            <input
              type="date"
              value={filters.fromDate}
              onChange={(e) => setFilters({...filters, fromDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />

            <input
              type="date"
              value={filters.toDate}
              onChange={(e) => setFilters({...filters, toDate: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-6">
                <p className="text-lg mb-2">
                  {userLanguage === 'ga' 
                    ? 'Cuir ceist faoi Pharlaimint na hÉireann'
                    : 'Ask a question about the Irish Parliament'
                  }
                </p>
                <p className="text-sm">
                  {userLanguage === 'ga'
                    ? 'Córas AI le rochtain ar dhíospóireachtaí, vótaí agus reachtaíocht'
                    : 'AI system with access to debates, votes, and legislation'
                  }
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                {getCurrentPromptExamples().map((example, index) => (
                  <button
                    key={index}
                    onClick={() => setInputValue(example)} aria-label="Perform action"
                    className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
                  >
                    {example}
                  </button>
                ))}
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
                    : 'bg-white border border-gray-200'
                }`}
              >
                {message.bilingualContent ? (
                  <BilingualMessage
                    content={message.bilingualContent}
                    currentLanguage={userLanguage}
                  />
                ) : (
                  <div>{message.text}</div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center space-x-4 text-xs text-gray-500">
                    <span>{message.timestamp.toLocaleTimeString()}</span>
                    {message.metadata && (
                      <>
                        <span>Model: {message.metadata.modelUsed}</span>
                        <span>Cost: ${message.metadata.cost?.toFixed(4) || '0.0000'}</span>
                        <span>Time: {message.metadata.processingTime}ms</span>
                      </>
                    )}
                  </div>
                  
                  {message.sender === 'bot' && message.executionId && !message.feedbackGiven && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeedback(message.id, message.executionId!, true)} aria-label="Perform action"
                        className="text-green-600 hover:text-green-700 p-1"
                        title="Good response"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, message.executionId!, false, true)} aria-label="Perform action"
                        className="text-red-600 hover:text-red-700 p-1"
                        title="Poor response"
                      >
                        <ThumbsDown className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-3xl">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="text-sm text-gray-500 ml-2">
                    {currentExecution?.modelUsed && `Using ${currentExecution.modelUsed}...`}
                  </span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Form */}
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <button
              type="button"
              onClick={() => setShowPromptLibrary(true)} aria-label="Perform action"
              className="px-4 py-2 text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Lightbulb className="w-4 h-4" />
              {userLanguage === 'ga' ? 'Leideanna' : 'Prompts'}
            </button>
            
            <div className="flex-1 relative">
              {selectedPrompt && (
                <div className="absolute -top-8 left-0 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Using: {selectedPrompt.title}
                </div>
              )}
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={userLanguage === 'ga' 
                  ? 'Cuir do cheist anseo... (Béarla nó Gaeilge)'
                  : 'Ask your question here... (English or Irish)'
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-12"
                disabled={isLoading || isTranslating}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading || isTranslating}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-600 hover:text-blue-700 disabled:text-gray-400"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Prompt Library Modal */}
      {showPromptLibrary && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b">
              <h2 className="text-xl font-semibold">
                {userLanguage === 'ga' ? 'Leabharlann Leid' : 'Prompt Library'}
              </h2>
              <button
                onClick={() => setShowPromptLibrary(false)} aria-label="Perform action"
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="grid gap-4">
                {promptLibrary.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer"
                    onClick={() => handlePromptSelect(prompt)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handlePromptSelect(prompt)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-900">{prompt.title}</h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Used: {prompt.usage_count}</span>
                        <span>Rating: {(prompt.satisfaction_score * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{prompt.description}</p>
                    <div className="text-xs font-mono bg-gray-50 p-2 rounded">
                      {prompt.template}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EnquireWithMetrics() {
  return (
    <TranslationProvider>
      <EnquireContent />
    </TranslationProvider>
  );
}