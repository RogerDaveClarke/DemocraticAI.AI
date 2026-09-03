import { useState, useRef, useEffect, useCallback, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { track } from '@/utils/analytics';
import { Send, ThumbsUp, ThumbsDown, Lightbulb, Copy, ShieldCheck, ChevronRight, MessageSquare, Search, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import PromptLibrary from '../PromptLibrary';
import { useLoadingAnnouncer } from '../../hooks/accessibilityHooks';
import { sanitizeInput, validateQueryInput } from '../../utils/security';
import { apiPost } from '../../utils/api';
import { promptLibrary } from '../../data/promptLibrary';
import { PageShell } from '@/components/patterns';
import { API_URL } from '@/config/runtime';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  executionId?: string;
  feedbackGiven?: boolean;
  sources?: SearchDocument[];
  metadata?: {
    modelUsed: string;
    cost: number;
    processingTime: number;
    confidence: number;
    tokensUsed: number;
    retrievedDocuments: number;
    analysisMode?: string;
    deepResearch?: boolean;
  };
}

interface PromptExecution {
  id: string;
  promptId?: string;
  sessionId: string;
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
  error?: string;
  status: 'running' | 'completed' | 'failed';
  thumbsUp?: boolean;
  thumbsDown?: boolean;
  feedbackText?: string;
}

interface SearchDocument {
  id: string;
  title: string;
  content: string;
  source: 'bill' | 'debate' | 'question';
  date?: string;
  uri?: string;
  relevance?: number;
}



const FEEDBACK_ENABLED = import.meta.env.VITE_FEEDBACK_ENABLED === 'true';

const FEEDBACK_CATEGORIES = [
  "Response didn't seem relevant",
  'Sources were unclear or missing',
  'Response seemed biased or one-sided',
  'Response seemed factually questionable',
  'Other',
];

export default function Enquire() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPromptLibrary, setShowPromptLibrary] = useState(false);
  const [feedbackStates, setFeedbackStates] = useState<Record<string, { sentiment?: 'up' | 'down'; panelOpen: boolean; category: string; verbatim: string; submitted: boolean; }>>({});
  const userLanguage: 'en' | 'ga' = 'en';
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>(undefined);
  const [executionsMap, setExecutionsMap] = useState<Map<string, PromptExecution>>(new Map());
  const [selectedResearchGoal, setSelectedResearchGoal] = useState('');
  const [recentResearch, setRecentResearch] = useState<string[]>([]);
  const [sourceDialog, setSourceDialog] = useState<{ sources: SearchDocument[]; responseId: string } | null>(null);
  const [chatPanelWidth, setChatPanelWidth] = useState(70);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1280px)').matches);
  const [deepResearch, setDeepResearch] = useState(false);
  const [usage, setUsage] = useState({ inputTokens: 0, outputTokens: 0, cost: 0, requests: 0, lastTokens: 0, lastCost: 0 });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const sessionId = useRef(generateSessionId());
  
  // Accessibility hooks
  const { announceLoading, announceComplete, LoadingAnnouncementRegion } = useLoadingAnnouncer();

  // Popular prompts state
  const [popularPrompts, setPopularPrompts] = useState<Array<{prompt: string, count: number}>>([]);

  // Fetch popular prompts on component mount
  useEffect(() => {
    const fetchPopularPrompts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/chat/popular-prompts`);
        if (response.ok) {
          const data = await response.json();
          setPopularPrompts(data.prompts || []);
        } else {
          // Fallback to random selection if no data
          const randomPrompts = [...promptExamples]
            .sort(() => Math.random() - 0.5)
            .map(prompt => ({ prompt, count: 0 }));
          setPopularPrompts(randomPrompts);
        }
      } catch (error) {
        console.error('Failed to fetch popular prompts:', error);
        // Fallback to random selection
        const randomPrompts = [...promptExamples]
          .sort(() => Math.random() - 0.5)
          .map(prompt => ({ prompt, count: 0 }));
        setPopularPrompts(randomPrompts);
      }
    };

    fetchPopularPrompts();
  }, []);

  const trackPromptUsage = async (prompt: string) => {
    try {
      await fetch(`${API_URL}/api/chat/track-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });
    } catch (error) {
      console.error('Failed to track prompt usage:', error);
    }
  };

  const promptExamples = [
    'How has the government\'s position on housing changed over the past five years?',
    'Explain this bill in plain language and identify the most impacted groups.',
    'Compare amendments across versions of this legislation.',
    'What themes dominate discussions on housing?',
  ];

  const researchGoals = [
    'Understand legislation',
    'Analyze debate',
    'Compare parties',
    'Track representatives',
    'Detect bias',
    'AI Integrity',
  ];

  const starterGroups = [
    {
      title: 'Debate Analysis',
      prompts: [
        'Analyze framing in this debate',
        'Detect stance by speaker on this issue',
        'Summarize this debate in 5 bullet points',
      ],
    },
    {
      title: 'Legislation',
      prompts: [
        'Explain this bill in plain language',
        'Compare amendments between bill versions',
      ],
    },
    {
      title: 'Members',
      prompts: [
        'Show this member\'s recent voting history',
        'Analyze this member\'s speaking activity by topic',
      ],
    },
    {
      title: 'AI Integrity',
      prompts: [
        'Detect likely AI usage in this speech',
        'Analyze potential bias in this legislative text',
      ],
    },
  ];

  const popularTodayTopics = ['Climate Bill', 'Housing', 'Healthcare', 'Budget', 'AI Regulation'];


  const defaultSystemPrompt = 'You are the Parliamentary AI Assistant for the Irish Parliament. Answer clearly and factually using the provided parliamentary context. Prioritize evidence, cite sources when possible, and be concise but complete.';

  const responseStructureInstruction = [
    'Return the answer with these exact bold Markdown section labels in order:',
    '**Summary**',
    '**Evidence**',
    '**Sources**',
    '**Related Debates**',
    '**Confidence**',
    '**Engineering Notes**',
    'Put each section label on its own line, with a blank line before and after it. Use short paragraphs separated by blank lines and Markdown bullet lists where they improve scanning.',
    'Within Evidence, use bold descriptive subsections such as **Government position:** and **Opposition criticism:** when relevant. Do not use Markdown heading syntax (# or ##).',
    'Only make claims supported by the supplied context. Under Sources, cite records using their titles; do not invent URLs.',
  ].join('\n');

  const buildSystemPrompt = (promptId?: string, isDeepResearch = false): string => {
    const deepResearchInstruction = isDeepResearch
      ? '\n\nDeep research mode: compare evidence across the supplied records, identify changes over time, and distinguish direct evidence from interpretation.'
      : '';
    if (!promptId) {
      return `${defaultSystemPrompt}\n\n${responseStructureInstruction}${deepResearchInstruction}`;
    }

    const selectedPrompt = promptLibrary.find(prompt => prompt.id === promptId);
    return `${selectedPrompt?.systemPrompt || defaultSystemPrompt}\n\n${responseStructureInstruction}${deepResearchInstruction}`;
  };

  const getConfidenceLabel = (confidence: number): 'High' | 'Medium' | 'Low' => {
    if (confidence >= 0.8) return 'High';
    if (confidence >= 0.6) return 'Medium';
    return 'Low';
  };

  function generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  function detectLanguage(text: string): 'en' | 'ga' {
    const irishIndicators = ['agus', 'go', 'an', 'na', 'ach', 'ar', 'le', 't�', 'n�l'];
    const normalizedText = text.toLowerCase();
    const irishCount = irishIndicators.filter(word => normalizedText.includes(word)).length;
    return irishCount > 0 ? 'ga' : 'en';
  }

  function estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('recent-research-queries');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        setRecentResearch(parsed.slice(0, 6));
      }
    } catch (error) {
      console.error('Failed to load recent research queries:', error);
    }
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const updateLayout = () => setIsDesktop(mediaQuery.matches);
    mediaQuery.addEventListener('change', updateLayout);
    return () => mediaQuery.removeEventListener('change', updateLayout);
  }, []);

  const updateRecentResearch = (query: string) => {
    setRecentResearch((prev) => {
      const deduped = [query, ...prev.filter((item) => item !== query)].slice(0, 6);
      localStorage.setItem('recent-research-queries', JSON.stringify(deduped));
      return deduped;
    });
  };

  const updateMetrics = useCallback(async (execution: PromptExecution) => {
    try {
      // Send to backend API for permanent storage
      await fetch(`${API_URL}/api/chat/execution`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(execution)
      });

      // Keep localStorage as backup/cache for immediate UI updates
      const savedMetrics = localStorage.getItem('chat-metrics');
      const currentMetrics = savedMetrics ? JSON.parse(savedMetrics) : {
        totalQueries: 0,
        avgResponseTime: 0,
        avgCost: 0,
        satisfaction: 0,
        executions: []
      };

      currentMetrics.executions.push(execution);
      currentMetrics.totalQueries = currentMetrics.executions.length;
      
      const completedExecutions = currentMetrics.executions.filter((ex: any) => ex.status === 'completed');
      if (completedExecutions.length > 0) {
        currentMetrics.avgResponseTime = completedExecutions.reduce((sum: number, ex: any) => 
          sum + (ex.processingTimeMs || 0), 0) / completedExecutions.length / 1000;
        currentMetrics.avgCost = completedExecutions.reduce((sum: number, ex: any) => 
          sum + ex.cost, 0) / completedExecutions.length;
        
        const feedbackExecutions = completedExecutions.filter((ex: any) => 
          ex.thumbsUp !== undefined || ex.thumbsDown !== undefined);
        if (feedbackExecutions.length > 0) {
          const positiveCount = feedbackExecutions.filter((ex: any) => ex.thumbsUp).length;
          currentMetrics.satisfaction = positiveCount / feedbackExecutions.length;
        }
      }

      localStorage.setItem('chat-metrics', JSON.stringify(currentMetrics));
      
      // Store execution in map for feedback lookup
      setExecutionsMap(prev => new Map(prev.set(execution.id, execution)));
    } catch (error) {
      console.error('Failed to send metrics to backend:', error);
      // Fall back to localStorage only
      const savedMetrics = localStorage.getItem('chat-metrics');
      const currentMetrics = savedMetrics ? JSON.parse(savedMetrics) : {
        totalQueries: 0,
        avgResponseTime: 0,
        avgCost: 0,
        satisfaction: 0,
        executions: []
      };
      currentMetrics.executions.push(execution);
      localStorage.setItem('chat-metrics', JSON.stringify(currentMetrics));
      
      // Store execution in map for feedback lookup
      setExecutionsMap(prev => new Map(prev.set(execution.id, execution)));
    }
  }, []);

  const routeToOptimalModel = (query: string, context: any[]): 'gemini-flash' | 'gemini-pro' => {
    const complexity = query.length > 200 ? 0.8 : query.length > 100 ? 0.6 : 0.4;
    const contextSize = context.length;
    const hasComplexReasoning = /why|how|analyze|compare|explain|complex/i.test(query);
    
    if (hasComplexReasoning && complexity > 0.7) {
      return 'gemini-pro';
    }

    // GPT-4o-mini is not configured in the production API; Gemini Flash serves standard retrieval queries.
    void contextSize;
    return 'gemini-flash';
  };

  const executeQuery = async (
    query: string,
    promptId?: string,
    isDeepResearch = false
  ): Promise<{ response: Message; execution: PromptExecution }> => {
    const startTime = Date.now();
    const searchResponse = await apiPost<{ documents?: SearchDocument[] }>('/api/search', {
      query,
      limit: isDeepResearch ? 50 : 20,
    });
    const context = searchResponse.documents || [];
    const selectedModel = isDeepResearch ? 'gemini-pro' : routeToOptimalModel(query, context);
    
    const execution: PromptExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      promptId,
      sessionId: sessionId.current,
      query,
      originalLanguage: detectLanguage(query),
      targetLanguage: userLanguage,
      modelUsed: selectedModel,
      startTime: new Date(),
      tokensInput: estimateTokens(query),
      tokensOutput: 0,
      cost: 0,
      confidence: 0,
      retrievedDocuments: context.length,
      status: 'running'
    };

    try {
      const apiResponse = await apiPost<{
        text: string;
        tokensInput: number;
        tokensOutput: number;
        confidence: number;
        model: string;
        processingTime: number;
        cost: number;
        executionId?: string;
        promptId?: string;
        analysisMode?: string;
      }>('/api/chat', {
        query,
        context,
        model: selectedModel,
        userLanguage,
        prompt: buildSystemPrompt(promptId, isDeepResearch),
        sessionId: sessionId.current,
        promptId
      });

      execution.endTime = new Date();
      execution.processingTimeMs = apiResponse.processingTime;
      execution.tokensInput = apiResponse.tokensInput;
      execution.tokensOutput = apiResponse.tokensOutput;
      execution.cost = apiResponse.cost;
      execution.confidence = apiResponse.confidence;
      execution.response = apiResponse.text;
      execution.status = 'completed';

      const response: Message = {
        id: (Date.now() + 1).toString(),
        text: apiResponse.text,
        sender: 'bot',
        timestamp: new Date(),
        executionId: apiResponse.executionId || execution.id,
        sources: context,
        metadata: {
          modelUsed: selectedModel,
          cost: apiResponse.cost,
          processingTime: apiResponse.processingTime,
          confidence: apiResponse.confidence,
          tokensUsed: apiResponse.tokensInput + apiResponse.tokensOutput,
          retrievedDocuments: context.length,
          analysisMode: apiResponse.analysisMode,
          deepResearch: isDeepResearch
        }
      };

      setUsage((currentUsage) => ({
        inputTokens: currentUsage.inputTokens + apiResponse.tokensInput,
        outputTokens: currentUsage.outputTokens + apiResponse.tokensOutput,
        cost: currentUsage.cost + apiResponse.cost,
        requests: currentUsage.requests + 1,
        lastTokens: apiResponse.tokensInput + apiResponse.tokensOutput,
        lastCost: apiResponse.cost,
      }));
      updateMetrics(execution);
      return { response, execution };

    } catch (error) {
      console.error('Backend chat request failed:', error);

      execution.endTime = new Date();
      execution.processingTimeMs = Date.now() - startTime;
      execution.status = 'failed';
      execution.error = error instanceof Error ? error.message : 'Model unavailable';
      execution.promptId = promptId;

      updateMetrics(execution);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Sanitize and validate input
    const sanitizedInput = sanitizeInput(inputValue.trim(), 2000);
    if (!validateQueryInput(sanitizedInput)) {
      alert('Invalid input detected. Please enter a valid parliamentary query.');
      return;
    }

    track('enquire', 'search', 'submit');

    const userMessage: Message = {
      id: Date.now().toString(),
      text: sanitizedInput,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    updateRecentResearch(userMessage.text);
    setIsLoading(true);
    announceLoading('Searching parliamentary records for your query');
    
    // Track prompt usage
    trackPromptUsage(userMessage.text);
    
    setInputValue('');
    const promptToUse = selectedPromptId;
    const deepResearchToUse = deepResearch;
    setSelectedPromptId(undefined);

    try {
      const { response } = await executeQuery(userMessage.text, promptToUse, deepResearchToUse);
      setMessages(prev => [...prev, response]);
      announceComplete('Search results loaded successfully');
    } catch (error) {
      console.error('Chat submission error:', error);
      const selectedPrompt = promptToUse ? promptLibrary.find(p => p.id === promptToUse) : undefined;
      const modeLabel = selectedPrompt?.analysisFocus || 'General retrieval and answer mode';
      const failureMessage = error instanceof Error ? error.message : 'The selected AI model is currently unavailable. Please try again later.';
      const isRateLimited = /rate limit|too many requests/i.test(failureMessage);

      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: isRateLimited
          ? `Request limit reached.\n\n${failureMessage}`
          : `Model unavailable for ${modeLabel}.\n\n${failureMessage}`,
        sender: 'bot',
        timestamp: new Date(),
        metadata: {
          modelUsed: 'gemini-flash',
          cost: 0,
          processingTime: 0,
          confidence: 0,
          tokensUsed: 0,
          retrievedDocuments: 0,
          analysisMode: modeLabel
        }
      };

      setMessages(prev => [...prev, errorResponse]);
  announceComplete(isRateLimited ? 'Request limit reached. Please try again shortly.' : 'Model unavailable. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptSelect = (promptText: string, _promptId: string) => {
    setShowPromptLibrary(false);
    setSelectedPromptId(_promptId);
    setInputValue(promptText);
    track('enquire', 'prompt-select', 'click', _promptId);
    // Focus the input field after selecting a prompt
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const applyResearchGoal = (goal: string) => {
    setSelectedResearchGoal(goal);
    const starter = `Research goal: ${goal}. `;
    setInputValue(starter);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  // ── Feedback handlers ────────────────────────────────────────────────────

  const sendFeedback = useCallback(async (
    messageId: string,
    sentiment: 'up' | 'down',
    executionId?: string,
    category?: string,
    verbatim?: string,
  ) => {
    const execution = executionId ? executionsMap.get(executionId) : undefined;
    try {
      await apiPost('/api/feedback', {
        sessionId: sessionId.current,
        messageId,
        executionId: executionId ?? null,
        queryText: execution?.query ?? '',
        sentiment,
        category: category ?? null,
        verbatim: verbatim ?? null,
      });
    } catch (err) {
      console.error('Failed to submit feedback:', err);
    }
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, feedbackGiven: true } : m));
  }, [executionsMap]);

  const doThumbsUp = useCallback((messageId: string, executionId?: string) => {
    setFeedbackStates(prev => ({ ...prev, [messageId]: { sentiment: 'up', panelOpen: false, category: '', verbatim: '', submitted: true } }));
    sendFeedback(messageId, 'up', executionId);
  }, [sendFeedback]);

  const doThumbsDown = useCallback((messageId: string, executionId?: string) => {
    setFeedbackStates(prev => ({ ...prev, [messageId]: { sentiment: 'down', panelOpen: false, category: '', verbatim: '', submitted: true } }));
    sendFeedback(messageId, 'down', executionId);
  }, [sendFeedback]);

  const toggleFeedbackPanel = useCallback((messageId: string) => {
    setFeedbackStates(prev => {
      const cur = prev[messageId] ?? { panelOpen: false, category: '', verbatim: '', submitted: false };
      return { ...prev, [messageId]: { ...cur, panelOpen: !cur.panelOpen } };
    });
  }, []);

  const selectCategory = useCallback((messageId: string, cat: string) => {
    setFeedbackStates(prev => {
      const cur = prev[messageId] ?? { panelOpen: true, category: '', verbatim: '', submitted: false };
      return { ...prev, [messageId]: { ...cur, category: cur.category === cat ? '' : cat } };
    });
  }, []);

  const updateVerbatim = useCallback((messageId: string, verbatim: string) => {
    setFeedbackStates(prev => {
      const cur = prev[messageId] ?? { panelOpen: true, category: '', verbatim: '', submitted: false };
      return { ...prev, [messageId]: { ...cur, verbatim } };
    });
  }, []);

  const submitStructuredFeedback = useCallback((messageId: string, executionId?: string) => {
    const state = feedbackStates[messageId];
    if (!state) return;
    setFeedbackStates(prev => ({ ...prev, [messageId]: { ...state, panelOpen: false, submitted: true, sentiment: 'down' } }));
    sendFeedback(messageId, 'down', executionId, state.category || undefined, state.verbatim || undefined);
  }, [feedbackStates, sendFeedback]);

  const copyToClipboard = async (text: string) => {
    try {
      // For ChatGPT-style copying, we preserve the original markdown formatting
      // This ensures that when pasted into apps that support markdown (like Discord, Slack, etc.)
      // or when pasted as plain text, the formatting indicators are preserved
      
      // Keep the original markdown formatting intact
      let formattedText = text;
      
      // Only clean up spacing and ensure consistent formatting
      formattedText = text
        .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
        .replace(/^- /gm, '� ') // Convert dashes to bullets for consistency
        .trim(); // Remove trailing whitespace
      
      await navigator.clipboard.writeText(formattedText);
      console.log('Text copied to clipboard with markdown formatting preserved');
    } catch (error) {
      console.error('Failed to copy text:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        console.log('Text copied to clipboard (fallback)');
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
      }
      document.body.removeChild(textArea);
    }
  };

  const resizeChatPanel = (clientX: number) => {
    const workspace = workspaceRef.current;
    if (!workspace) return;

    const bounds = workspace.getBoundingClientRect();
    const nextWidth = ((bounds.right - clientX) / bounds.width) * 100;
    setChatPanelWidth(Math.min(78, Math.max(28, nextWidth)));
  };

  const handleResizeStart = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    resizeChatPanel(event.clientX);
  };

  const handleResizeMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      resizeChatPanel(event.clientX);
    }
  };

  const handleResizeKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    setChatPanelWidth((currentWidth) => Math.min(78, Math.max(28, currentWidth + (event.key === 'ArrowRight' ? 2 : -2))));
  };

  return (
    <PageShell className="h-[calc(100vh-80px)] p-5" contentClassName="h-full max-w-none">
      <LoadingAnnouncementRegion />

      <div ref={workspaceRef} className="grid h-full grid-cols-1 gap-4 xl:gap-0" style={isDesktop ? { gridTemplateColumns: `minmax(20rem, 1fr) 12px minmax(0, ${chatPanelWidth}%)` } as CSSProperties : undefined}>
        <section className="order-2 flex min-h-0 flex-col rounded-xl border border-[var(--dai-border)] bg-white shadow-sm xl:order-3">
          <div className="border-b border-[var(--dai-border)] bg-white px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-teal-200 bg-teal-50">
                  <Search size={15} className="text-teal-700" />
                </div>
                <div>
                  <h2 className="text-base font-semibold leading-tight text-[var(--dai-ink)]">Research Assistant</h2>
                  <p className="mt-0.5 text-xs text-[var(--dai-slate)]">Grounded in official parliamentary records</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-medium text-[var(--dai-slate)]">
                <span className="inline-flex items-center gap-1">
                  <ShieldCheck size={12} className="text-teal-600" />
                  Source grounded
                </span>
                <span className="inline-flex items-center gap-1">
                  <Lightbulb size={12} className="text-teal-600" />
                  Verifiable
                </span>
              </div>
            </div>
          </div>

          <div className={`min-h-0 overflow-y-auto p-4 ${messages.length === 0 ? 'flex-none' : 'flex-1'}`}>
            {messages.length === 0 ? (
              <>
                <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-slate-100">
                    <Search size={22} className="text-slate-400" />
                  </div>
                  <h3 className="mb-1 text-sm font-semibold text-[var(--dai-ink)]">Ask a research question</h3>
                  <p className="max-w-xs text-xs leading-relaxed text-[var(--dai-slate)]">Ask anything about parliamentary debates, legislation, voting records, or representatives.</p>
                </div>
                <div className="space-y-2">
                  {[
                    'How has housing policy evolved over the last 5 years?',
                    'What were the main arguments in today\'s debates?',
                  ].map((prompt, idx) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => handlePromptSelect(prompt, `quick_${idx}`)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-left text-sm text-[var(--dai-slate)] transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`rounded-lg border p-3 ${message.sender === 'user' ? 'border-[#1b3a5c] bg-[var(--color-navy-950)] text-white' : 'border-slate-200 bg-slate-50 text-[var(--dai-ink)]'}`}
                  >
                    {message.sender === 'bot' ? (
                      <div className="prose prose-sm max-w-none prose-headings:mb-2 prose-headings:mt-5 prose-headings:text-[var(--dai-ink)] prose-p:my-3 prose-p:leading-6 prose-li:my-1">
                        <ReactMarkdown>
                          {message.text}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap text-sm">{message.text}</p>
                    )}

                    {message.sender === 'bot' && message.metadata && (
                      <div className="mt-3 flex items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-[var(--dai-slate)]">
                        <span>Confidence: {getConfidenceLabel(message.metadata.confidence)}</span>
                        <span aria-hidden="true">&bull;</span>
                        <button
                          type="button"
                          onClick={() => setSourceDialog({ sources: message.sources || [], responseId: message.id })}
                          className="font-medium text-teal-700 underline decoration-teal-400 underline-offset-2 hover:text-teal-900"
                          aria-haspopup="dialog"
                        >
                          Sources: {message.sources?.length ?? message.metadata.retrievedDocuments}
                        </button>
                      </div>
                    )}

                    {message.sender === 'bot' && (
                      <div className="mt-2">
                        <div className="flex flex-wrap items-center gap-1 border-t border-[var(--dai-border)] pt-2 text-xs">
                          <button onClick={() => copyToClipboard(message.text)} aria-label="Copy response" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[var(--dai-slate)] hover:bg-slate-100"><Copy size={12} />Copy</button>
                          {FEEDBACK_ENABLED && (() => {
                            const fs = feedbackStates[message.id];
                            const submitted = fs?.submitted ?? false;
                            return (
                              <>
                                <button
                                  onClick={() => !submitted && doThumbsUp(message.id, message.executionId)}
                                  aria-label="Helpful"
                                  disabled={submitted}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition ${submitted && fs?.sentiment === 'up' ? 'text-teal-600' : 'text-[var(--dai-slate)] hover:bg-slate-100'} disabled:opacity-40`}
                                ><ThumbsUp size={12} /></button>
                                <button
                                  onClick={() => !submitted && doThumbsDown(message.id, message.executionId)}
                                  aria-label="Not helpful"
                                  disabled={submitted}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition ${submitted && fs?.sentiment === 'down' && !fs.panelOpen ? 'text-rose-500' : 'text-[var(--dai-slate)] hover:bg-slate-100'} disabled:opacity-40`}
                                ><ThumbsDown size={12} /></button>
                                <button
                                  onClick={() => !submitted && toggleFeedbackPanel(message.id)}
                                  aria-label="Give feedback"
                                  disabled={submitted}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition ${fs?.panelOpen ? 'bg-slate-100 text-[var(--dai-ink)]' : 'text-[var(--dai-slate)] hover:bg-slate-100'} disabled:opacity-40`}
                                ><MessageSquare size={12} /></button>
                                {submitted && (
                                  <span className="ml-auto text-[11px] font-medium text-teal-600">
                                    {fs?.sentiment === 'up' ? 'Thanks for the feedback' : 'Feedback received'}
                                  </span>
                                )}
                              </>
                            );
                          })()}
                        </div>
                        {FEEDBACK_ENABLED && (() => {
                          const fs = feedbackStates[message.id];
                          if (!fs?.panelOpen || fs.submitted) return null;
                          return (
                            <div className="mt-2 rounded-lg border border-slate-200 bg-white p-3">
                              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">What could be improved?</p>
                              <div className="mb-3 flex flex-wrap gap-1.5">
                                {FEEDBACK_CATEGORIES.map(cat => (
                                  <button key={cat} onClick={() => selectCategory(message.id, cat)}
                                    className={`rounded-full border px-2.5 py-1 text-xs transition ${fs.category === cat ? 'border-teal-400 bg-teal-50 font-medium text-teal-700' : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-teal-300 hover:bg-teal-50'}`}
                                  >{cat}</button>
                                ))}
                              </div>
                              <textarea
                                value={fs.verbatim}
                                onChange={e => updateVerbatim(message.id, e.target.value)}
                                placeholder="Optional: describe the issue (do not include personal information)"
                                rows={2}
                                className="w-full resize-none rounded-md border border-slate-200 bg-slate-50 p-2 text-xs leading-relaxed text-slate-700 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100"
                              />
                              <p className="mb-2 mt-1 text-[10px] text-slate-400">Don't include personal information. Your feedback helps improve this assistant.</p>
                              <div className="flex justify-end gap-2">
                                <button onClick={() => toggleFeedbackPanel(message.id)} className="rounded-md border border-slate-200 px-3 py-1 text-xs text-slate-500 hover:bg-slate-50">Dismiss</button>
                                <button onClick={() => submitStructuredFeedback(message.id, message.executionId)} className="rounded-md bg-[var(--color-teal-600)] px-3 py-1 text-xs font-medium text-white hover:bg-[var(--color-teal-500)]">Submit feedback</button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-[var(--dai-slate)]">
                Searching parliamentary records...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-[var(--dai-border)] p-4">
            <form onSubmit={handleSubmit}>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white p-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask your question in natural language..."
                  className="min-w-0 flex-1 bg-transparent px-1 py-1 text-sm text-[var(--dai-slate)] outline-none"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[var(--color-teal-600)] text-white hover:bg-[var(--color-teal-500)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Send size={14} />
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPromptLibrary(!showPromptLibrary)}
                    aria-label="Perform action"
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--dai-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--dai-slate)] hover:bg-slate-50"
                  >
                    <Lightbulb size={12} />
                    Research Library
                  </button>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={deepResearch}
                    onClick={() => setDeepResearch((enabled) => !enabled)}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition ${deepResearch ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-[var(--dai-border)] bg-white text-[var(--dai-slate)] hover:bg-slate-50'}`}
                  >
                    Deep Research
                    <span className={`inline-flex h-3.5 w-7 rounded-full p-0.5 transition ${deepResearch ? 'bg-teal-600' : 'bg-slate-200'}`}><span className={`h-2.5 w-2.5 rounded-full bg-white transition ${deepResearch ? 'translate-x-3.5' : ''}`} /></span>
                  </button>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-[var(--dai-slate)]">
                  <span className="inline-flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-600" />Responses are grounded in official parliamentary records.</span>
                  <span className="font-medium text-[var(--dai-ink)]">Latest: {usage.lastTokens.toLocaleString()} tokens, ${usage.lastCost.toFixed(4)}</span>
                  <span>Session total: {usage.requests} requests, {(usage.inputTokens + usage.outputTokens).toLocaleString()} tokens, ${usage.cost.toFixed(4)} estimated</span>
                </div>
              </div>
            </form>
          </div>
        </section>

        <div className="order-3 hidden min-h-0 items-stretch justify-center xl:order-2 xl:flex">
          <button
            type="button"
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize chat and research tools"
            aria-valuemin={28}
            aria-valuemax={78}
            aria-valuenow={Math.round(chatPanelWidth)}
            onPointerDown={handleResizeStart}
            onPointerMove={handleResizeMove}
            onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
            onKeyDown={handleResizeKeyDown}
            className="group flex w-full cursor-col-resize touch-none items-center justify-center outline-none focus-visible:bg-teal-100"
          >
            <span className="h-12 w-1 rounded-full bg-slate-300 transition group-hover:bg-teal-500 group-focus-visible:bg-teal-600" />
          </button>
        </div>

        <section className="order-1 min-h-0 overflow-y-auto rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm xl:order-1">
          <div className="mb-4 border-b border-slate-200 pb-3">
            <h3 className="text-sm font-semibold text-[var(--dai-ink)]">Research Tools</h3>
            <p className="mt-0.5 text-xs text-[var(--dai-slate)]">Choose a goal or starter to begin your analysis.</p>
          </div>

          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-[var(--dai-ink)]">Research Goals</h4>
            <div className="flex flex-wrap gap-1.5">
              {researchGoals.map((goal) => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => applyResearchGoal(goal)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${selectedResearchGoal === goal ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600 hover:border-teal-200 hover:bg-teal-50 hover:text-teal-700'}`}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-[var(--dai-ink)]">Investigation Starters</h4>
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {starterGroups.map((group) => (
                <div key={group.title} className="rounded-lg border border-[var(--dai-border)] bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-[var(--dai-ink)]">{group.title}</p>
                    <ChevronRight size={14} className="text-[var(--dai-slate)]" />
                  </div>
                  <div className="space-y-1.5">
                    {group.prompts.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => handlePromptSelect(prompt, `starter_${group.title}`)}
                        className="flex w-full items-start gap-1.5 text-left text-xs text-[var(--dai-slate)] hover:text-[var(--dai-ink)]"
                      >
                        <ChevronRight size={11} className="mt-0.5 flex-shrink-0 text-slate-300" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-[var(--dai-border)] bg-white p-3">
              <p className="mb-2 font-semibold text-[var(--dai-ink)]">Popular Today</p>
              <div className="flex flex-wrap gap-2">
                {popularTodayTopics.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => handlePromptSelect(`What are the latest developments on ${topic.toLowerCase()}?`, `topic_${topic}`)}
                    className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-[var(--dai-slate)] hover:bg-teal-50 hover:text-teal-700"
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--dai-border)] bg-white p-3">
              <p className="mb-2 font-semibold text-[var(--dai-ink)]">Recent Research</p>
              {recentResearch.length > 0 ? (
                <div className="space-y-1.5">
                  {recentResearch.slice(0, 4).map((query) => (
                    <button
                      key={query}
                      type="button"
                      onClick={() => handlePromptSelect(query, 'recent_research')}
                      className="flex w-full items-start gap-1.5 text-left text-xs text-[var(--dai-slate)] hover:text-[var(--dai-ink)]"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--dai-slate)]">Sign in and start researching to build your recent analyses list.</p>
              )}
            </div>
          </div>

          <div>
            <h4 className="mb-2 text-sm font-semibold text-[var(--dai-ink)]">Trending Questions</h4>
            <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
              {(popularPrompts.length > 0 ? popularPrompts : promptExamples.map((prompt) => ({ prompt, count: 0 }))).slice(0, 4).map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePromptSelect(item.prompt, `popular_${index}`)}
                  className="rounded-lg border border-[var(--dai-border)] bg-white p-3 text-left text-xs text-[var(--dai-slate)] hover:bg-slate-50"
                >
                  {item.prompt}
                </button>
              ))}
              <button type="button" className="rounded-lg border border-[var(--dai-border)] bg-white p-3 text-left text-xs font-semibold text-[var(--dai-slate)] hover:bg-slate-50">
                View all trending
              </button>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck size={14} className="mt-0.5 flex-shrink-0 text-teal-600" />
              <div>
                <p className="text-xs font-semibold text-slate-700">About this assistant</p>
                <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">Responses are grounded in official records. AI inference is distinguished from verified facts. Confidence indicates evidence strength, not certainty.</p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-[var(--dai-border)] pt-3 text-center text-xs text-[var(--dai-slate)]">
            Data sourced from <a href="https://www.oireachtas.ie/en/copyright-and-reuse/" className="text-blue-600 hover:underline">official parliamentary records</a> under the <a href="https://data.oireachtas.ie/ie/oireachtas/corporate/governanceAndReform/2016/2016-03-27_oireachtas-psi-licence-open-data_en.pdf" className="text-blue-600 hover:underline">Oireachtas Open Data PSI Licence</a>.
          </div>
        </section>
      </div>

      {/* Prompt Library Modal */}
      {showPromptLibrary && (
        <PromptLibrary
          onClose={() => setShowPromptLibrary(false)}
          onSelectPrompt={(prompt: string, promptId: string) => handlePromptSelect(prompt, promptId)}
        />
      )}

      {sourceDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={() => setSourceDialog(null)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={`source-dialog-title-${sourceDialog.responseId}`}
            className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 id={`source-dialog-title-${sourceDialog.responseId}`} className="text-base font-semibold text-[var(--dai-ink)]">Sources used for this answer</h3>
                <p className="mt-1 text-sm text-[var(--dai-slate)]">Official parliamentary records retrieved for this response.</p>
              </div>
              <button type="button" onClick={() => setSourceDialog(null)} aria-label="Close sources" className="rounded-md p-1 text-[var(--dai-slate)] hover:bg-slate-100 hover:text-[var(--dai-ink)]">
                <X size={18} />
              </button>
            </div>
            {sourceDialog.sources.length > 0 ? (
              <ol className="space-y-3">
                {sourceDialog.sources.map((source, index) => (
                  <li key={`${source.source}-${source.id}`} className="border-b border-slate-100 pb-3 last:border-0">
                    {source.uri ? (
                      <a href={source.uri} target="_blank" rel="noreferrer" className="font-medium text-teal-700 underline decoration-teal-400 underline-offset-2 hover:text-teal-900">
                        {index + 1}. {source.title}
                      </a>
                    ) : (
                      <span className="font-medium text-[var(--dai-ink)]">{index + 1}. {source.title}</span>
                    )}
                    <p className="mt-1 text-xs text-[var(--dai-slate)]">{source.source} {source.date ? `| ${source.date}` : ''}</p>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-sm text-[var(--dai-slate)]">No source records were returned for this response.</p>
            )}
          </section>
        </div>
      )}
    </PageShell>
  );
}
