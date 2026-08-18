import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  FileText,
  Layers,
  MessageSquare,
  Scale,
  ShieldAlert,
  Sparkles,
  Eye,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageShell } from '@/components/patterns';

type DetectionMode = 'debates' | 'legislation';

type Signal = {
  label: string;
  value: number;
  description: string;
  plainLanguage: string;
  whyItMatters: string;
  example: {
    source: string;
    excerpt: string;
    issue: string;
    sourceUrl: string;
  };
};

type EvidenceExample = {
  label: string;
  excerpt: string;
  issue: string;
  reviewerQuestion: string;
  contextBefore: string;
  contextAfter: string;
  comparisonExcerpt: string;
  comparisonWhy: string;
};

type FlaggedItem = {
  title: string;
  source: string;
  score: number;
  reason: string;
  sourceUrl: string;
  sourceSectionRoute: '/debates' | '/voting';
  examples: EvidenceExample[];
};

type ModeDataset = {
  heading: string;
  description: string;
  riskScore: number;
  confidence: number;
  verdict: string;
  signals: Signal[];
  flaggedItems: FlaggedItem[];
};

const datasets: Record<DetectionMode, ModeDataset> = {
  debates: {
    heading: 'Debate Detection',
    description: 'Spot likely AI-assisted speeches, interventions, and prepared remarks in plenary and committee debate.',
    riskScore: 72,
    confidence: 81,
    verdict: 'Medium-to-high authenticity risk',
    signals: [
      {
        label: 'Regularity',
        value: 86,
        description: 'Highly even sentence length and rhythm',
        plainLanguage: 'The speech sounds unusually uniform, with very similar sentence lengths and pacing throughout.',
        whyItMatters: 'Real speech usually has natural variation from interruptions, emphasis, and spontaneous phrasing.',
        example: {
          source: 'Transport Committee transcript, 14:32-14:36',
          excerpt: 'We will improve access. We will improve resilience. We will improve outcomes. We will improve delivery.',
          issue: 'Four near-identical sentence frames in a short span suggest templated generation.',
          sourceUrl: 'https://www.oireachtas.ie/en/debates/',
        },
      },
      {
        label: 'Repetition',
        value: 74,
        description: 'Repeated framing phrases and boilerplate',
        plainLanguage: 'The same opening patterns and stock phrases appear repeatedly in nearby passages.',
        whyItMatters: 'High local repetition can indicate generated or heavily assisted copy rather than live argumentation.',
        example: {
          source: 'Dail Eireann intervention block, 15:08-15:12',
          excerpt: 'Let me be clear that... Let me be clear that... Let me be clear that...',
          issue: 'Repeated rhetorical scaffold with low semantic movement across clauses.',
          sourceUrl: 'https://www.oireachtas.ie/en/debates/',
        },
      },
      {
        label: 'Stylometric drift',
        value: 68,
        description: 'Shift from prior speaker profile',
        plainLanguage: "The writing style differs from this speaker's typical vocabulary and syntax profile.",
        whyItMatters: 'A sudden style shift can indicate ghostwriting or AI assistance, especially within the same sitting.',
        example: {
          source: 'Speaker profile vs current intervention',
          excerpt: 'Current excerpt uses legalistic passive voice and abstract qualifiers uncommon in prior sessions.',
          issue: 'Lexical distribution and syntax depth diverge from baseline samples.',
          sourceUrl: 'https://www.oireachtas.ie/en/debates/',
        },
      },
      {
        label: 'Burstiness gap',
        value: 79,
        description: 'Low variation in token burst patterns',
        plainLanguage: 'Word bursts are too even and predictable across paragraphs.',
        whyItMatters: 'Human drafting usually alternates short and long lexical bursts as ideas are developed unevenly.',
        example: {
          source: 'Committee remarks, paragraphs 9-14',
          excerpt: 'Each paragraph contains similarly distributed policy terms with minimal density change.',
          issue: 'Flat burst profile across contiguous paragraphs.',
          sourceUrl: 'https://www.oireachtas.ie/en/debates/',
        },
      },
      {
        label: 'Citation density',
        value: 31,
        description: 'Sparse evidence references for the length',
        plainLanguage: 'Long arguments are made with very few concrete references, dates, or source anchors.',
        whyItMatters: 'Generated text can sound polished while remaining light on verifiable specifics.',
        example: {
          source: 'Plenary response, 4-minute segment',
          excerpt: 'Multiple policy claims are presented without citing committee reports, dates, or budget lines.',
          issue: 'Low citation-to-claim ratio for a high-information section.',
          sourceUrl: 'https://www.oireachtas.ie/en/debates/',
        },
      },
    ],
    flaggedItems: [
      {
        title: 'Committee speech excerpt',
        source: 'Transport Committee, 14:32',
        score: 84,
        reason: 'Uniform cadence, repeated triads, and unusually polished transitions',
        sourceUrl: 'https://www.oireachtas.ie/en/debates/',
        sourceSectionRoute: '/debates',
        examples: [
          {
            label: 'Cadence pattern',
            excerpt: 'This plan is clear. This plan is practical. This plan is fair. This plan is future-facing.',
            issue: 'Four sentence shells repeat with minimal structural variation.',
            reviewerQuestion: 'Would this speaker normally repeat the same scaffold this tightly in live exchange?',
            contextBefore: 'Chair: We now move to transport delivery performance and capital timelines for regional routes.',
            contextAfter: 'Chair: Thank you. We will now take supplementary questions from committee members.',
            comparisonExcerpt: 'We improved access in Cork, but response times in Mayo worsened; we will adjust route staffing accordingly.',
            comparisonWhy: 'Human baseline includes uneven cadence, specific place references, and a concrete trade-off.',
          },
          {
            label: 'Transition polish',
            excerpt: 'Accordingly, therefore, in this context, and for these reasons, we proceed to implementation readiness.',
            issue: 'Transition stack appears overly optimized and syntactically clean for spoken interruption context.',
            reviewerQuestion: 'Does the transcript show pauses or interruptions that are not reflected in this polished flow?',
            contextBefore: 'Member: Could the Minister clarify whether the procurement phase has completed due diligence checks?',
            contextAfter: 'Member: I appreciate the response, but I still need clarity on the procurement deadline.',
            comparisonExcerpt: 'We are not fully ready yet; procurement checks are still open and we expect completion by late June.',
            comparisonWhy: 'Human baseline is less polished and directly addresses timing uncertainty.',
          },
        ],
      },
      {
        title: 'Intervention response',
        source: 'Dáil Éireann, 15:10',
        score: 67,
        reason: 'Speaker style diverges sharply from prior interventions in the same sitting',
        sourceUrl: 'https://www.oireachtas.ie/en/debates/',
        sourceSectionRoute: '/debates',
        examples: [
          {
            label: 'Style divergence',
            excerpt: 'The operational architecture necessarily prioritises cross-jurisdictional harmonisation in phased increments.',
            issue: "Abstract policy phrasing is atypical relative to speaker's historical plain-language interventions.",
            reviewerQuestion: 'Is there evidence this response was prewritten by an external drafting workflow?',
            contextBefore: 'Deputy: What immediate steps are being taken to reduce waiting times this quarter?',
            contextAfter: 'Deputy: Can you provide a number for patients expected to benefit this month?',
            comparisonExcerpt: 'We are adding two weekend clinics and expect about 450 extra appointments this month.',
            comparisonWhy: 'Human baseline uses direct answer structure and a measurable claim.',
          },
        ],
      },
      {
        title: 'Prepared question follow-up',
        source: 'Written answer session',
        score: 59,
        reason: 'Template-like phrasing with limited personal lexical markers',
        sourceUrl: 'https://www.oireachtas.ie/en/debates/',
        sourceSectionRoute: '/debates',
        examples: [
          {
            label: 'Template phrasing',
            excerpt: 'In line with our continuing commitment, we remain focused on measurable outcomes and transparent delivery pathways.',
            issue: 'Phrase pattern aligns with generic policy template language found in generated samples.',
            reviewerQuestion: 'Can this be tied to a known departmental template rather than AI generation?',
            contextBefore: 'Question: Please list the actions completed since the previous quarterly update.',
            contextAfter: 'Question: Please specify which milestones were delayed and why.',
            comparisonExcerpt: 'Since March we finished the grants portal, delayed audit guidance by two weeks, and issued revised dates on 18 April.',
            comparisonWhy: 'Human baseline includes concrete timeline anchors and explicit status details.',
          },
        ],
      },
    ],
  },
  legislation: {
    heading: 'Legislation Detection',
    description: 'Identify likely AI-assisted drafting in bills, amendments, notes, and explanatory memoranda.',
    riskScore: 63,
    confidence: 77,
    verdict: 'Moderate authenticity risk',
    signals: [
      {
        label: 'Template similarity',
        value: 91,
        description: 'Sections align closely with known drafting templates',
        plainLanguage: 'Large parts of the draft mirror known boilerplate structures and phrasing.',
        whyItMatters: 'High template overlap may be benign but can also hide machine-assisted copy-and-generate workflows.',
        example: {
          source: 'Committee Stage Bill draft, Sections 3-6',
          excerpt: 'Notwithstanding subsection (1)... subject to subsection (2)... for the purposes of this section...',
          issue: 'Clause sequence and connective framing match template signatures at unusually high rates.',
          sourceUrl: 'https://www.oireachtas.ie/en/bills/',
        },
      },
      {
        label: 'Semantic uniformity',
        value: 70,
        description: 'Repeated policy language across sections',
        plainLanguage: 'Different sections use near-identical meaning patterns and phrasing.',
        whyItMatters: 'Over-uniform semantics can indicate generated expansion from a small prompt seed.',
        example: {
          source: 'Explanatory memorandum paragraphs 4, 8, 11',
          excerpt: 'Ensuring consistency, ensuring clarity, ensuring coherence appears in each section summary.',
          issue: 'High embedding similarity among sections expected to vary by topic.',
          sourceUrl: 'https://www.oireachtas.ie/en/bills/',
        },
      },
      {
        label: 'Cross-document drift',
        value: 58,
        description: 'Different tone from sponsor or department history',
        plainLanguage: 'The draft tone differs from prior legislation by the same sponsor or department.',
        whyItMatters: 'Tone drift can indicate outsourced or tool-generated drafting injected into a familiar process.',
        example: {
          source: 'Sponsor history comparison (last 5 bills)',
          excerpt: 'Current draft uses dense neutral abstractions where prior bills used direct obligations and actor language.',
          issue: 'Style drift exceeds normal variance in historical corpus.',
          sourceUrl: 'https://www.oireachtas.ie/en/bills/',
        },
      },
      {
        label: 'Structural consistency',
        value: 88,
        description: 'Clause layout is highly regular',
        plainLanguage: 'Sections follow very similar internal structure and sequencing.',
        whyItMatters: 'Machine-generated drafts often preserve strict scaffolding across clauses.',
        example: {
          source: 'Amendment bundle clauses 1-12',
          excerpt: 'Each clause follows the same five-part structure with minimal deviation.',
          issue: 'Layout entropy is materially lower than peer legislative drafts.',
          sourceUrl: 'https://www.oireachtas.ie/en/bills/',
        },
      },
      {
        label: 'Human revision marks',
        value: 24,
        description: 'Few visible edits or annotated interventions',
        plainLanguage: 'There are very few signs of iterative human editing across the document.',
        whyItMatters: 'Absence of revision fingerprints can indicate fully generated or lightly post-edited text.',
        example: {
          source: 'Tracked revisions snapshot',
          excerpt: 'Large blocks appear inserted in single edits with minimal inline correction activity.',
          issue: 'Revision trace is sparse relative to document complexity.',
          sourceUrl: 'https://www.oireachtas.ie/en/bills/',
        },
      },
    ],
    flaggedItems: [
      {
        title: 'Bill section draft',
        source: 'Committee Stage version',
        score: 89,
        reason: 'Clause language closely matches model-generated policy prose',
        sourceUrl: 'https://www.oireachtas.ie/en/bills/',
        sourceSectionRoute: '/voting',
        examples: [
          {
            label: 'Clause mirroring',
            excerpt: 'For the avoidance of doubt, the competent authority may, where appropriate, implement proportionate measures...',
            issue: 'Sentence shape and qualifier stack match known model-generated legislative prose patterns.',
            reviewerQuestion: 'Is this language traceable to a prior domestic template or newly generated content?',
            contextBefore: 'Section 5 introduces oversight powers for notices and compliance instructions.',
            contextAfter: 'Section 6 sets out appeals timelines and admissibility constraints for submissions.',
            comparisonExcerpt: 'The authority may issue notices when required, and each notice must state the legal basis and deadline.',
            comparisonWhy: 'Human baseline uses concise operative language and explicit legal anchors.',
          },
        ],
      },
      {
        title: 'Explanatory memorandum',
        source: 'Legislative note',
        score: 71,
        reason: 'Overly balanced tone and repeated summarisation patterns',
        sourceUrl: 'https://www.oireachtas.ie/en/bills/',
        sourceSectionRoute: '/voting',
        examples: [
          {
            label: 'Summary repetition',
            excerpt: 'This measure supports fairness, supports transparency, and supports long-term system resilience.',
            issue: 'Repeated triadic summary style across distinct policy topics.',
            reviewerQuestion: 'Would manual drafting normally vary rhetorical structure more between sections?',
            contextBefore: 'Overview paragraph introduces policy objective and implementation timetable.',
            contextAfter: 'Final paragraph references expected administrative impacts on local authorities.',
            comparisonExcerpt: 'The measure clarifies audit duties and funding controls, with implementation guidance issued in Q4.',
            comparisonWhy: 'Human baseline is more topic-specific and less rhetorically uniform.',
          },
        ],
      },
      {
        title: 'Amendment bundle',
        source: 'Deputy submission',
        score: 52,
        reason: 'Some sections match historical drafting style, others do not',
        sourceUrl: 'https://www.oireachtas.ie/en/bills/',
        sourceSectionRoute: '/voting',
        examples: [
          {
            label: 'Mixed authorship signal',
            excerpt: 'Section 2 uses concise actor-specific obligations; Section 3 shifts to broad abstract compliance language.',
            issue: 'Alternating style may indicate mixed human and AI-assisted drafting segments.',
            reviewerQuestion: 'Can individual sections be attributed to different drafting workflows?',
            contextBefore: 'Section 2: The Minister shall publish monthly compliance notices to each authority.',
            contextAfter: 'Section 4: Authorities must file annual performance statements and correction logs.',
            comparisonExcerpt: 'Section 3: Each authority must submit an implementation report within 30 days of notice receipt.',
            comparisonWhy: 'Human baseline preserves the actor-action-deadline pattern used in neighboring sections.',
          },
        ],
      },
    ],
  },
};

