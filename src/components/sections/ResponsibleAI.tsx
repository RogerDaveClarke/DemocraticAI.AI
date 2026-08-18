import {
  ArrowRight,
  BookOpen,
  Brain,
  Building2,
  CheckCircle2,
  Eye,
  Globe,
  HelpCircle,
  Info,
  Link,
  Lock,
  Mail,
  NotebookText,
  Search,
  Shield,
  ShieldCheck,
  FileCheck2,
  Scale,
  UserRoundCheck,
} from 'lucide-react';

import { PageShell } from '@/components/patterns/PageShell';

const principles = [
  {
    title: 'Source Grounded',
    detail:
      'Every response is grounded in official parliamentary records and accompanied by citations.',
    icon: FileCheck2,
    iconBg: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Explainable',
    detail:
      'We provide clear reasoning, evidence, and context so you understand how answers are derived.',
    icon: Eye,
    iconBg: 'bg-sky-50 text-sky-600',
  },
  {
    title: 'Verifiable',
    detail:
      'All information can be verified through source links to original parliamentary records.',
    icon: Link,
    iconBg: 'bg-teal-50 text-teal-600',
  },
  {
    title: 'Fair & Unbiased',
    detail:
      'We strive to minimize bias in data, models, and outputs. We surface multiple perspectives.',
    icon: Scale,
    iconBg: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Privacy & Security',
    detail:
      'We protect your data and privacy. No personal data is used to train our AI models.',
    icon: Lock,
    iconBg: 'bg-orange-50 text-orange-600',
  },
];

const workflowSteps = [
  {
    title: '1. Official Records',
    text: 'We collect data from the Oireachtas Open Data API under the PSI Licence.',
    icon: Building2,
    card: 'from-sky-50 to-blue-50 border-sky-100',
  },
  {
    title: '2. Knowledge Pipeline',
    text: 'Records are cleaned, structured, and embedded for semantic search.',
    icon: NotebookText,
    card: 'from-teal-50 to-emerald-50 border-teal-100',
  },
  {
    title: '3. RAG Retrieval',
    text: 'Relevant information is retrieved from official records to provide context.',
    icon: Search,
    card: 'from-cyan-50 to-sky-50 border-cyan-100',
  },
  {
    title: '4. Responsible AI Layer',
    text: 'AI generates responses with validation, bias checks, and hallucination detection.',
    icon: Brain,
    card: 'from-violet-50 to-fuchsia-50 border-violet-100',
  },
  {
    title: '5. Transparent Response',
    text: 'You receive clear answers with citations, evidence, and related sources.',
    icon: Mail,
    card: 'from-blue-50 to-indigo-50 border-blue-100',
  },
];

const transparencyItems = [
  'Citations with every response',
  'Links to original records',
  'Clear reasoning and sources',
  'Open about limitations',
];

const assuranceItems = [
  'Data sourced from official parliamentary records',
  'No training on user data',
  'Regular evaluation for accuracy and bias',
  'Continuously improving through feedback and audits',
];

const learnMoreLinks = [
  'How it works',
  'Data sources',
  'Methodology',
  'Privacy policy',
];

export default function ResponsibleAI() {
  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[1fr_280px]">
          <main className="min-w-0 space-y-8">
            <section className="relative overflow-hidden rounded-2xl border border-[var(--dai-border)] bg-gradient-to-r from-white via-white to-[#f4f9ff] p-8 shadow-sm">
              <div className="pointer-events-none absolute -right-10 -top-4 hidden h-64 w-80 items-center justify-center xl:flex">
                <div className="absolute inset-0 rounded-full bg-cyan-100/40 blur-2xl" />
                <div className="absolute -right-4 bottom-2 text-[var(--dai-slate)]/40">
                  <Building2 className="h-28 w-28" />
                </div>
                <div className="relative z-10 flex items-center gap-3 text-[var(--color-teal-600)]">
                  <Scale className="h-20 w-20" />
                  <ShieldCheck className="h-14 w-14 text-sky-700" />
                </div>
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-[var(--dai-ink)] md:text-6xl">Responsible AI</h1>
              <p className="mt-2 text-2xl font-semibold text-[var(--color-teal-600)] md:text-3xl">
                Building trustworthy AI for democratic transparency
              </p>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--dai-slate)]">
                Parliament AI is built on a foundation of trust, transparency, and accountability.
                We use Retrieval-Augmented Generation (RAG) and responsible AI practices to ensure
                our responses are accurate, explainable, and verifiable so you can make informed civic decisions.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-semibold text-[var(--dai-ink)]">Our Responsible AI Principles</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                {principles.map((principle) => {
                  const Icon = principle.icon;
                  return (
                    <article key={principle.title} className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm min-h-[220px]">
                      <div className={`inline-flex rounded-xl p-3 ${principle.iconBg}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <h3 className="mt-4 text-xl font-semibold text-[var(--dai-ink)]">{principle.title}</h3>
                      <p className="mt-2 text-[15px] leading-6 text-[var(--dai-slate)]">{principle.detail}</p>
                    </article>
                  );
                })}
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-semibold text-[var(--dai-ink)]">How Parliament AI Works</h2>
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr_auto_1fr]">
                {workflowSteps.map((step, index) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.title} className="contents">
                      <article
                        className={`rounded-2xl border bg-gradient-to-b ${step.card} p-4 shadow-sm min-h-[168px]`}
                      >
                        <div className="inline-flex rounded-lg bg-white p-2 text-[var(--color-teal-600)] shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-[var(--dai-ink)]">{step.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-[var(--dai-slate)]">{step.text}</p>
                      </article>
                      {index < workflowSteps.length - 1 && (
                        <div className="hidden items-center justify-center xl:flex">
                          <ArrowRight className="h-5 w-5 text-[var(--dai-slate)]" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-[var(--dai-ink)]">
                    Every step is designed to ensure accuracy, accountability, and public trust.
                  </p>
                  <p className="mt-1 text-[var(--dai-slate)]">
                    Parliament AI does not generate opinions, only evidence-based insights.
                  </p>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-2 border-t border-[var(--dai-border)] pt-4 text-sm text-[var(--dai-slate)] xl:flex-row xl:items-center xl:justify-between">
              <p className="inline-flex items-center gap-2">
                <Info className="h-4 w-4 text-sky-600" />
                Parliament AI is politically neutral and non-partisan. Our mission is to promote transparency, accountability, and informed civic engagement.
              </p>
              <p>Last updated: May 27, 2025</p>
            </section>
          </main>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-[var(--dai-ink)]">Transparency in Action</h3>
              <ul className="space-y-2 text-sm text-[var(--dai-slate)]">
                {transparencyItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--color-teal-600)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-[var(--dai-ink)]">Data & Model Assurance</h3>
              <ul className="space-y-2 text-sm text-[var(--dai-slate)]">
                {assuranceItems.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-[var(--color-teal-600)]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-[var(--dai-ink)]">Learn More</h3>
              <ul className="space-y-2">
                {learnMoreLinks.map((item) => (
                  <li key={item}>
                    <button type="button" className="flex w-full items-center justify-between text-left text-sm text-[var(--color-teal-600)] hover:text-[var(--color-teal-500)]">
                      <span>{item}</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
      </div>
    </PageShell>
  );
}

