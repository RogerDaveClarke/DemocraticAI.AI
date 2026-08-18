import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  Globe,
  Info,
  Mail,
  Scale,
  Shield,
  ShieldCheck,
  Users,
} from 'lucide-react';

import { PageShell } from '@/components/patterns/PageShell';

const methodologySteps = [
  {
    title: 'Official Data Only',
    detail: 'All information is sourced from the Oireachtas Open Data API under the PSI Licence. No third-party editorial content.',
    icon: Building2,
    tint: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'RAG Architecture',
    detail: 'Retrieval-Augmented Generation retrieves relevant official records before generating any response, grounding answers in verifiable data.',
    icon: BookOpen,
    tint: 'bg-sky-50 text-sky-600',
  },
  {
    title: 'Responsible AI Guardrails',
    detail: 'Every response is validated for accuracy, checked for hallucinations, and annotated with citations and confidence signals.',
    icon: ShieldCheck,
    tint: 'bg-violet-50 text-violet-600',
  },
  {
    title: 'Continuous Review',
    detail: 'Outputs are regularly evaluated for bias, factual accuracy, and fairness. Feedback is used to improve data pipelines and prompts.',
    icon: Scale,
    tint: 'bg-orange-50 text-orange-600',
  },
];

const principles = [
  'Politically neutral and non-partisan',
  'No opinions — only evidence-based insights',
  'Official records remain authoritative',
  'AI inference is always distinguished from verified fact',
  'No personal data is used to train models',
  'Sources, evidence, and uncertainty are discoverable',
];

const dataSourceItems = [
  { label: 'Dáil Debates', detail: 'Full text of parliamentary debates from Dáil Éireann' },
  { label: 'Seanad Debates', detail: 'Senate proceedings and discussions' },
  { label: 'Bills & Legislation', detail: 'Proposed, amended, and enacted legislation' },
  { label: 'Voting Records', detail: 'Division and vote results by member' },
  { label: 'Committee Reports', detail: 'Committee proceedings and findings' },
  { label: 'Members Data', detail: 'Elected representatives, roles, and affiliations' },
  { label: 'Questions & Answers', detail: 'Parliamentary questions and ministerial responses' },
];

export default function About() {
  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-6 px-8 py-6 xl:grid-cols-[1fr_280px]">
        <main className="min-w-0 space-y-8">
          <section className="relative overflow-hidden rounded-2xl border border-[var(--dai-border)] bg-gradient-to-r from-white via-white to-[#f4f9ff] p-8 shadow-sm">
            <div className="pointer-events-none absolute -right-10 -top-4 hidden h-64 w-80 items-center justify-center xl:flex">
              <div className="absolute inset-0 rounded-full bg-cyan-100/40 blur-2xl" />
              <div className="relative z-10 flex items-center gap-3 text-[var(--color-teal-600)]">
                <Globe className="h-20 w-20" />
                <Users className="h-14 w-14 text-sky-700" />
              </div>
            </div>
            <h1 className="text-5xl font-bold tracking-tight text-[var(--dai-ink)] md:text-6xl">About Parliament AI</h1>
            <p className="mt-2 text-2xl font-semibold text-[var(--color-teal-600)] md:text-3xl">
              Mission and methodology
            </p>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--dai-slate)]">
              Parliament AI is a non-partisan research platform that makes Irish parliamentary activity
              accessible, searchable, and explainable. We combine official Oireachtas records with
              Retrieval-Augmented Generation (RAG) to deliver trustworthy civic insights grounded in
              verifiable data.
            </p>
          </section>

          <section>
            <h2 className="mb-4 text-3xl font-semibold text-[var(--dai-ink)]">Our Methodology</h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {methodologySteps.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="rounded-2xl border border-[var(--dai-border)] bg-white p-5 shadow-sm">
                    <div className={`inline-flex rounded-xl p-3 ${step.tint}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-xl font-semibold text-[var(--dai-ink)]">{step.title}</h3>
                    <p className="mt-2 text-[15px] leading-6 text-[var(--dai-slate)]">{step.detail}</p>
                  </article>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="mb-4 text-3xl font-semibold text-[var(--dai-ink)]">Data Sources</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {dataSourceItems.map((src) => (
                <div key={src.label} className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
                  <p className="font-semibold text-[var(--dai-ink)]">{src.label}</p>
                  <p className="mt-1 text-sm text-[var(--dai-slate)]">{src.detail}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-[var(--dai-slate)]">
              All data is sourced from the{' '}
              <a
                href="https://www.oireachtas.ie/en/open-data/"
                className="text-[var(--color-teal-600)] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Oireachtas Open Data API
              </a>{' '}
              under the{' '}
              <a
                href="https://data.oireachtas.ie/ie/oireachtas/corporate/governanceAndReform/2016/2016-03-27_oireachtas-psi-licence-open-data_en.pdf"
                className="text-[var(--color-teal-600)] hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                PSI Licence
              </a>
              .
            </p>
          </section>

          <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                <Shield className="h-5 w-5" />
              </div>
              <div>
                <p className="text-lg font-semibold text-[var(--dai-ink)]">
                  Official records remain authoritative. AI assists — it does not decide.
                </p>
                <p className="mt-1 text-[var(--dai-slate)]">
                  Parliament AI does not generate opinions or scores. It surfaces evidence so citizens
                  can reach their own informed conclusions.
                </p>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-2 border-t border-[var(--dai-border)] pt-4 text-sm text-[var(--dai-slate)] xl:flex-row xl:items-center xl:justify-between">
            <p className="inline-flex items-center gap-2">
              <Info className="h-4 w-4 text-sky-600" />
              Parliament AI is politically neutral. Our mission is to promote transparency, accountability, and informed civic engagement.
            </p>
            <p>Last updated: May 27, 2025</p>
          </section>
        </main>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-[var(--dai-ink)]">Our Principles</h3>
            <ul className="space-y-2 text-sm text-[var(--dai-slate)]">
              {principles.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-teal-600)]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-[var(--dai-ink)]">Contact & Feedback</h3>
            <p className="text-sm text-[var(--dai-slate)]">
              Found an error or have a suggestion? We welcome feedback to improve accuracy and coverage.
            </p>
            <a
              href="mailto:info@parliamentai.ie"
              className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-teal-600)] hover:text-[var(--color-teal-500)]"
            >
              <Mail className="h-4 w-4" />
              Get in touch
            </a>
          </section>

          <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-lg font-semibold text-[var(--dai-ink)]">Further Reading</h3>
            <ul className="space-y-2">
              {['Responsible AI principles', 'System architecture', 'Data sources', 'Privacy policy'].map((item) => (
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
