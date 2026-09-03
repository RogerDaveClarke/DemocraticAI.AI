import {
  ArrowRight,
  Brain,
  Building2,
  CheckCircle2,
  Cloud,
  Database,
  Info,
  MessageSquare,
  Search,
  Shield,
  ShieldCheck,
  Star,
  Workflow,
} from 'lucide-react';

import { PageShell } from '@/components/patterns/PageShell';

type ArchitectureStage = {
  step: string;
  title: string;
  points: string[];
  pill: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTint: string;
  pillTint: string;
};

const stages: ArchitectureStage[] = [
  {
    step: '1',
    title: 'Official Parliamentary Records',
    points: ['Debates', 'Votes', 'Bills', 'Committee Reports', 'Questions', 'Members Data'],
    pill: 'Source: Oireachtas Open Data API (PSI)',
    icon: Building2,
    iconTint: 'text-emerald-600 bg-emerald-50',
    pillTint: 'bg-emerald-50 text-emerald-700',
  },
  {
    step: '2',
    title: 'Data Ingestion & Processing',
    points: ['Data collection', 'Cleaning & normalization', 'De-duplication', 'Structure extraction', 'Metadata enrichment'],
    pill: 'Secure ETL Pipelines',
    icon: Database,
    iconTint: 'text-teal-600 bg-teal-50',
    pillTint: 'bg-teal-50 text-teal-700',
  },
  {
    step: '3',
    title: 'Knowledge Pipeline',
    points: ['Document chunking', 'Embeddings creation', 'Semantic indexing', 'Knowledge graph', 'Vector store'],
    pill: 'Vertex AI Embeddings & Vector Search',
    icon: Workflow,
    iconTint: 'text-violet-600 bg-violet-50',
    pillTint: 'bg-violet-50 text-violet-700',
  },
  {
    step: '4',
    title: 'RAG Retrieval Layer',
    points: ['Query understanding', 'Hybrid search', 'Re-ranking', 'Context assembly', 'Source selection'],
    pill: 'Vertex AI Search & Ranking',
    icon: Search,
    iconTint: 'text-blue-600 bg-blue-50',
    pillTint: 'bg-blue-50 text-blue-700',
  },
  {
    step: '5',
    title: 'Responsible AI Layer',
    points: ['Answer generation', 'Grounded validation', 'Hallucination checks', 'Bias & fairness checks', 'Confidence scoring'],
    pill: 'Vertex AI (LLM) Guardrails',
    icon: ShieldCheck,
    iconTint: 'text-orange-600 bg-orange-50',
    pillTint: 'bg-orange-50 text-orange-700',
  },
  {
    step: '6',
    title: 'Transparent Response',
    points: ['Clear answer', 'Citations', 'Evidence links', 'Related records', 'Confidence score'],
    pill: 'User Interface & Experience',
    icon: MessageSquare,
    iconTint: 'text-emerald-600 bg-emerald-50',
    pillTint: 'bg-emerald-50 text-emerald-700',
  },
];

const technologyItems = [
  {
    title: 'Google Cloud Platform',
    detail: 'Cloud Run, Vertex AI, Cloud Storage, BigQuery, Secret Manager',
    icon: Cloud,
  },
  {
    title: 'Retrieval-Augmented Generation',
    detail: 'RAG with hybrid search and re-ranking for accuracy',
    icon: Search,
  },
  {
    title: 'Large Language Models',
    detail: 'Vertex AI (Gemini) with safety filters and guardrails',
    icon: Brain,
  },
  {
    title: 'Vector Search',
    detail: 'Semantic search using embeddings and metadata',
    icon: Database,
  },
  {
    title: 'Bias & AI Integrity',
    detail: 'AI-assisted text detection, bias analysis, and fairness checks',
    icon: Shield,
  },
  {
    title: 'Security & Privacy',
    detail: 'Encryption in transit and at rest, role-based access control',
    icon: ShieldCheck,
  },
];

const metrics = [
  { label: 'Records Processed', value: '1M+' },
  { label: 'Data Sources', value: '15+' },
  { label: 'System Uptime', value: '99.9%' },
  { label: 'Average Response Time', value: '< 2s' },
];

const highlights = [
  {
    title: 'Grounded in Official Records',
    detail: 'All answers are grounded in official parliamentary data with verifiable citations and direct links.',
    icon: CheckCircle2,
  },
  {
    title: 'Explainable by Design',
    detail: 'We provide clear reasoning, context, and sources so you understand how every answer is derived.',
    icon: Info,
  },
  {
    title: 'Monitored for Integrity',
    detail: 'Continuous evaluation for accuracy, bias, and hallucinations ensures reliable and fair responses.',
    icon: Shield,
  },
  {
    title: 'Built for Citizens',
    detail: 'A user-first experience that makes complex parliamentary data easy to explore and understand.',
    icon: Star,
  },
];

const flow = ['Official Data', 'Processed Data', 'Indexed Knowledge', 'Relevant Context', 'Verified Answer', 'Informed Citizen'];

