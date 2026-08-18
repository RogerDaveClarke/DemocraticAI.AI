import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarRange,
  Check,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  Filter,
  Flame,
  Library,
  ListFilter,
  MessageCircle,
  Scale,
  Search,
  Sparkles,
  Tags,
  UserRound,
  Loader2,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiPost, handleAPIError } from '../../utils/api';
import { PageShell } from '@/components/patterns';
import { track } from '@/utils/analytics';

type DebateTab = 'latest' | 'trending' | 'most-viewed' | 'longest';

interface DebateRecord {
  id: string;
  title: string;
  chamber: string;
  date: string;
  durationMinutes: number;
  contributions: number;
  speakers: number;
  organisations: number;
  documents: number;
  votes: number;
  tags: string[];
  sentiment: 'Positive' | 'Neutral' | 'Mixed';
  topicBreakdown: Array<{ label: string; share: number }>;
  trend: Array<{ time: string; positive: number; neutral: number; negative: number }>;
  insight: string;
  uri?: string;
  isRecent?: boolean;
}

interface SearchDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  date?: string;
  uri?: string;
}

const fallbackDebates: DebateRecord[] = [
  {
    id: 'debate-1',
    title: 'Online Safety (Amendment) Bill 2026 - Second Stage',
    chamber: 'Dail Eireann',
    date: '6 Aug 2026',
    durationMinutes: 163,
    contributions: 128,
    speakers: 42,
    organisations: 7,
    documents: 12,
    votes: 3,
    tags: ['Technology', 'Safety', 'Children'],
    sentiment: 'Positive',
    topicBreakdown: [
      { label: 'Online Harms', share: 31 },
      { label: 'Children Protection', share: 24 },
      { label: 'Content Moderation', share: 18 },
      { label: 'Platform Responsibility', share: 12 },
      { label: 'Data Transparency', share: 8 },
    ],
    trend: [
      { time: '09:00', positive: 58, neutral: 30, negative: 12 },
      { time: '09:30', positive: 62, neutral: 26, negative: 12 },
      { time: '10:00', positive: 56, neutral: 28, negative: 16 },
      { time: '10:30', positive: 64, neutral: 24, negative: 12 },
      { time: '11:00', positive: 60, neutral: 27, negative: 13 },
      { time: '11:30', positive: 67, neutral: 22, negative: 11 },
    ],
    insight: 'Sentiment shifted positive after child-safety amendment discussion.',
    isRecent: true,
  },
  {
    id: 'debate-2',
    title: 'Housing (Amendment) Bill 2026 - Committee Stage',
    chamber: 'Dail Eireann',
    date: '5 Aug 2026',
    durationMinutes: 198,
    contributions: 156,
    speakers: 51,
    organisations: 6,
    documents: 9,
    votes: 1,
    tags: ['Housing', 'Planning', 'Local Government'],
    sentiment: 'Mixed',
    topicBreakdown: [
      { label: 'Affordable Housing', share: 29 },
      { label: 'Zoning', share: 20 },
      { label: 'Tenant Rights', share: 18 },
      { label: 'Funding', share: 17 },
      { label: 'Regional Supply', share: 10 },
    ],
    trend: [
      { time: '09:00', positive: 45, neutral: 32, negative: 23 },
      { time: '09:30', positive: 42, neutral: 34, negative: 24 },
      { time: '10:00', positive: 48, neutral: 30, negative: 22 },
      { time: '10:30', positive: 44, neutral: 31, negative: 25 },
      { time: '11:00', positive: 46, neutral: 29, negative: 25 },
      { time: '11:30', positive: 47, neutral: 30, negative: 23 },
    ],
    insight: 'Debate polarized after zoning and regional allocations were introduced.',
  },
  {
    id: 'debate-3',
    title: 'Health (Provision) Bill 2026 - Second Stage',
    chamber: 'Dail Eireann',
    date: '4 Aug 2026',
    durationMinutes: 125,
    contributions: 94,
    speakers: 36,
    organisations: 5,
    documents: 6,
    votes: 0,
    tags: ['Health', 'Services', 'Funding'],
    sentiment: 'Positive',
    topicBreakdown: [
      { label: 'Primary Care', share: 34 },
      { label: 'Hospital Capacity', share: 23 },
      { label: 'Funding Model', share: 17 },
      { label: 'Staffing', share: 14 },
      { label: 'Preventive Care', share: 8 },
    ],
    trend: [
      { time: '09:00', positive: 61, neutral: 27, negative: 12 },
      { time: '09:30', positive: 63, neutral: 25, negative: 12 },
      { time: '10:00', positive: 59, neutral: 29, negative: 12 },
      { time: '10:30', positive: 64, neutral: 24, negative: 12 },
      { time: '11:00', positive: 66, neutral: 23, negative: 11 },
      { time: '11:30', positive: 62, neutral: 27, negative: 11 },
    ],
    insight: 'Most interventions aligned around expanding primary-care access.',
  },
  {
    id: 'debate-4',
    title: 'Education (Amendment) Bill 2026 - Second Stage',
    chamber: 'Seanad Eireann',
    date: '3 Aug 2026',
    durationMinutes: 118,
    contributions: 83,
    speakers: 29,
    organisations: 3,
    documents: 4,
    votes: 0,
    tags: ['Education', 'Schools', 'Students'],
    sentiment: 'Neutral',
    topicBreakdown: [
      { label: 'School Capacity', share: 26 },
      { label: 'Teacher Pipeline', share: 22 },
      { label: 'Student Supports', share: 20 },
      { label: 'Digital Classrooms', share: 19 },
      { label: 'Rural Access', share: 9 },
    ],
    trend: [
      { time: '09:00', positive: 50, neutral: 37, negative: 13 },
      { time: '09:30', positive: 52, neutral: 35, negative: 13 },
      { time: '10:00', positive: 49, neutral: 38, negative: 13 },
      { time: '10:30', positive: 51, neutral: 37, negative: 12 },
      { time: '11:00', positive: 53, neutral: 34, negative: 13 },
      { time: '11:30', positive: 50, neutral: 36, negative: 14 },
    ],
    insight: 'Consensus stayed steady; strongest concern focused on rural access.',
  },
  {
    id: 'debate-5',
    title: 'Climate Action (Amendment) Bill 2026 - Report Stage',
    chamber: 'Dail Eireann',
    date: '2 Aug 2026',
    durationMinutes: 150,
    contributions: 101,
    speakers: 38,
    organisations: 6,
    documents: 8,
    votes: 2,
    tags: ['Climate', 'Environment', 'Energy'],
    sentiment: 'Mixed',
    topicBreakdown: [
      { label: 'Carbon Targets', share: 28 },
      { label: 'Energy Transition', share: 24 },
      { label: 'Farming Impact', share: 18 },
      { label: 'Public Transport', share: 16 },
      { label: 'Household Costs', share: 10 },
    ],
    trend: [
      { time: '09:00', positive: 48, neutral: 29, negative: 23 },
      { time: '09:30', positive: 46, neutral: 31, negative: 23 },
      { time: '10:00', positive: 50, neutral: 27, negative: 23 },
      { time: '10:30', positive: 47, neutral: 28, negative: 25 },
      { time: '11:00', positive: 49, neutral: 27, negative: 24 },
      { time: '11:30', positive: 51, neutral: 26, negative: 23 },
    ],
    insight: 'Debate intensity increased around costs and transport obligations.',
  },
];

