/**
 * Enhanced Enquire Component with Irish-English Translation Support
 * Integrates seamlessly with existing chat while adding bilingual capabilities
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Lightbulb, ThumbsUp, ThumbsDown } from 'lucide-react';
import PromptLibrary from '../PromptLibrary';
import { 
  TranslationProvider, 
  TranslationToggle, 
  BilingualMessage, 
  useTranslation,
} from '../TranslationComponents';
import { translationService, BilingualContent } from '../../services/TranslationService';

interface Message {
  id: string;
  text: string;
  bilingualContent?: BilingualContent;
  sender: 'user' | 'bot';
  timestamp: Date;
  originalLanguage?: 'en' | 'ga';
}

function EnquireContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { userLanguage, setUserLanguage, translateMessage, isTranslating } = useTranslation();

  // Filter controls
  const [debate, setDebate] = useState('All');
  const [sittings, setSittings] = useState('All');
  const [term, setTerm] = useState('34th Dail');
  const [member, setMember] = useState('Roger');
  const [committee, setCommittee] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const debateOptions = ['All', 'Dáil', 'Seanad', 'Committee'];
  const sittingsOptions = ['All', 'Specific Dates', 'Dail or Seanad'];
  const termOptions = Array.from({ length: 34 }, (_, i) => `${34 - i}${getOrdinalSuffix(34 - i)} Dail`);
  const memberOptions = ['Roger'];
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
    if (!inputValue.trim()) return;

    // Detect language and create bilingual content for user message
    const detectedLanguage = translationService.detectLanguage(inputValue);
    const bilingualContent = await translateMessage(inputValue);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      bilingualContent,
      sender: 'user',
      timestamp: new Date(),
      originalLanguage: detectedLanguage as 'en' | 'ga'
    };

    setMessages([...messages, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response with translation
    setTimeout(async () => {
      const responseText = userLanguage === 'ga' 
        ? 'Tá fáilte romhat. Is féidir liom cabhrú leat le ceisteanna faoi Pharlaimint na hÉireann. Tugann an córas seo rochtain ar shonraí iomlána parlaiminte.'
        : 'Welcome! I can help you with questions about the Irish Parliament. This system provides access to comprehensive parliamentary data including debates, votes, legislation, and member information.';

      const responseBilingual = await translateMessage(responseText);

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: userLanguage === 'ga' ? responseBilingual.ga : responseBilingual.en,
        bilingualContent: responseBilingual,
        sender: 'bot',
        timestamp: new Date(),
        originalLanguage: userLanguage
      };

      setMessages((prev) => [...prev, botMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleFeedback = (messageId: string, messageText: string) => {
    void messageId;
    void messageText;
  };

  const handlePromptSelect = (promptText: string, promptId: string) => {
    setInputValue(promptText);
    setShowPromptLibrary(false);
    void promptId;
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  // Bilingual prompt examples
  const promptExamples = [
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
    return promptExamples.map(example => 
      userLanguage === 'ga' ? example.ga : example.en
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header with Translation Toggle */}
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
          <TranslationToggle
            currentLanguage={userLanguage}
            onLanguageChange={setUserLanguage}
            isTranslating={isTranslating}
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            <select
              value={debate}
              onChange={(e) => setDebate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{userLanguage === 'ga' ? 'Díospóireacht' : 'Debate'}</option>
              {debateOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={sittings}
              onChange={(e) => setSittings(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{userLanguage === 'ga' ? 'Suíomhanna' : 'Sittings'}</option>
              {sittingsOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{userLanguage === 'ga' ? 'Téarma' : 'Term'}</option>
              {termOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={member}
              onChange={(e) => setMember(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{userLanguage === 'ga' ? 'Ball' : 'Member'}</option>
              {memberOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <select
              value={committee}
              onChange={(e) => setCommittee(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="">{userLanguage === 'ga' ? 'Coiste' : 'Committee'}</option>
              {committeeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder={userLanguage === 'ga' ? 'Ó dáta' : 'From date'}
            />

            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder={userLanguage === 'ga' ? 'Go dáta' : 'To date'}
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
                    ? 'Tugann an córas seo rochtain ar dhíospóireachtaí, vótaí, reachtaíocht agus eolas faoi bhaill.'
                    : 'This system provides access to debates, votes, legislation, and member information.'
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
                    userLanguage={userLanguage}
                  />
                ) : (
                  <div>{message.text}</div>
                )}

                <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                  {message.sender === 'bot' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleFeedback(message.id, message.text)} aria-label="Perform action"
                        className="text-green-600 hover:text-green-700"
                      >
                        <ThumbsUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleFeedback(message.id, message.text)} aria-label="Perform action"
                        className="text-red-600 hover:text-red-700"
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

      {/* Modals */}
      {showPromptLibrary && (
        <PromptLibrary
          onClose={() => setShowPromptLibrary(false)}
          onSelectPrompt={(promptText, promptId) => handlePromptSelect(promptText, promptId)}
        />
      )}
    </div>
  );
}

export default function EnquireWithTranslation() {
  return (
    <TranslationProvider>
      <EnquireContent />
    </TranslationProvider>
  );
}