export default function Architecture() {
  return (
    <PageShell contentClassName="max-w-none">
      <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:px-6 sm:py-6 xl:grid-cols-[minmax(0,1fr)_minmax(15rem,22rem)] xl:gap-6">
          <main className="min-w-0 space-y-6">
            <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-6 shadow-sm">
              <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
                <div>
                  <h1 className="text-3xl font-bold text-[var(--dai-ink)] sm:text-4xl">System Architecture</h1>
                  <p className="mt-2 text-xl font-semibold text-[var(--color-teal-600)] sm:text-2xl">
                    Built for transparency, accuracy, and democratic accountability
                  </p>
                  <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--dai-slate)]">
                    Democratic AI uses a Retrieval-Augmented Generation (RAG) architecture combined with
                    responsible AI practices to deliver trustworthy, explainable answers grounded in official
                    parliamentary records.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <article className="rounded-xl border border-[var(--dai-border)] bg-[#f7fcff] p-4">
                    <div className="inline-flex rounded-lg bg-emerald-50 p-2 text-emerald-600">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-lg font-semibold text-[var(--dai-ink)]">Trust by Design</p>
                    <p className="mt-1 text-sm text-[var(--dai-slate)]">Every layer is built with responsible AI principles and human oversight.</p>
                  </article>
                  <article className="rounded-xl border border-[var(--dai-border)] bg-[#f7fcff] p-4">
                    <div className="inline-flex rounded-lg bg-cyan-50 p-2 text-cyan-600">
                      <Shield className="h-5 w-5" />
                    </div>
                    <p className="mt-2 text-lg font-semibold text-[var(--dai-ink)]">Privacy First</p>
                    <p className="mt-1 text-sm text-[var(--dai-slate)]">We protect your data and do not use personal data to train our models.</p>
                  </article>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <div>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)_auto_minmax(0,1fr)]">
                {stages.map((stage, index) => {
                  const Icon = stage.icon;
                  return (
                    <div key={stage.title} className="contents">
                      <article className="min-w-0 rounded-xl border border-[var(--dai-border)] bg-gradient-to-b from-white to-slate-50 p-3 xl:min-h-[325px]">
                        <div className="inline-flex items-center gap-2">
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--dai-muted)] text-xs font-bold text-[var(--dai-slate)]">
                            {stage.step}
                          </span>
                          <h3 className="break-words text-sm font-semibold leading-5 text-[var(--dai-ink)]">{stage.title}</h3>
                        </div>
                        <div className={`mt-3 inline-flex rounded-xl p-2 ${stage.iconTint}`}>
                          <Icon className="h-7 w-7" />
                        </div>
                        <ul className="mt-3 space-y-1 text-xs text-[var(--dai-slate)]">
                          {stage.points.map((point) => (
                            <li key={point} className="flex gap-2"><span>•</span><span>{point}</span></li>
                          ))}
                        </ul>
                        <div className={`mt-4 break-words rounded-lg px-2 py-2 text-xs font-semibold ${stage.pillTint}`}>{stage.pill}</div>
                      </article>
                      {index < stages.length - 1 && (
                        <div className="hidden items-center justify-center xl:flex">
                          <ArrowRight className="h-5 w-5 text-[var(--dai-slate)]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--dai-border)] bg-[#f8fbff] px-4 py-3">
                <p className="text-sm font-semibold text-[var(--dai-ink)]">End-to-End Flow</p>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--dai-slate)]">
                  {flow.map((node, index) => (
                    <div key={node} className="inline-flex items-center gap-2">
                      <span>{node}</span>
                      {index < flow.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-[var(--dai-slate)]" />}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-2xl font-semibold text-[var(--dai-ink)]">Architecture Highlights</h2>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {highlights.map((item) => {
                  const Icon = item.icon;
                  return (
                    <article key={item.title} className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm min-h-[188px]">
                      <div className="inline-flex rounded-lg bg-[var(--dai-muted)] p-2 text-[var(--color-teal-600)]">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[var(--dai-ink)]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--dai-slate)]">{item.detail}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-xl border border-[var(--dai-border)] bg-white px-4 py-3 text-sm text-[var(--dai-slate)]">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="inline-flex items-center gap-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  Democratic AI is politically neutral and non-partisan. Our mission is to promote transparency, accountability, and informed civic engagement through trustworthy AI.
                </p>
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-[var(--color-teal-600)] hover:text-[var(--color-teal-500)]">
                  Learn more about our mission and methodology
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>

            <section className="flex flex-col gap-2 border-t border-[var(--dai-border)] pt-3 text-sm text-[var(--dai-slate)] md:flex-row md:items-center md:justify-between">
              <p>
                Data sourced from <a href="https://www.oireachtas.ie/en/copyright-and-reuse/" className="text-[var(--color-teal-600)] hover:underline" target="_blank" rel="noreferrer">official parliamentary records</a> under the <a href="https://data.oireachtas.ie/ie/oireachtas/corporate/governanceAndReform/2016/2016-03-27_oireachtas-psi-licence-open-data_en.pdf" className="text-[var(--color-teal-600)] hover:underline" target="_blank" rel="noreferrer">Oireachtas Open Data PSI Licence</a>.
              </p>
              <p>Last updated: May 27, 2025</p>
            </section>
          </main>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h3 className="text-xl font-semibold text-[var(--dai-ink)]">Key Technologies</h3>
              <ul className="mt-3 space-y-3">
                {technologyItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.title} className="flex gap-2">
                      <div className="mt-0.5 rounded-md bg-[var(--dai-muted)] p-1.5 text-[var(--color-teal-600)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[var(--dai-ink)]">{item.title}</p>
                        <p className="text-xs text-[var(--dai-slate)] leading-5">{item.detail}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h3 className="text-xl font-semibold text-[var(--dai-ink)]">Platform Metrics</h3>
              <ul className="mt-3 space-y-3">
                {metrics.map((item) => (
                  <li key={item.label} className="flex items-center justify-between rounded-lg bg-[var(--dai-muted)] px-3 py-2">
                    <span className="text-xs text-[var(--dai-slate)]">{item.label}</span>
                    <span className="font-semibold text-[var(--color-teal-600)]">{item.value}</span>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
      </div>
    </PageShell>
  );
}