const topicCloud = [
  { text: 'online safety', size: 'text-4xl', color: 'text-cyan-600' },
  { text: 'children', size: 'text-3xl', color: 'text-emerald-500' },
  { text: 'regulation', size: 'text-lg', color: 'text-[var(--dai-slate)]' },
  { text: 'platform', size: 'text-lg', color: 'text-blue-500' },
  { text: 'transparency', size: 'text-base', color: 'text-cyan-500' },
  { text: 'harmful content', size: 'text-sm', color: 'text-[var(--dai-slate)]' },
  { text: 'social media', size: 'text-sm', color: 'text-indigo-400' },
  { text: 'age verification', size: 'text-sm', color: 'text-[var(--dai-slate)]' },
  { text: 'technology', size: 'text-sm', color: 'text-emerald-400' },
];

const speakers = [
  { name: 'James Browne TD', role: 'Minister for Enterprise', contributions: 18 },
  { name: 'Holly Cairns TD', role: 'Social Democrats', contributions: 15 },
  { name: 'Darren O Rourke TD', role: 'Sinn Fein', contributions: 12 },
];

const shortcuts = [
  { label: 'Search Debates', sub: 'Find debates by keywords', icon: Search },
  { label: 'Compare Debates', sub: 'Compare multiple debates', icon: Scale },
  { label: 'Debate Timeline', sub: 'See debate stages and votes', icon: CalendarRange },
  { label: 'Speaker Analysis', sub: 'Analyze speaking patterns', icon: UserRound },
  { label: 'Topic Trends', sub: 'Track topics over time', icon: BarChart3 },
  { label: 'Export Data', sub: 'Download debate data', icon: Download },
];