const methodologySteps = [
  {
    title: 'Normalize text',
    description: 'Segment speeches and legislative clauses, then clean references, citations, and metadata.',
    icon: FileText,
  },
  {
    title: 'Score signals',
    description: 'Combine stylometric heuristics, embedding similarity, and repetition metrics.',
    icon: BarChart3,
  },
  {
    title: 'Explain evidence',
    description: 'Show why a passage is flagged so reviewers can challenge or confirm the result.',
    icon: Eye,
  },
  {
    title: 'Human review',
    description: 'Treat the model output as a triage layer, not as a definitive judgment.',
    icon: CheckCircle2,
  },
];

const recommendedStack = [
  'spaCy for segmentation, tokenization, and linguistic features',
  'sentence-transformers for embeddings and similarity checks',
  'scikit-learn or XGBoost for lightweight classification',
  'Ollama for local explanation or reviewer summaries when needed',
];

const COLORS = ['#0f766e', '#2563eb', '#7c3aed', '#ea580c', '#dc2626'];

export default function AIIntegrity() {
  const [mode, setMode] = useState<DetectionMode>('debates');
  const [expandedSignal, setExpandedSignal] = useState<string | null>(null);
  const [expandedFlaggedItem, setExpandedFlaggedItem] = useState<string | null>(null);
  const [selectedInspection, setSelectedInspection] = useState<{ item: FlaggedItem; example: EvidenceExample } | null>(null);

  const dataset = datasets[mode];

  useEffect(() => {
    setExpandedSignal(dataset.signals[0]?.label ?? null);
    setExpandedFlaggedItem(dataset.flaggedItems[0]?.title ?? null);
    const firstItem = dataset.flaggedItems[0];
    const firstExample = firstItem?.examples[0];
    setSelectedInspection(firstItem && firstExample ? { item: firstItem, example: firstExample } : null);
  }, [dataset]);

  const chartData = useMemo(
    () =>
      dataset.signals.map((signal) => ({
        name: signal.label,
        value: signal.value,
      })),
    [dataset.signals],
  );

  return (
    <PageShell>
      <div className="space-y-8">
        <div className="relative overflow-hidden rounded-3xl border border-[var(--dai-border)] bg-gradient-to-br from-slate-950 via-slate-900 to-teal-900 text-white shadow-2xl">
          <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at top right, rgba(45, 212, 191, 0.5), transparent 30%), radial-gradient(circle at bottom left, rgba(59, 130, 246, 0.35), transparent 35%)' }} />
          <div className="relative p-8 md:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
                  <ShieldAlert className="h-4 w-4" />
                  AI Integrity
                </div>
                <div>
                  <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Detect likely AI-assisted drafting in debates and legislation</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-white/80 md:text-base">
                    This tab is a triage layer for authenticity risk, not a final verdict. It combines stylometric heuristics, embedding-based similarity, and review evidence so parliamentary staff can inspect what looks synthetic, templated, or unusually machine-like.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:w-[360px] lg:grid-cols-1">
                <button
                  type="button"
                  onClick={() => setMode('debates')}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${mode === 'debates' ? 'border-cyan-300 bg-cyan-400/15 text-white shadow-lg' : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'}`}
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-cyan-200/80">Mode</div>
                  <div className="mt-1 text-lg font-semibold">Debates</div>
                  <div className="mt-1 text-xs text-white/70">Speech, interventions, committee remarks</div>
                </button>
                <button
                  type="button"
                  onClick={() => setMode('legislation')}
                  className={`rounded-2xl border px-4 py-3 text-left transition ${mode === 'legislation' ? 'border-amber-300 bg-amber-400/15 text-white shadow-lg' : 'border-white/15 bg-white/5 text-white/80 hover:bg-white/10'}`}
                >
                  <div className="text-xs uppercase tracking-[0.2em] text-amber-200/80">Mode</div>
                  <div className="mt-1 text-lg font-semibold">Legislation</div>
                  <div className="mt-1 text-xs text-white/70">Bills, amendments, memoranda</div>
                </button>
                <div className="rounded-2xl border border-emerald-300/25 bg-emerald-400/10 px-4 py-3 text-left">
                  <div className="text-xs uppercase tracking-[0.2em] text-emerald-200/80">Status</div>
                  <div className="mt-1 text-lg font-semibold">{dataset.verdict}</div>
                  <div className="mt-1 text-xs text-white/70">Confidence {dataset.confidence}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-6 shadow-sm xl:col-span-1">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-[var(--dai-navy)] p-3 text-white">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-[var(--dai-slate)]">Authenticity risk</p>
                <h3 className="text-2xl font-bold text-[var(--dai-ink)]">{dataset.riskScore}%</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-[var(--dai-slate)]">
              The score is a blended estimate from structure, repetition, and style deviation. It should be used to prioritise review, not to accuse a speaker or drafter.
            </p>
            <div className="mt-6 rounded-2xl bg-[var(--dai-muted)] p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-[var(--dai-ink)]">
                <Sparkles className="h-4 w-4 text-cyan-600" />
                Why this matters
              </div>
              <p className="mt-2 text-sm leading-6 text-[var(--dai-slate)]">
                Legislatures need a defensible way to spot machine-generated or machine-assisted text while preserving human authorship, accountability, and due process.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-6 shadow-sm xl:col-span-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[var(--dai-slate)]">Current view</p>
                <h3 className="text-2xl font-bold text-[var(--dai-ink)]">{dataset.heading}</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--dai-slate)]">{dataset.description}</p>
              </div>
              <div className="rounded-2xl bg-[var(--dai-navy)] px-4 py-3 text-right text-white">
                <div className="text-xs uppercase tracking-[0.2em] text-[var(--dai-slate)]">Confidence</div>
                <div className="text-3xl font-bold">{dataset.confidence}%</div>
              </div>
            </div>

            <div className="mt-6 h-80 rounded-2xl bg-[var(--dai-muted)] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 16, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{ fill: '#475569', fontSize: 12 }} interval={0} />
                  <YAxis tick={{ fill: '#475569', fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(15, 23, 42, 0.96)',
                      border: 'none',
                      borderRadius: '12px',
                      color: 'white',
                    }}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Scale className="h-5 w-5 text-[var(--dai-slate)]" />
              <h3 className="text-xl font-bold text-[var(--dai-ink)]">Evidence signals</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--dai-slate)]">
              Open a signal to see plain-language interpretation, why it matters, and a concrete source excerpt that triggered attention.
            </p>
            <div className="mt-5 space-y-4">
              {dataset.signals.map((signal) => (
                <div key={signal.label} className="space-y-2 rounded-2xl bg-[var(--dai-muted)] p-4">
                  <button
                    type="button"
                    onClick={() => setExpandedSignal((current) => (current === signal.label ? null : signal.label))}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <div className="font-semibold text-[var(--dai-ink)]">{signal.label}</div>
                      <div className="text-sm text-[var(--dai-slate)]">{signal.description}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-lg font-bold text-[var(--dai-ink)]">{signal.value}%</div>
                      <ChevronDown className={`h-4 w-4 text-[var(--dai-slate)] transition-transform ${expandedSignal === signal.label ? 'rotate-180' : ''}`} />
                    </div>
                  </button>
                  <div className="h-2 rounded-full bg-[var(--dai-muted)]">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600"
                      style={{ width: `${signal.value}%` }}
                    />
                  </div>

                  {expandedSignal === signal.label && (
                    <div className="mt-3 rounded-xl border border-[var(--dai-border)] bg-white p-4 text-sm leading-6 text-[var(--dai-slate)]">
                      <p>
                        <span className="font-semibold text-[var(--dai-ink)]">What this means: </span>
                        {signal.plainLanguage}
                      </p>
                      <p className="mt-2">
                        <span className="font-semibold text-[var(--dai-ink)]">Why it matters: </span>
                        {signal.whyItMatters}
                      </p>
                      <div className="mt-3 rounded-lg bg-[var(--dai-muted)] p-3">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--dai-slate)]">Source example</p>
                        <p className="mt-1 text-sm font-medium text-[var(--dai-ink)]">{signal.example.source}</p>
                        <p className="mt-2 italic text-[var(--dai-slate)]">"{signal.example.excerpt}"</p>
                        <p className="mt-2 text-sm text-[var(--dai-slate)]">
                          <span className="font-semibold text-[var(--dai-ink)]">Observed issue: </span>
                          {signal.example.issue}
                        </p>
                        <a
                          href={signal.example.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-3 py-1.5 text-xs font-semibold text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"
                        >
                          Open source record
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <MessageSquare className="h-5 w-5 text-[var(--dai-slate)]" />
              <h3 className="text-xl font-bold text-[var(--dai-ink)]">Flagged items</h3>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--dai-slate)]">
              Expand an item to inspect excerpt-level evidence, what triggered the flag, and a reviewer question for manual verification.
            </p>
            <div className="mt-5 space-y-4">
              {dataset.flaggedItems.map((item) => (
                <div key={item.title} className="rounded-2xl border border-[var(--dai-border)] bg-[var(--dai-muted)] p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-[var(--dai-ink)]">{item.title}</div>
                      <div className="text-sm text-[var(--dai-slate)]">{item.source}</div>
                    </div>
                    <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[var(--dai-ink)] shadow-sm">
                      {item.score}%
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--dai-slate)]">{item.reason}</p>

                  <button
                    type="button"
                    onClick={() => setExpandedFlaggedItem((current) => (current === item.title ? null : item.title))}
                    className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"
                  >
                    {expandedFlaggedItem === item.title ? 'Hide examples' : 'Show examples'}
                    <ChevronDown className={`h-4 w-4 transition-transform ${expandedFlaggedItem === item.title ? 'rotate-180' : ''}`} />
                  </button>

                  {expandedFlaggedItem === item.title && (
                    <div className="mt-4 space-y-3">
                      {item.examples.map((example) => (
                        <div key={`${item.title}-${example.label}`} className="rounded-xl border border-[var(--dai-border)] bg-white p-4">
                          <p className="text-sm font-semibold text-[var(--dai-ink)]">{example.label}</p>
                          <p className="mt-2 italic text-[var(--dai-slate)]">"{example.excerpt}"</p>
                          <p className="mt-2 text-sm text-[var(--dai-slate)]">
                            <span className="font-semibold text-[var(--dai-ink)]">Detected issue: </span>
                            {example.issue}
                          </p>
                          <p className="mt-2 text-sm text-[var(--dai-slate)]">
                            <span className="font-semibold text-[var(--dai-ink)]">Reviewer prompt: </span>
                            {example.reviewerQuestion}
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedInspection({ item, example })}
                            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                          >
                            Inspect in source viewer
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedInspection && (
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--dai-slate)]">Source inspector</p>
                <h3 className="mt-1 text-xl font-bold text-[var(--dai-ink)]">{selectedInspection.item.title}</h3>
                <p className="mt-1 text-sm text-[var(--dai-slate)]">{selectedInspection.item.source}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={selectedInspection.item.sourceSectionRoute}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"
                >
                  Open internal context
                </a>
                <a
                  href={selectedInspection.item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-3 py-2 text-sm font-medium text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"
                >
                  Open official source
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-[var(--dai-border)] bg-[var(--dai-muted)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--dai-slate)]">Context window</p>
              <p className="mt-2 text-sm text-[var(--dai-slate)]">{selectedInspection.example.contextBefore}</p>
              <p className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm italic text-red-900">"{selectedInspection.example.excerpt}"</p>
              <p className="mt-2 text-sm text-[var(--dai-slate)]">{selectedInspection.example.contextAfter}</p>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-red-700">Flagged passage</p>
                <p className="mt-2 text-sm italic text-red-900">"{selectedInspection.example.excerpt}"</p>
                <p className="mt-3 text-sm text-red-800">
                  <span className="font-semibold">Detected issue: </span>
                  {selectedInspection.example.issue}
                </p>
              </div>

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Human baseline comparison</p>
                <p className="mt-2 text-sm italic text-emerald-900">"{selectedInspection.example.comparisonExcerpt}"</p>
                <p className="mt-3 text-sm text-emerald-800">
                  <span className="font-semibold">Why this baseline helps: </span>
                  {selectedInspection.example.comparisonWhy}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <span className="font-semibold">Reviewer question: </span>
              {selectedInspection.example.reviewerQuestion}
            </div>
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <Layers className="h-5 w-5 text-[var(--dai-slate)]" />
              <h3 className="text-xl font-bold text-[var(--dai-ink)]">Methodology</h3>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {methodologySteps.map((step) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-2xl bg-[var(--dai-muted)] p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-[var(--dai-navy)] p-2 text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="font-semibold text-[var(--dai-ink)]">{step.title}</div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[var(--dai-slate)]">{step.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <BarChart3 className="h-5 w-5 text-[var(--dai-slate)]" />
              <h3 className="text-xl font-bold text-[var(--dai-ink)]">Recommended stack</h3>
            </div>
            <div className="mt-5 space-y-3">
              {recommendedStack.map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl bg-[var(--dai-muted)] p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                  <div className="text-sm leading-6 text-[var(--dai-slate)]">{item}</div>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              Keep the model local where possible. For sensitive parliamentary material, a local-first stack with Ollama or on-prem inference is a better trust boundary than a cloud-only detector.
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}




