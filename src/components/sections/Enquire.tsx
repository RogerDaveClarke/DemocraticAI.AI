import { useState, useRef, useEffect, useCallback, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { track } from '@/utils/analytics';
import { Send, ThumbsUp, ThumbsDown, Lightbulb, Copy, ShieldCheck, ChevronRight, MessageSquare, Search, Settings2, X, Plus, Pencil, Trash2, Bookmark, Share2, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import PromptLibrary from '../PromptLibrary';
import { useLoadingAnnouncer } from '../../hooks/accessibilityHooks';
import { sanitizeInput, validateQueryInput } from '../../utils/security';
import { apiGet, apiPost } from '../../utils/api';
import { promptLibrary } from '../../data/promptLibrary';
import { PageShell } from '@/components/patterns';
import { API_URL } from '@/config/runtime';
import { toPublicOfficialSourceUrl } from '@/utils/officialSources';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  executionId?: string;
  feedbackGiven?: boolean;
  sources?: SearchDocument[];
  savedPromptId?: string;
  metadata?: {
    modelUsed: string;
    cost: number;
    processingTime: number;
    confidence: number;
    tokensInput?: number;
    tokensOutput?: number;
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

type PromptScope = {
  promptText: string;
  promptId: string;
  requiresMembers: number;
  requiresDebate: boolean;
  requiresBill: boolean;
  requiresPeriod: boolean;
};

type ScopeOption = { id: string; label: string };

type RecordType = SearchDocument['source'];
type ResearchSettings = {
  responseLength: 'brief' | 'standard' | 'detailed';
  precision: 'focused' | 'balanced' | 'exploratory';
  sourceBreadth: 10 | 20 | 50;
  dateRange: 'all' | 'year' | 'fiveYears';
  recordTypes: RecordType[];
  answerFormat: 'briefing' | 'timeline' | 'comparison' | 'plainLanguage';
  citationDetail: 'sources' | 'claims';
  language: 'en' | 'ga';
};

const DEFAULT_RESEARCH_SETTINGS: ResearchSettings = {
  responseLength: 'standard',
  precision: 'balanced',
  sourceBreadth: 20,
  dateRange: 'all',
  recordTypes: ['bill', 'debate', 'question'],
  answerFormat: 'briefing',
  citationDetail: 'sources',
  language: 'en',
};

interface ResearchSkill {
  id: string;
  name: string;
  description: string;
  instructions: string;
  isBuiltIn?: boolean;
}

const BUILT_IN_SKILLS: ResearchSkill[] = [
  {
    id: 'policy-timeline',
    name: 'Policy timeline',
    description: 'Trace policy changes over time.',
    instructions: 'Create a dated policy timeline. Identify legislative actions, stated positions, and changes over time. Separate direct record evidence from interpretation.',
    isBuiltIn: true,
  },
  {
    id: 'bill-comparison',
    name: 'Bill comparison',
    description: 'Compare legislation and amendments.',
    instructions: 'Compare the relevant bills, versions, amendments, stages, and positions. State clearly when the records do not contain a requested comparison point.',
    isBuiltIn: true,
  },
  {
    id: 'vote-analysis',
    name: 'Vote analysis',
    description: 'Analyse divisions and positions.',
    instructions: 'Analyse voting and recorded positions using only the supplied records. Distinguish recorded votes from discussion or inferred political positions.',
    isBuiltIn: true,
  },
];

const USER_SKILLS_STORAGE_KEY = 'research-user-skills';



const FEEDBACK_ENABLED = true;

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
  const [selectedPromptId, setSelectedPromptId] = useState<string | undefined>(undefined);
  const [executionsMap, setExecutionsMap] = useState<Map<string, PromptExecution>>(new Map());
  const [selectedResearchGoal, setSelectedResearchGoal] = useState('');
  const [recentResearch, setRecentResearch] = useState<string[]>([]);
  const [sourceDialog, setSourceDialog] = useState<{ sources: SearchDocument[]; responseId: string } | null>(null);
  const [chatPanelWidth, setChatPanelWidth] = useState(70);
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia('(min-width: 1280px)').matches);
  const [deepResearch, setDeepResearch] = useState(false);
  const [showResearchSettings, setShowResearchSettings] = useState(false);
  const [researchSettings, setResearchSettings] = useState<ResearchSettings>(DEFAULT_RESEARCH_SETTINGS);
  const [userSkills, setUserSkills] = useState<ResearchSkill[]>([]);
  const [selectedSkillId, setSelectedSkillId] = useState<string | undefined>();
  const [skillEditor, setSkillEditor] = useState<{ id?: string; name: string; description: string; instructions: string; isBuiltIn?: boolean } | null>(null);
  const [savedPromptId, setSavedPromptId] = useState<string | undefined>();
  const [savePromptDialog, setSavePromptDialog] = useState(false);
  const [promptTitle, setPromptTitle] = useState('');
  const [sharePrompt, setSharePrompt] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [reportDialog, setReportDialog] = useState<Message | null>(null);
  const [reportTitle, setReportTitle] = useState('');
  const [reportPublic, setReportPublic] = useState(false);
  const [savingReport, setSavingReport] = useState(false);
  const [reportSaveError, setReportSaveError] = useState('');
  const [savedReportScope, setSavedReportScope] = useState<'mine' | 'all' | null>(null);
  const [promptScope, setPromptScope] = useState<PromptScope | null>(null);
  const [scopeMembers, setScopeMembers] = useState<ScopeOption[]>([]);
  const [scopeRecords, setScopeRecords] = useState<SearchDocument[]>([]);
  const [scopeValues, setScopeValues] = useState({ memberOne: '', memberTwo: '', debate: '', bill: '', period: '' });
  const [scopeLoading, setScopeLoading] = useState(false);
  const [scopeError, setScopeError] = useState('');
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

  useEffect(() => {
    try {
      const savedSkills = localStorage.getItem(USER_SKILLS_STORAGE_KEY);
      if (savedSkills) setUserSkills(JSON.parse(savedSkills) as ResearchSkill[]);
    } catch (error) {
      console.error('Failed to load user research skills:', error);
    }
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

  const buildSystemPrompt = (promptId?: string, isDeepResearch = false, settings = DEFAULT_RESEARCH_SETTINGS, skill?: ResearchSkill): string => {
    const deepResearchInstruction = isDeepResearch
      ? '\n\nDeep research mode: compare evidence across the supplied records, identify changes over time, and distinguish direct evidence from interpretation.'
      : '';
    const formatInstructions: Record<ResearchSettings['answerFormat'], string> = {
      briefing: 'a concise policy briefing',
      timeline: 'a chronological timeline',
      comparison: 'a direct comparison of positions or changes',
      plainLanguage: 'a plain-language explanation',
    };
    const settingsInstruction = `\n\nAnswer in ${settings.language === 'ga' ? 'Irish' : 'English'} as ${formatInstructions[settings.answerFormat]}. ${settings.citationDetail === 'claims' ? 'Associate each material claim with the relevant source title.' : 'Provide a source list for the analysis.'}`;
    const skillInstruction = skill
      ? `\n\nUser-defined research skill: ${skill.name}. Apply this workflow only when it is consistent with the supplied official records and source-grounding rules:\n${skill.instructions}`
      : '';
    if (!promptId) {
      return `${defaultSystemPrompt}\n\n${responseStructureInstruction}${deepResearchInstruction}${settingsInstruction}${skillInstruction}`;
    }

    const selectedPrompt = promptLibrary.find(prompt => prompt.id === promptId);
    return `${selectedPrompt?.systemPrompt || defaultSystemPrompt}\n\n${responseStructureInstruction}${deepResearchInstruction}${settingsInstruction}${skillInstruction}`;
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
    isDeepResearch = false,
    settings = DEFAULT_RESEARCH_SETTINGS,
    skill?: ResearchSkill,
    associatedSavedPromptId?: string
  ): Promise<{ response: Message; execution: PromptExecution }> => {
    const startTime = Date.now();
    const dateFrom = settings.dateRange === 'all'
      ? undefined
      : new Date(new Date().setFullYear(new Date().getFullYear() - (settings.dateRange === 'year' ? 1 : 5))).toISOString().slice(0, 10);
    const searchResponse = await apiPost<{ documents?: SearchDocument[] }>('/api/search', {
      query,
      limit: isDeepResearch ? 50 : settings.sourceBreadth,
      filters: dateFrom ? { dateFrom } : undefined,
    });
    const context = (searchResponse.documents || []).filter((document) => settings.recordTypes.includes(document.source));
    const selectedModel = isDeepResearch ? 'gemini-pro' : routeToOptimalModel(query, context);
    const outputTokens = settings.responseLength === 'brief' ? 768 : settings.responseLength === 'detailed' ? 3072 : 1536;
    const temperature = settings.precision === 'focused' ? 0 : settings.precision === 'exploratory' ? 0.25 : 0.1;
    
    const execution: PromptExecution = {
      id: `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      promptId,
      sessionId: sessionId.current,
      query,
      originalLanguage: detectLanguage(query),
      targetLanguage: settings.language,
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
        userLanguage: settings.language,
        prompt: buildSystemPrompt(promptId, isDeepResearch, settings, skill),
        sessionId: sessionId.current,
        promptId,
        savedPromptId: associatedSavedPromptId,
        filters: { dateFrom, sourceTypes: settings.recordTypes },
        generationSettings: { maxOutputTokens: outputTokens, temperature },
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
        savedPromptId: associatedSavedPromptId,
        metadata: {
          modelUsed: selectedModel,
          cost: apiResponse.cost,
          processingTime: apiResponse.processingTime,
          confidence: apiResponse.confidence,
          tokensInput: apiResponse.tokensInput,
          tokensOutput: apiResponse.tokensOutput,
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
    const settingsToUse = researchSettings;
    const savedPromptToUse = savedPromptId;
    const selectedSkill = [...BUILT_IN_SKILLS, ...userSkills].find((skill) => skill.id === selectedSkillId);
    setSelectedPromptId(undefined);

    try {
      const { response } = await executeQuery(userMessage.text, promptToUse, deepResearchToUse, settingsToUse, selectedSkill, savedPromptToUse);
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

  const loadPromptScopeOptions = (scope: PromptScope) => {
    const withTimeout = <T,>(request: Promise<T>): Promise<T> => Promise.race([
      request,
      new Promise<T>((_, reject) => window.setTimeout(() => reject(new Error('Loading official records timed out.')), 12000)),
    ]);
    setScopeLoading(true);
    setScopeError('');
    Promise.all([
      scope.requiresMembers ? withTimeout(apiGet<{ members?: Array<{ id?: string; memberId?: string; memberCode?: string; showAs?: string; fullName?: string; name?: string }> }>('/api/members?limit=100&active_only=true')) : Promise.resolve({ members: [] }),
      scope.requiresDebate ? withTimeout(apiGet<{ documents?: SearchDocument[] }>('/api/reference/debates')) : Promise.resolve({ documents: [] }),
      scope.requiresBill ? withTimeout(apiGet<{ documents?: SearchDocument[] }>('/api/reference/bills')) : Promise.resolve({ documents: [] }),
    ]).then(([memberResponse, debateResponse, billResponse]) => {
      setScopeMembers((memberResponse.members || []).map((member) => ({ id: member.id || member.memberId || member.memberCode || member.showAs || '', label: member.showAs || member.fullName || member.name || 'Unnamed member' })).filter((member) => member.id));
      const uniqueRecords = [...(debateResponse.documents || []), ...(billResponse.documents || [])].filter((record, index, records) => records.findIndex((candidate) => candidate.source === record.source && candidate.id === record.id) === index);
      setScopeRecords(uniqueRecords);
    }).catch((error) => {
      console.error('Failed to load prompt scope options:', error);
      setScopeError(error instanceof Error ? error.message : 'Could not load official records.');
    }).finally(() => setScopeLoading(false));
  };

  const handlePromptSelect = (promptText: string, _promptId: string) => {
    setShowPromptLibrary(false);
    const normalized = promptText.toLowerCase();
    const scope: PromptScope = {
      promptText,
      promptId: _promptId,
      requiresMembers: /two members|compare how .*members/.test(normalized) ? 2 : /this member|member's/.test(normalized) ? 1 : 0,
      requiresDebate: /this debate|the debate/.test(normalized),
      requiresBill: /this bill|this legislation|compare amendments|bill versions/.test(normalized),
      requiresPeriod: /this year|last year|this month|last month|past \d+ years?|over the last \d+ years?/.test(normalized),
    };
    if (scope.requiresMembers || scope.requiresDebate || scope.requiresBill || scope.requiresPeriod) {
      setPromptScope(scope);
      setScopeValues({ memberOne: '', memberTwo: '', debate: '', bill: '', period: '' });
      loadPromptScopeOptions(scope);
      return;
    }
    setSelectedPromptId(_promptId);
    setInputValue(promptText);
    track('enquire', 'prompt-select', 'click', _promptId);
    // Focus the input field after selecting a prompt
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const applyPromptScope = () => {
    if (!promptScope) return;
    const members = scopeMembers.filter((member) => [scopeValues.memberOne, scopeValues.memberTwo].includes(member.id)).map((member) => member.label);
    const debate = scopeRecords.find((record) => record.id === scopeValues.debate)?.title;
    const bill = scopeRecords.find((record) => record.id === scopeValues.bill)?.title;
    const scopeLines = [
      members.length ? `Members: ${members.join(' and ')}.` : '',
      debate ? `Debate: ${debate}.` : '',
      bill ? `Bill or legislation: ${bill}.` : '',
      scopeValues.period ? `Period: ${scopeValues.period}.` : '',
    ].filter(Boolean);
    setSelectedPromptId(promptScope.promptId);
    setInputValue(`${promptScope.promptText}\n\n${scopeLines.join(' ')}`);
    setPromptScope(null);
    setTimeout(() => inputRef.current?.focus(), 100);
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

  const rateSavedPrompt = useCallback(async (promptId: string, executionId: string | undefined, rating: 1 | -1) => {
    if (!executionId) return;
    try { await apiPost(`/api/prompts/${promptId}/rating`, { executionId, rating }); }
    catch (error) { console.error('Failed to rate saved prompt:', error); }
  }, []);

  const doThumbsUp = useCallback((messageId: string, executionId?: string, promptId?: string) => {
    setFeedbackStates(prev => ({ ...prev, [messageId]: { sentiment: 'up', panelOpen: false, category: '', verbatim: '', submitted: true } }));
    sendFeedback(messageId, 'up', executionId);
    if (promptId) void rateSavedPrompt(promptId, executionId, 1);
  }, [rateSavedPrompt, sendFeedback]);

  const doThumbsDown = useCallback((messageId: string, executionId?: string, promptId?: string) => {
    setFeedbackStates(prev => ({ ...prev, [messageId]: { sentiment: 'down', panelOpen: false, category: '', verbatim: '', submitted: true } }));
    sendFeedback(messageId, 'down', executionId);
    if (promptId) void rateSavedPrompt(promptId, executionId, -1);
  }, [rateSavedPrompt, sendFeedback]);

  const savePrompt = async () => {
    if (!inputValue.trim()) return;
    setSavingPrompt(true);
    try {
      const result = await apiPost<{ id: string }>('/api/prompts', { text: inputValue.trim(), title: promptTitle, shared: sharePrompt });
      setSavedPromptId(result.id);
      setSavePromptDialog(false);
      setPromptTitle('');
      setSharePrompt(false);
    } catch (error) {
      console.error('Failed to save prompt:', error);
    } finally {
      setSavingPrompt(false);
    }
  };

  const saveReport = async () => {
    if (!reportDialog?.executionId || !reportTitle.trim()) return;
    setSavingReport(true);
    setReportSaveError('');
    try {
      await apiPost('/api/reports', {
        title: reportTitle,
        content: reportDialog.text,
        sources: reportDialog.sources || [],
        executionId: reportDialog.executionId,
        isPublic: reportPublic,
        metrics: {
          model: reportDialog.metadata?.modelUsed,
          tokensInput: reportDialog.metadata?.tokensInput,
          tokensOutput: reportDialog.metadata?.tokensOutput,
          cost: reportDialog.metadata?.cost,
        },
      });
      setReportDialog(null);
      setReportTitle('');
      setReportPublic(false);
      setSavedReportScope(reportPublic ? 'all' : 'mine');
    } catch (error) {
      console.error('Failed to save report:', error);
      setReportSaveError(error instanceof Error ? error.message : 'Could not save this report.');
    } finally {
      setSavingReport(false);
    }
  };

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

  const allSkills = [...BUILT_IN_SKILLS, ...userSkills];

  const saveSkill = () => {
    if (!skillEditor?.name.trim() || !skillEditor.instructions.trim()) return;
    const savedSkill: ResearchSkill = {
      id: skillEditor.id ?? `user-skill-${Date.now()}`,
      name: skillEditor.name.trim().slice(0, 80),
      description: skillEditor.description.trim().slice(0, 180),
      instructions: skillEditor.instructions.trim().slice(0, 1200),
    };
    const nextSkills = skillEditor.id
      ? userSkills.map((skill) => skill.id === skillEditor.id ? savedSkill : skill)
      : [...userSkills, savedSkill];
    setUserSkills(nextSkills);
    localStorage.setItem(USER_SKILLS_STORAGE_KEY, JSON.stringify(nextSkills));
    setSelectedSkillId(savedSkill.id);
    setSkillEditor(null);
  };

  const deleteSkill = (skillId: string) => {
    const nextSkills = userSkills.filter((skill) => skill.id !== skillId);
    setUserSkills(nextSkills);
    localStorage.setItem(USER_SKILLS_STORAGE_KEY, JSON.stringify(nextSkills));
    if (selectedSkillId === skillId) setSelectedSkillId(undefined);
  };

  const openSkillDetails = (skillId: string) => {
    if (!skillId) {
      setSelectedSkillId(undefined);
      setSkillEditor(null);
      return;
    }
    const skill = allSkills.find((item) => item.id === skillId);
    if (!skill) return;
    setSelectedSkillId(skill.id);
    setSkillEditor({ ...skill, isBuiltIn: skill.isBuiltIn });
  };

  return (
    <PageShell className="h-[calc(100vh-80px)] p-5" contentClassName="h-full max-w-none">
      <LoadingAnnouncementRegion />

      <div ref={workspaceRef} className="grid h-full min-h-0 grid-cols-1 gap-4 overflow-hidden xl:gap-0" style={isDesktop ? { gridTemplateColumns: `minmax(20rem, 1fr) 12px minmax(0, ${chatPanelWidth}%)` } as CSSProperties : undefined}>
        <section className="order-2 flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-[var(--dai-border)] bg-white shadow-sm xl:order-3">
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

          <div className={`min-h-0 overscroll-contain overflow-y-auto ${messages.length === 0 ? 'flex-none' : 'flex-1 px-5 py-4'}`}>
            {messages.length > 0 && (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={message.sender === 'user'
                      ? 'rounded-lg border border-[#1b3a5c] bg-[var(--color-navy-950)] p-3 text-white'
                      : 'border-b border-slate-200 py-2 text-[var(--dai-ink)] last:border-b-0'}
                  >
                    {message.sender === 'bot' ? (
                      <div className="prose prose-sm max-w-none text-[13px] leading-5 prose-headings:mb-2 prose-headings:mt-5 prose-headings:text-sm prose-headings:font-semibold prose-headings:text-[var(--dai-ink)] prose-p:my-2 prose-p:leading-5 prose-li:my-1 prose-ul:my-2">
                        <ReactMarkdown components={{
                          p: ({ children }) => {
                            const content = Array.isArray(children) ? children : [children];
                            const isSectionLabel = content.length === 1 && typeof content[0] === 'object' && content[0] !== null && 'type' in content[0] && content[0].type === 'strong';
                            return <p className={isSectionLabel ? 'mb-3 mt-6 font-semibold text-[var(--dai-ink)] first:mt-0' : undefined}>{children}</p>;
                          },
                        }}>
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
                          {message.executionId && <button onClick={() => { setReportTitle('Research report'); setReportPublic(false); setReportDialog(message); }} aria-label="Save report" className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[var(--dai-slate)] hover:bg-slate-100"><FileText size={12} />Save report</button>}
                          {FEEDBACK_ENABLED && (() => {
                            const fs = feedbackStates[message.id];
                            const submitted = fs?.submitted ?? false;
                            return (
                              <>
                                <button
                                  onClick={() => !submitted && doThumbsUp(message.id, message.executionId, message.savedPromptId)}
                                  aria-label="Helpful"
                                  disabled={submitted}
                                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 transition ${submitted && fs?.sentiment === 'up' ? 'text-teal-600' : 'text-[var(--dai-slate)] hover:bg-slate-100'} disabled:opacity-40`}
                                ><ThumbsUp size={12} /></button>
                                <button
                                  onClick={() => !submitted && doThumbsDown(message.id, message.executionId, message.savedPromptId)}
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
                <div className="relative flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowPromptLibrary(!showPromptLibrary)}
                    aria-label="Perform action"
                    className="inline-flex items-center gap-1 rounded-full border border-[var(--dai-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--dai-slate)] hover:bg-slate-50"
                  >
                    <Lightbulb size={12} />
                    Research Library
                  </button>
                  <button type="button" onClick={() => { setPromptTitle(inputValue.trim().slice(0, 80)); setSavePromptDialog(true); }} disabled={!inputValue.trim()} className="inline-flex items-center gap-1 rounded-full border border-[var(--dai-border)] bg-white px-3 py-1 text-xs font-medium text-[var(--dai-slate)] hover:bg-slate-50 disabled:opacity-50">
                    <Bookmark size={12} /> Save prompt
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
                  <button
                    type="button"
                    onClick={() => setShowResearchSettings((open) => !open)}
                    aria-label="Research settings"
                    aria-expanded={showResearchSettings}
                    title="Research settings"
                    className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${showResearchSettings ? 'border-teal-300 bg-teal-50 text-teal-700' : 'border-[var(--dai-border)] bg-white text-[var(--dai-slate)] hover:bg-slate-50'}`}
                  >
                    <Settings2 size={14} />
                  </button>
                  {showResearchSettings && (
                    <div className="absolute left-0 top-full z-30 mt-2 w-[min(30rem,calc(100vw-3rem))] rounded-lg border border-[var(--dai-border)] bg-white p-4 shadow-lg">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-[var(--dai-ink)]">Research settings</h3>
                        <button type="button" onClick={() => setResearchSettings(DEFAULT_RESEARCH_SETTINGS)} className="text-xs font-medium text-teal-700 hover:text-teal-900">Reset</button>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <label className="space-y-1 text-[var(--dai-slate)]">Response length
                          <select value={researchSettings.responseLength} onChange={(event) => setResearchSettings((settings) => ({ ...settings, responseLength: event.target.value as ResearchSettings['responseLength'] }))} className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-[var(--dai-ink)]">
                            <option value="brief">Brief</option><option value="standard">Standard</option><option value="detailed">Detailed</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-[var(--dai-slate)]">Precision
                          <select value={researchSettings.precision} onChange={(event) => setResearchSettings((settings) => ({ ...settings, precision: event.target.value as ResearchSettings['precision'] }))} className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-[var(--dai-ink)]">
                            <option value="focused">Focused</option><option value="balanced">Balanced</option><option value="exploratory">Exploratory</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-[var(--dai-slate)]">Source breadth
                          <select value={researchSettings.sourceBreadth} onChange={(event) => setResearchSettings((settings) => ({ ...settings, sourceBreadth: Number(event.target.value) as ResearchSettings['sourceBreadth'] }))} className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-[var(--dai-ink)]">
                            <option value={10}>10 records</option><option value={20}>20 records</option><option value={50}>50 records</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-[var(--dai-slate)]">Date range
                          <select value={researchSettings.dateRange} onChange={(event) => setResearchSettings((settings) => ({ ...settings, dateRange: event.target.value as ResearchSettings['dateRange'] }))} className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-[var(--dai-ink)]">
                            <option value="all">All records</option><option value="year">Last year</option><option value="fiveYears">Last 5 years</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-[var(--dai-slate)]">Answer format
                          <select value={researchSettings.answerFormat} onChange={(event) => setResearchSettings((settings) => ({ ...settings, answerFormat: event.target.value as ResearchSettings['answerFormat'] }))} className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-[var(--dai-ink)]">
                            <option value="briefing">Briefing</option><option value="timeline">Timeline</option><option value="comparison">Comparison</option><option value="plainLanguage">Plain language</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-[var(--dai-slate)]">Citation detail
                          <select value={researchSettings.citationDetail} onChange={(event) => setResearchSettings((settings) => ({ ...settings, citationDetail: event.target.value as ResearchSettings['citationDetail'] }))} className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-[var(--dai-ink)]">
                            <option value="sources">Source list</option><option value="claims">Per material claim</option>
                          </select>
                        </label>
                        <label className="space-y-1 text-[var(--dai-slate)]">Answer language
                          <select value={researchSettings.language} onChange={(event) => setResearchSettings((settings) => ({ ...settings, language: event.target.value as ResearchSettings['language'] }))} className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-[var(--dai-ink)]">
                            <option value="en">English</option><option value="ga">Irish</option>
                          </select>
                        </label>
                      </div>
                      <fieldset className="mt-3 border-t border-[var(--dai-border)] pt-3">
                        <legend className="mb-2 text-xs font-medium text-[var(--dai-slate)]">Record types</legend>
                        <div className="flex flex-wrap gap-3">
                          {(['bill', 'debate', 'question'] as RecordType[]).map((recordType) => (
                            <label key={recordType} className="inline-flex items-center gap-1.5 text-xs text-[var(--dai-ink)]">
                              <input type="checkbox" checked={researchSettings.recordTypes.includes(recordType)} onChange={(event) => setResearchSettings((settings) => ({ ...settings, recordTypes: event.target.checked ? [...settings.recordTypes, recordType] : settings.recordTypes.filter((type) => type !== recordType) }))} className="h-3.5 w-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                              {recordType === 'bill' ? 'Bills' : recordType === 'debate' ? 'Debates' : 'Questions'}
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-xs text-[var(--dai-slate)]">
                  <span className="inline-flex items-center gap-1"><ShieldCheck size={12} className="text-emerald-600" />Responses are grounded in official parliamentary records.</span>
                  {usage.requests > 0 && <>
                    <span className="font-medium text-[var(--dai-ink)]">Latest: {usage.lastTokens.toLocaleString()} tokens, ${usage.lastCost.toFixed(4)}</span>
                    <span>Session total: {usage.requests} requests, {(usage.inputTokens + usage.outputTokens).toLocaleString()} tokens, ${usage.cost.toFixed(4)} estimated</span>
                  </>}
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

          <div className="mb-4 border-b border-[var(--dai-border)] pb-4">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h4 className="text-sm font-semibold text-[var(--dai-ink)]">Research Skills</h4>
              <button type="button" onClick={() => setSkillEditor({ name: '', description: '', instructions: '' })} className="inline-flex items-center gap-1 rounded-md border border-[var(--dai-border)] px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-50">
                <Plus size={13} /> New skill
              </button>
            </div>
            <select value={selectedSkillId ?? ''} onChange={(event) => openSkillDetails(event.target.value)} className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2.5 py-2 text-xs text-[var(--dai-ink)]">
              <option value="">General research</option>
              <optgroup label="Built-in skills">
                {BUILT_IN_SKILLS.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
              </optgroup>
              {userSkills.length > 0 && <optgroup label="My skills">
                {userSkills.map((skill) => <option key={skill.id} value={skill.id}>{skill.name}</option>)}
              </optgroup>}
            </select>
            {skillEditor && (
              <div className="mt-3 space-y-2 rounded-md border border-[var(--dai-border)] bg-[var(--dai-muted)] p-3">
                <input readOnly={skillEditor.isBuiltIn} value={skillEditor.name} onChange={(event) => setSkillEditor({ ...skillEditor, name: event.target.value })} placeholder="Skill name" className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-xs text-[var(--dai-ink)] read-only:bg-slate-100" />
                <input readOnly={skillEditor.isBuiltIn} value={skillEditor.description} onChange={(event) => setSkillEditor({ ...skillEditor, description: event.target.value })} placeholder="What this skill helps investigate" className="w-full rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-xs text-[var(--dai-ink)] read-only:bg-slate-100" />
                <textarea readOnly={skillEditor.isBuiltIn} value={skillEditor.instructions} onChange={(event) => setSkillEditor({ ...skillEditor, instructions: event.target.value })} placeholder="Describe the evidence-based workflow to apply" rows={4} className="w-full resize-none rounded-md border border-[var(--dai-border)] bg-white px-2 py-1.5 text-xs leading-relaxed text-[var(--dai-ink)] read-only:bg-slate-100" />
                <p className="text-[11px] leading-relaxed text-[var(--dai-slate)]">Skills guide analysis. Official parliamentary records remain the source of evidence.</p>
                <div className="flex justify-end gap-2">
                  {!skillEditor.isBuiltIn && skillEditor.id && <button type="button" onClick={() => { deleteSkill(skillEditor.id!); setSkillEditor(null); }} className="mr-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-rose-600 hover:bg-white"><Trash2 size={12} />Delete</button>}
                  <button type="button" onClick={() => setSkillEditor(null)} className="rounded-md px-2 py-1 text-xs text-[var(--dai-slate)] hover:bg-white">Close</button>
                  {!skillEditor.isBuiltIn && <button type="button" onClick={saveSkill} disabled={!skillEditor.name.trim() || !skillEditor.instructions.trim()} className="inline-flex items-center gap-1 rounded-md bg-[var(--color-teal-600)] px-2 py-1 text-xs font-medium text-white hover:bg-[var(--color-teal-500)] disabled:opacity-50"><Pencil size={12} />Save skill</button>}
                </div>
              </div>
            )}
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

      {promptScope && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="prompt-scope-title" className="w-full max-w-lg rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><h3 id="prompt-scope-title" className="text-base font-semibold text-[var(--dai-ink)]">Complete research scope</h3><p className="mt-1 text-xs leading-relaxed text-[var(--dai-slate)]">This prompt needs specific official records before it can run.</p></div>
              <button type="button" onClick={() => setPromptScope(null)} aria-label="Cancel prompt scope" className="rounded-md p-1 text-[var(--dai-slate)] hover:bg-slate-100"><X size={18} /></button>
            </div>
            <p className="mb-4 rounded-md bg-[var(--dai-muted)] p-3 text-sm text-[var(--dai-ink)]">{promptScope.promptText}</p>
            {scopeLoading ? <p className="text-sm text-[var(--dai-slate)]">Loading official records...</p> : scopeError ? <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><p>{scopeError}</p><button type="button" onClick={() => loadPromptScopeOptions(promptScope)} className="mt-2 font-medium text-teal-700 hover:underline">Try again</button></div> : <div className="space-y-3">
              {promptScope.requiresMembers >= 1 && <label className="block text-xs font-medium text-[var(--dai-slate)]">{promptScope.requiresMembers === 2 ? 'First member' : 'Member'}<select value={scopeValues.memberOne} onChange={(event) => setScopeValues((values) => ({ ...values, memberOne: event.target.value }))} className="mt-1 w-full rounded-md border border-[var(--dai-border)] bg-white px-3 py-2 text-sm text-[var(--dai-ink)]"><option value="">Select a member</option>{scopeMembers.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</select></label>}
              {promptScope.requiresMembers === 2 && <label className="block text-xs font-medium text-[var(--dai-slate)]">Second member<select value={scopeValues.memberTwo} onChange={(event) => setScopeValues((values) => ({ ...values, memberTwo: event.target.value }))} className="mt-1 w-full rounded-md border border-[var(--dai-border)] bg-white px-3 py-2 text-sm text-[var(--dai-ink)]"><option value="">Select a member</option>{scopeMembers.filter((member) => member.id !== scopeValues.memberOne).map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}</select></label>}
              {promptScope.requiresDebate && <label className="block text-xs font-medium text-[var(--dai-slate)]">Debate<select value={scopeValues.debate} onChange={(event) => setScopeValues((values) => ({ ...values, debate: event.target.value }))} className="mt-1 w-full rounded-md border border-[var(--dai-border)] bg-white px-3 py-2 text-sm text-[var(--dai-ink)]"><option value="">Select a debate</option>{scopeRecords.filter((record) => record.source === 'debate').map((record) => <option key={record.id} value={record.id}>{record.title}</option>)}</select></label>}
              {promptScope.requiresBill && <label className="block text-xs font-medium text-[var(--dai-slate)]">Bill or legislation<select value={scopeValues.bill} onChange={(event) => setScopeValues((values) => ({ ...values, bill: event.target.value }))} className="mt-1 w-full rounded-md border border-[var(--dai-border)] bg-white px-3 py-2 text-sm text-[var(--dai-ink)]"><option value="">Select a bill or legislation record</option>{scopeRecords.filter((record) => record.source === 'bill').map((record) => <option key={record.id} value={record.id}>{record.title}</option>)}</select></label>}
              {promptScope.requiresPeriod && <label className="block text-xs font-medium text-[var(--dai-slate)]">Time period<select value={scopeValues.period} onChange={(event) => setScopeValues((values) => ({ ...values, period: event.target.value }))} className="mt-1 w-full rounded-md border border-[var(--dai-border)] bg-white px-3 py-2 text-sm text-[var(--dai-ink)]"><option value="">Select a time period</option>{Array.from({ length: 6 }, (_, index) => new Date().getFullYear() - index).map((year) => <option key={year} value={String(year)}>{year}</option>)}<option value="Last month">Last month</option><option value="This month">This month</option></select></label>}
            </div>}
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setPromptScope(null)} className="rounded-md border border-[var(--dai-border)] px-3 py-2 text-sm text-[var(--dai-slate)] hover:bg-slate-50">Cancel</button><button type="button" onClick={applyPromptScope} disabled={scopeLoading || (promptScope.requiresMembers >= 1 && (!scopeValues.memberOne || (promptScope.requiresMembers === 2 && !scopeValues.memberTwo))) || (promptScope.requiresDebate && !scopeValues.debate) || (promptScope.requiresBill && !scopeValues.bill) || (promptScope.requiresPeriod && !scopeValues.period)} className="rounded-md bg-[var(--color-teal-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-teal-500)] disabled:opacity-50">Use scoped prompt</button></div>
          </section>
        </div>
      )}

      {savePromptDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="save-prompt-title" className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div><h3 id="save-prompt-title" className="text-base font-semibold text-[var(--dai-ink)]">Save research prompt</h3><p className="mt-1 text-xs text-[var(--dai-slate)]">Save this prompt to your library for reuse.</p></div>
              <Bookmark className="h-5 w-5 text-teal-700" />
            </div>
            <label className="block text-xs font-medium text-[var(--dai-slate)]">Name
              <input value={promptTitle} onChange={(event) => setPromptTitle(event.target.value)} className="mt-1 w-full rounded-md border border-[var(--dai-border)] px-3 py-2 text-sm text-[var(--dai-ink)]" />
            </label>
            <p className="mt-3 rounded-md bg-[var(--dai-muted)] p-3 text-xs leading-relaxed text-[var(--dai-slate)]">{inputValue}</p>
            <label className="mt-4 flex items-start gap-2 text-sm text-[var(--dai-ink)]">
              <input type="checkbox" checked={sharePrompt} onChange={(event) => setSharePrompt(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
              <span><span className="inline-flex items-center gap-1 font-medium"><Share2 size={13} /> Share with all users</span><span className="mt-1 block text-xs text-[var(--dai-slate)]">Shared prompts appear in the public Research Library.</span></span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSavePromptDialog(false)} disabled={savingPrompt} className="rounded-md border border-[var(--dai-border)] px-3 py-2 text-sm text-[var(--dai-slate)] hover:bg-slate-50">Cancel</button>
              <button type="button" onClick={savePrompt} disabled={savingPrompt || !promptTitle.trim()} className="rounded-md bg-[var(--color-teal-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-teal-500)] disabled:opacity-50">{savingPrompt ? 'Saving...' : 'Save prompt'}</button>
            </div>
          </section>
        </div>
      )}

      {reportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="save-report-title" className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3"><div><h3 id="save-report-title" className="text-base font-semibold text-[var(--dai-ink)]">Save research report</h3><p className="mt-1 text-xs text-[var(--dai-slate)]">This saves the response Markdown, source links, date, and model usage metrics.</p></div><FileText className="h-5 w-5 text-teal-700" /></div>
            <label className="block text-xs font-medium text-[var(--dai-slate)]">Report name<input value={reportTitle} onChange={(event) => setReportTitle(event.target.value)} className="mt-1 w-full rounded-md border border-[var(--dai-border)] px-3 py-2 text-sm text-[var(--dai-ink)]" /></label>
            <label className="mt-4 flex items-start gap-2 text-sm text-[var(--dai-ink)]"><input type="checkbox" checked={reportPublic} onChange={(event) => setReportPublic(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" /><span><span className="inline-flex items-center gap-1 font-medium"><Share2 size={13} /> Make this report public</span><span className="mt-1 block text-xs text-[var(--dai-slate)]">Public reports appear in All Saved for signed-in users.</span></span></label>
            {reportSaveError && <p className="mt-3 text-xs text-rose-600">{reportSaveError}</p>}
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setReportDialog(null)} disabled={savingReport} className="rounded-md border border-[var(--dai-border)] px-3 py-2 text-sm text-[var(--dai-slate)] hover:bg-slate-50">Cancel</button><button type="button" onClick={saveReport} disabled={savingReport || !reportTitle.trim()} className="rounded-md bg-[var(--color-teal-600)] px-3 py-2 text-sm font-medium text-white hover:bg-[var(--color-teal-500)] disabled:opacity-50">{savingReport ? 'Saving...' : 'Save report'}</button></div>
          </section>
        </div>
      )}

      {savedReportScope && <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-lg border border-teal-200 bg-white px-4 py-3 text-sm text-[var(--dai-ink)] shadow-lg"><span>Report saved.</span><a href={`/saved-research?scope=${savedReportScope}`} className="font-medium text-teal-700 hover:underline">View report</a><button type="button" onClick={() => setSavedReportScope(null)} aria-label="Dismiss saved report confirmation" className="text-[var(--dai-slate)] hover:text-[var(--dai-ink)]"><X size={16} /></button></div>}

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
                    {toPublicOfficialSourceUrl(source.uri) ? (
                      <a href={toPublicOfficialSourceUrl(source.uri)} target="_blank" rel="noreferrer" className="font-medium text-teal-700 underline decoration-teal-400 underline-offset-2 hover:text-teal-900">
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