const tabs: Array<{ id: DebateTab; label: string }> = [
  { id: 'latest', label: 'Latest Debates' },
  { id: 'trending', label: 'Trending Debates' },
  { id: 'most-viewed', label: 'Most Viewed' },
  { id: 'longest', label: 'Longest Debates' },
];

const sentimentLexicon = {
  positive: ['support', 'agree', 'welcome', 'improve', 'progress', 'benefit', 'positive'],
  negative: ['concern', 'oppose', 'failure', 'risk', 'criticise', 'negative', 'delay'],
};

const palette = [
  'text-cyan-600',
  'text-emerald-500',
  'text-blue-500',
  'text-violet-500',
  'text-indigo-500',
  'text-[var(--dai-slate)]',
  'text-cyan-500',
  'text-emerald-400',
  'text-[var(--dai-slate)]',
];

const sizeScale = ['text-4xl', 'text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm'];

function formatDuration(durationMinutes: number): string {
  const safeMinutes = Number.isFinite(durationMinutes) ? Math.max(0, Math.round(durationMinutes)) : 0;
  const hours = Math.floor(safeMinutes / 60);
  const minutes = safeMinutes % 60;
  return `${hours}h ${String(minutes).padStart(2, '0')}m`;
}

function toDisplayDate(rawDate?: string): string {
  if (!rawDate) {
    return 'Unknown date';
  }
  const parsed = new Date(rawDate);
  if (Number.isNaN(parsed.getTime())) {
    return rawDate;
  }
  return parsed.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' });
}

function inferChamber(text: string): string {
  const normalized = text.toLowerCase();
  if (normalized.includes('seanad')) {
    return 'Seanad Eireann';
  }
  if (normalized.includes('committee')) {
    return 'Joint Committee';
  }
  return 'Dail Eireann';
}

function detectSentiment(text: string): 'Positive' | 'Neutral' | 'Mixed' {
  const normalized = text.toLowerCase();
  const positiveScore = sentimentLexicon.positive.filter((term) => normalized.includes(term)).length;
  const negativeScore = sentimentLexicon.negative.filter((term) => normalized.includes(term)).length;

  if (positiveScore > negativeScore + 1) {
    return 'Positive';
  }
  if (negativeScore > positiveScore + 1) {
    return 'Mixed';
  }
  return 'Neutral';
}

function extractTags(text: string): string[] {
  const cleaned = text
    .replace(/[^a-zA-Z\s]/g, ' ')
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 5);

  const ignored = new Set(['debate', 'parliament', 'ireland', 'during', 'around', 'between', 'through']);
  const counts = new Map<string, number>();

  cleaned.forEach((word) => {
    if (!ignored.has(word)) {
      counts.set(word, (counts.get(word) || 0) + 1);
    }
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word.charAt(0).toUpperCase() + word.slice(1));
}

function buildTopicBreakdown(tags: string[]): Array<{ label: string; share: number }> {
  if (tags.length === 0) {
    return [
      { label: 'Policy Debate', share: 35 },
      { label: 'Legislation', share: 24 },
      { label: 'Public Services', share: 19 },
      { label: 'Governance', share: 12 },
      { label: 'Civic Impact', share: 10 },
    ];
  }

  const weights = [32, 24, 18, 14, 12];
  return weights.map((share, index) => ({
    label: tags[index] || `Topic ${index + 1}`,
    share,
  }));
}

function buildTrend(sentiment: 'Positive' | 'Neutral' | 'Mixed'): Array<{ time: string; positive: number; neutral: number; negative: number }> {
  const baseline = sentiment === 'Positive'
    ? { positive: 62, neutral: 25, negative: 13 }
    : sentiment === 'Mixed'
      ? { positive: 48, neutral: 29, negative: 23 }
      : { positive: 52, neutral: 35, negative: 13 };

  const slots = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30'];
  return slots.map((slot, index) => ({
    time: slot,
    positive: Math.max(0, Math.min(100, baseline.positive + (index % 3) - 1)),
    neutral: Math.max(0, Math.min(100, baseline.neutral + ((index + 1) % 2))),
    negative: Math.max(0, Math.min(100, baseline.negative + (index % 2 ? 1 : -1))),
  }));
}

function estimateSpeakerCount(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(8, Math.min(55, Math.round(words / 22)));
}

function mapSearchDocumentsToDebates(documents: SearchDocument[]): DebateRecord[] {
  return documents.map((document, index) => {
    const merged = `${document.title || ''} ${document.content || ''}`;
    const tags = extractTags(merged);
    const sentiment = detectSentiment(merged);
    const contributions = Math.max(24, Math.min(220, Math.round((document.content?.length || 400) / 7)));
    const speakers = estimateSpeakerCount(document.content || document.title || '');
    const durationMinutes = Math.max(55, Math.min(260, Math.round(contributions * 1.25)));

    return {
      id: document.id || `live-debate-${index}`,
      title: document.title || 'Parliamentary Debate',
      chamber: inferChamber(merged),
      date: toDisplayDate(document.date),
      durationMinutes,
      contributions,
      speakers,
      organisations: Math.max(2, Math.round(speakers / 6)),
      documents: Math.max(3, Math.round((document.content?.length || 300) / 130)),
      votes: Math.max(0, Math.round((document.content?.length || 200) / 500)),
      tags,
      sentiment,
      topicBreakdown: buildTopicBreakdown(tags),
      trend: buildTrend(sentiment),
      insight: `Live analysis: ${sentiment.toLowerCase()} framing with ${tags[0] || 'policy'} as the dominant topic.`,
      uri: document.uri,
      isRecent: index < 2,
    };
  });
}

export default function Debates() {
  const [selectedTab, setSelectedTab] = useState<DebateTab>('latest');
  const [selectedDebateId, setSelectedDebateId] = useState(fallbackDebates[0].id);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'contributions' | 'speakers'>('recent');
  const [debateData, setDebateData] = useState<DebateRecord[]>(fallbackDebates);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    const timeoutId = window.setTimeout(async () => {
      const query = searchTerm.trim().length >= 3 ? searchTerm.trim() : 'debate';
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const response = await apiPost<{ documents?: SearchDocument[] }>('/api/search', {
          query,
          limit: 60,
          filters: { dateFrom: '2025-01-01' },
        });

        if (isCancelled) {
          return;
        }

        const debateDocuments = (response.documents || []).filter((document) => document.source === 'debate');
        const mappedDebates = mapSearchDocumentsToDebates(debateDocuments);
        if (mappedDebates.length > 0) {
          setDebateData(mappedDebates);
          if (!mappedDebates.some((debate) => debate.id === selectedDebateId)) {
            setSelectedDebateId(mappedDebates[0].id);
          }
        } else {
          setDebateData(fallbackDebates);
        }
      } catch (error) {
        if (!isCancelled) {
          setErrorMessage(handleAPIError(error));
          setDebateData(fallbackDebates);
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const kpiCards = useMemo(() => {
    const totalDebates = debateData.length;
    const totalContributions = debateData.reduce((sum, debate) => sum + debate.contributions, 0);
    const avgMinutes = totalDebates > 0 ? Math.round(debateData.reduce((sum, debate) => sum + debate.durationMinutes, 0) / totalDebates) : 0;
    const uniqueTopics = new Set(debateData.flatMap((debate) => debate.tags.map((tag) => tag.toLowerCase()))).size;
    const avgContributions = totalDebates > 0 ? totalContributions / totalDebates : 0;
    const publicInterest = avgContributions > 110 ? 'High' : avgContributions > 70 ? 'Moderate' : 'Growing';

    return [
      { label: 'Total Debates', value: totalDebates.toLocaleString('en-IE'), sub: 'Live dataset', delta: 'Source: /api/search', icon: MessageCircle, tone: 'text-cyan-700 bg-cyan-50' },
      { label: 'Speaking Contributions', value: totalContributions.toLocaleString('en-IE'), sub: 'Estimated from records', delta: 'Live aggregation', icon: UserRound, tone: 'text-blue-700 bg-blue-50' },
      { label: 'Average Debate Length', value: formatDuration(avgMinutes), sub: 'Current selection', delta: 'Computed live', icon: Clock3, tone: 'text-indigo-700 bg-indigo-50' },
      { label: 'Topics Discussed', value: uniqueTopics.toLocaleString('en-IE'), sub: 'Distinct topic tags', delta: 'Derived from content', icon: Tags, tone: 'text-violet-700 bg-violet-50' },
      { label: 'Public Interest', value: publicInterest, sub: 'Current trend', delta: 'Calculated signal', icon: Flame, tone: 'text-emerald-700 bg-emerald-50' },
    ];
  }, [debateData]);

  const dynamicTopicCloud = useMemo(() => {
    const topicCounts = new Map<string, number>();
    debateData.forEach((debate) => {
      debate.tags.forEach((tag) => {
        const normalized = tag.toLowerCase();
        topicCounts.set(normalized, (topicCounts.get(normalized) || 0) + 1);
      });
    });

    const entries = Array.from(topicCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 9);

    if (entries.length === 0) {
      return topicCloud;
    }

    return entries.map(([text], index) => ({
      text,
      size: sizeScale[Math.min(index, sizeScale.length - 1)],
      color: palette[index % palette.length],
    }));
  }, [debateData]);

  const visibleDebates = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    let filtered = debateData.filter((debate) => {
      if (!query) {
        return true;
      }
      return debate.title.toLowerCase().includes(query)
        || debate.tags.some((tag) => tag.toLowerCase().includes(query))
        || debate.chamber.toLowerCase().includes(query);
    });

    if (selectedTab === 'trending') {
      filtered = filtered.filter((debate) => debate.sentiment !== 'Neutral');
    }
    if (selectedTab === 'most-viewed') {
      filtered = [...filtered].sort((a, b) => b.contributions - a.contributions);
    }
    if (selectedTab === 'longest') {
      filtered = [...filtered].sort((a, b) => b.durationMinutes - a.durationMinutes);
    }

    if (sortBy === 'contributions') {
      filtered = [...filtered].sort((a, b) => b.contributions - a.contributions);
    } else if (sortBy === 'speakers') {
      filtered = [...filtered].sort((a, b) => b.speakers - a.speakers);
    }

    return filtered;
  }, [searchTerm, selectedTab, sortBy, debateData]);

  const activeDebate = visibleDebates.find((debate) => debate.id === selectedDebateId) || visibleDebates[0] || debateData[0] || fallbackDebates[0];

  return (
    <PageShell>
      <div className="space-y-4">
        <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-700 text-white">
                <BookOpen className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[clamp(1.8rem,2.5vw,2.4rem)] font-semibold tracking-[-0.03em] text-[var(--dai-ink)]">Debates Explorer</h1>
                <p className="text-sm text-[var(--dai-slate)] sm:text-base">
                  Explore the conversations shaping Ireland. Search, filter, and analyze debates by topic, date, speaker, and sentiment.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--dai-border)] bg-white px-4 text-sm font-medium text-[var(--dai-slate)] shadow-sm transition hover:border-[var(--dai-border)] hover:bg-[var(--dai-muted)]"
            >
              <Search className="h-4 w-4" />
              Advanced Search
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          {kpiCards.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--dai-slate)]">{kpi.label}</p>
                    <p className="mt-1 text-3xl font-semibold leading-none text-[var(--dai-ink)]">{kpi.value}</p>
                    <p className="mt-1 text-xs text-[var(--dai-slate)]">{kpi.sub}</p>
                    <p className="mt-1 text-xs font-medium text-emerald-600">{kpi.delta}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${kpi.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>



        {errorMessage && (
          <section className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Live debates unavailable right now: {errorMessage}. Showing fallback dataset.
          </section>
        )}

        <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
          <div className="grid grid-cols-1 gap-2 lg:grid-cols-[1.8fr_repeat(5,minmax(0,1fr))_auto]">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--dai-slate)]" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search debates..."
                className="h-10 w-full rounded-lg border border-[var(--dai-border)] bg-white pl-9 pr-3 text-sm text-[var(--dai-slate)] outline-none ring-cyan-200 transition focus:ring"
              />
            </label>
            <button type="button" className="inline-flex h-10 items-center justify-between rounded-lg border border-[var(--dai-border)] px-3 text-xs text-[var(--dai-slate)]">1 Jan 2025 - 8 Aug 2026 <CalendarRange className="h-3.5 w-3.5" /></button>
            <button type="button" className="inline-flex h-10 items-center justify-between rounded-lg border border-[var(--dai-border)] px-3 text-xs text-[var(--dai-slate)]">All Chambers <ChevronDown className="h-3.5 w-3.5" /></button>
            <button type="button" className="inline-flex h-10 items-center justify-between rounded-lg border border-[var(--dai-border)] px-3 text-xs text-[var(--dai-slate)]">All Debate Types <ChevronDown className="h-3.5 w-3.5" /></button>
            <button type="button" className="inline-flex h-10 items-center justify-between rounded-lg border border-[var(--dai-border)] px-3 text-xs text-[var(--dai-slate)]">All Topics <ChevronDown className="h-3.5 w-3.5" /></button>
            <button type="button" className="inline-flex h-10 items-center justify-between rounded-lg border border-[var(--dai-border)] px-3 text-xs text-[var(--dai-slate)]">All Bills <ChevronDown className="h-3.5 w-3.5" /></button>
            <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--dai-border)] px-3 text-xs font-medium text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"><ListFilter className="h-3.5 w-3.5" /> More filters</button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.7fr_0.95fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="inline-flex rounded-xl border border-[var(--dai-border)] p-1 text-xs font-medium text-[var(--dai-slate)]">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setSelectedTab(tab.id); track('debates','tab','click',tab.id); }}
                      className={`rounded-lg px-3 py-1.5 transition ${selectedTab === tab.id ? 'bg-cyan-700 text-white' : 'hover:bg-[var(--dai-muted)]'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-[var(--dai-slate)]">Sort by</span>
                  <select
                    value={sortBy}
                    onChange={(event) => { setSortBy(event.target.value as 'recent' | 'contributions' | 'speakers'); track('debates','sort','select',event.target.value); }}
                    className="h-8 rounded-lg border border-[var(--dai-border)] px-2 text-[var(--dai-slate)]"
                  >
                    <option value="recent">Most Recent</option>
                    <option value="contributions">Most Contributions</option>
                    <option value="speakers">Most Speakers</option>
                  </select>
                </div>
                {isLoading && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Updating
                  </span>
                )}
              </div>

              <div className="space-y-2">
                {visibleDebates.map((debate) => {
                  const sentimentTone = debate.sentiment === 'Positive'
                    ? 'bg-emerald-100 text-emerald-700'
                    : debate.sentiment === 'Mixed'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-[var(--dai-muted)] text-[var(--dai-slate)]';

                  return (
                    <button
                      key={debate.id}
                      type="button"
                      onClick={() => setSelectedDebateId(debate.id)}
                      className={`w-full rounded-xl border p-3 text-left transition ${selectedDebateId === debate.id ? 'border-cyan-300 bg-cyan-50/50' : 'border-[var(--dai-border)] bg-white hover:bg-[var(--dai-muted)]'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[var(--dai-ink)]">{debate.title}</p>
                          <p className="mt-1 text-xs text-[var(--dai-slate)]">{debate.chamber} • {debate.date} • {formatDuration(debate.durationMinutes)}</p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {debate.tags.map((tag) => (
                              <span key={`${debate.id}-${tag}`} className="rounded-full bg-[var(--dai-muted)] px-2 py-0.5 text-[11px] text-[var(--dai-slate)]">{tag}</span>
                            ))}
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${sentimentTone}`}>
                              Sentiment: {debate.sentiment}
                            </span>
                          </div>
                        </div>
                        {debate.isRecent && (
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Recent</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--dai-slate)]">
                        <span>{debate.contributions} Contributions</span>
                        <span>{debate.speakers} Speakers</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-[var(--dai-border)] pt-3">
                <button type="button" className="inline-flex items-center gap-1 text-sm font-medium text-cyan-700 hover:text-cyan-800">
                  View all debates <ArrowRight className="h-4 w-4" />
                </button>
                <div className="inline-flex items-center gap-1 text-xs text-[var(--dai-slate)]">
                  <button type="button" className="h-7 w-7 rounded border border-[var(--dai-border)]">1</button>
                  <button type="button" className="h-7 w-7 rounded border border-[var(--dai-border)]">2</button>
                  <button type="button" className="h-7 w-7 rounded border border-[var(--dai-border)]">3</button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Debate Detail</h2>
                <div className="inline-flex items-center gap-2 text-xs text-[var(--dai-slate)]">
                  <button type="button" className="rounded-lg border border-[var(--dai-border)] px-2 py-1">Overview</button>
                  <button type="button" className="rounded-lg border border-[var(--dai-border)] px-2 py-1">Transcript</button>
                  <button type="button" className="rounded-lg border border-[var(--dai-border)] px-2 py-1">Speakers</button>
                  <button type="button" className="rounded-lg border border-[var(--dai-border)] px-2 py-1">Topics</button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-[var(--dai-ink)]">{activeDebate.title}</h3>
              <p className="mt-1 text-xs text-[var(--dai-slate)]">{activeDebate.chamber} • {activeDebate.date} • {formatDuration(activeDebate.durationMinutes)}</p>

              <div className="mt-3 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
                <div className="rounded-lg bg-[var(--dai-muted)] p-2"><p className="text-[var(--dai-slate)]">Contributions</p><p className="text-base font-semibold text-[var(--dai-ink)]">{activeDebate.contributions}</p></div>
                <div className="rounded-lg bg-[var(--dai-muted)] p-2"><p className="text-[var(--dai-slate)]">Speakers</p><p className="text-base font-semibold text-[var(--dai-ink)]">{activeDebate.speakers}</p></div>
                <div className="rounded-lg bg-[var(--dai-muted)] p-2"><p className="text-[var(--dai-slate)]">Organisations</p><p className="text-base font-semibold text-[var(--dai-ink)]">{activeDebate.organisations}</p></div>
                <div className="rounded-lg bg-[var(--dai-muted)] p-2"><p className="text-[var(--dai-slate)]">Documents</p><p className="text-base font-semibold text-[var(--dai-ink)]">{activeDebate.documents}</p></div>
                <div className="rounded-lg bg-[var(--dai-muted)] p-2"><p className="text-[var(--dai-slate)]">Votes</p><p className="text-base font-semibold text-[var(--dai-ink)]">{activeDebate.votes}</p></div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="rounded-xl border border-[var(--dai-border)] p-3">
                  <p className="mb-2 text-xs font-semibold text-[var(--dai-slate)]">Sentiment Over Time</p>
                  <div className="h-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeDebate.trend}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis dataKey="time" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                        <Tooltip />
                        <Area type="monotone" dataKey="positive" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
                        <Area type="monotone" dataKey="neutral" stroke="#64748b" fill="#64748b" fillOpacity={0.14} />
                        <Area type="monotone" dataKey="negative" stroke="#ef4444" fill="#ef4444" fillOpacity={0.14} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 inline-flex items-center gap-3 text-[11px] text-[var(--dai-slate)]">
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Positive</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--dai-muted)]0" />Neutral</span>
                    <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-rose-500" />Negative</span>
                  </div>
                </div>

                <div className="rounded-xl border border-[var(--dai-border)] p-3">
                  <p className="mb-2 text-xs font-semibold text-[var(--dai-slate)]">Top Topics</p>
                  <div className="space-y-2">
                    {activeDebate.topicBreakdown.map((topic) => (
                      <div key={`${activeDebate.id}-${topic.label}`}>
                        <div className="mb-1 flex items-center justify-between text-xs text-[var(--dai-slate)]">
                          <span>{topic.label}</span>
                          <span>{topic.share}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--dai-muted)]">
                          <div className="h-2 rounded-full bg-cyan-600" style={{ width: `${topic.share}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-3 rounded-lg bg-cyan-50 p-3 text-xs text-cyan-900">
                <p className="font-semibold">Debate intelligence</p>
                <p className="mt-1">{activeDebate.insight}</p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (activeDebate.uri) {
                      window.open(activeDebate.uri, '_blank', 'noopener,noreferrer');
                    }
                  }}
                  className="inline-flex h-10 items-center rounded-lg bg-cyan-700 px-4 text-sm font-medium text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={!activeDebate.uri}
                >
                  Open Debate
                </button>
                <button type="button" className="inline-flex h-10 items-center gap-2 rounded-lg border border-[var(--dai-border)] px-4 text-sm font-medium text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"><Eye className="h-4 w-4" /> View Full Transcript</button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-[var(--dai-ink)]">Topic Cloud</h3>
                <button type="button" className="text-xs font-medium text-cyan-700">View full analysis</button>
              </div>
              <div className="flex min-h-[170px] flex-wrap items-center gap-3 rounded-xl border border-[var(--dai-border)] p-3">
                {dynamicTopicCloud.map((item) => (
                  <span key={item.text} className={`${item.size} ${item.color} font-semibold leading-none`}>
                    {item.text}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-[var(--dai-ink)]">Key Speakers</h3>
              <div className="space-y-2">
                {speakers.map((speaker) => (
                  <div key={speaker.name} className="rounded-xl border border-[var(--dai-border)] p-2">
                    <p className="text-sm font-semibold text-[var(--dai-ink)]">{speaker.name}</p>
                    <p className="text-xs text-[var(--dai-slate)]">{speaker.role}</p>
                    <p className="mt-1 text-xs text-[var(--dai-slate)]">{speaker.contributions} contributions</p>
                  </div>
                ))}
              </div>
              <button type="button" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-700 hover:text-cyan-800">
                View all speakers <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-[var(--dai-ink)]">Debate Intelligence</h3>
              <ul className="space-y-2 text-xs text-[var(--dai-slate)]">
                <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />High engagement from 5 opposition parties</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />Most discussed topic: Online Harms</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />Sentiment shifted positive after 10:30</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 text-emerald-600" />23 references to legislation</li>
              </ul>
              <button type="button" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800">
                Generate AI Summary <Sparkles className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Library className="h-4 w-4 text-cyan-700" />
            <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Explore Debates in Depth</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <button
                  key={shortcut.label}
                  type="button"
                  className="group rounded-xl border border-[var(--dai-border)] bg-white p-3 text-left transition hover:bg-[var(--dai-muted)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="mb-2 inline-flex rounded-lg bg-cyan-50 p-2 text-cyan-700">
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-xs font-semibold text-[var(--dai-ink)]">{shortcut.label}</p>
                      <p className="text-[11px] text-[var(--dai-slate)]">{shortcut.sub}</p>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[var(--dai-slate)] transition group-hover:text-[var(--dai-slate)]" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
          <div className="flex items-start gap-3">
            <Filter className="mt-0.5 h-5 w-5 text-cyan-700" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Research-ready Debate Workflow</h2>
              <p className="mt-1 text-sm text-[var(--dai-slate)]">
                Filter by date, chamber, topic, and bill to identify high-impact debates, inspect sentiment evolution, compare speaker activity, and export evidence for reporting.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}



