import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  CircleUserRound,
  FileText,
  Github,
  Link2,
  MessageCircle,
  Scale,
  Search,
  Shield,
  ShieldCheck,
  Target,
  Users,
  type LucideIcon,
} from 'lucide-react';

import { PageShell } from '@/components/patterns/PageShell';

type TrustChip = {
  title: string;
  sub: string;
  icon: LucideIcon;
  tone: string;
};

type ResearchGoal = {
  label: string;
  icon: LucideIcon;
  color: string;
};

type PrincipleCard = {
  title: string;
  text: string;
  cta: string;
  icon: LucideIcon;
  tone: string;
};

const trustChips: TrustChip[] = [
  { title: 'Source Grounded', sub: 'Verified official records', icon: ShieldCheck, tone: 'text-emerald-600 bg-emerald-50' },
  { title: 'Explainable', sub: 'Clear reasoning & evidence', icon: Search, tone: 'text-blue-600 bg-blue-50' },
  { title: 'Verifiable', sub: 'Citations you can trust', icon: Link2, tone: 'text-green-600 bg-green-50' },
  { title: 'Responsible AI', sub: 'Designed for transparency', icon: Shield, tone: 'text-violet-600 bg-violet-50' },
];

const goals: ResearchGoal[] = [
  { label: 'Understand legislation', icon: Scale, color: 'text-blue-600' },
  { label: 'Analyze debates', icon: MessageCircle, color: 'text-violet-600' },
  { label: 'Compare parties', icon: Users, color: 'text-emerald-600' },
  { label: 'Track representatives', icon: CircleUserRound, color: 'text-sky-600' },
  { label: 'Detect bias', icon: Target, color: 'text-orange-600' },
  { label: 'AI Integrity', icon: Shield, color: 'text-indigo-600' },
];

const principleCards: PrincipleCard[] = [
  {
    title: 'Built on Official Parliamentary Records',
    text: 'We use data from the Oireachtas Open Data API under the PSI Licence.',
    cta: 'Learn about our data sources',
    icon: BookOpen,
    tone: 'bg-gradient-to-br from-emerald-50 to-white',
  },
  {
    title: 'Responsible AI by Design',
    text: 'We follow responsible AI principles to ensure accuracy, fairness, and accountability.',
    cta: 'See our principles',
    icon: ShieldCheck,
    tone: 'bg-gradient-to-br from-blue-50 to-white',
  },
  {
    title: 'Open Source for Public Good',
    text: 'Open source software, open data, and open standards for a more transparent democracy.',
    cta: 'View project on GitHub',
    icon: Users,
    tone: 'bg-gradient-to-br from-violet-50 to-white',
  },
];

export default function Home() {
  return (
    <PageShell className="bg-white">
      <main className="space-y-8">
        <section className="grid grid-cols-1 gap-5 lg:grid-cols-[1.15fr_1fr] lg:items-start xl:grid-cols-[1.25fr_1fr]">
          <div>
            <h1 className="text-[clamp(1.9rem,3.6vw,4rem)] font-bold leading-[1.04] text-[var(--dai-ink)] lg:leading-[1.08]">
              AI-powered insights.
              <br />
              Democracy made <span className="text-[var(--color-teal-600)]">clear.</span>
            </h1>
            <p className="mt-3 max-w-3xl text-[clamp(0.98rem,1.15vw,1.3rem)] leading-relaxed text-[var(--dai-slate)]">
              Parliament AI helps you explore parliamentary debates, legislation,
              voting records, and representatives using natural language.
              <br />
              Every answer is grounded in official parliamentary records.
            </p>
          </div>

          <div className="relative">
            <div className="relative mx-auto w-full max-w-[570px] aspect-[570/302]">
              <div className="pointer-events-none absolute inset-0">
                <svg viewBox="0 0 570 302" className="h-full w-full" aria-hidden="true">
                <defs>
                  <radialGradient id="heroGlow" cx="50%" cy="60%" r="43%">
                    <stop offset="0%" stopColor="#c8f5ee" stopOpacity="0.95" />
                    <stop offset="64%" stopColor="#e8faf6" stopOpacity="0.58" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </radialGradient>
                </defs>

                <ellipse cx="286" cy="186" rx="175" ry="94" fill="url(#heroGlow)" />

                <g stroke="#cfeaf1" strokeWidth="1.1" fill="none" opacity="0.78">
                  <path d="M18 156 L66 108 L120 122 L162 86 L208 104" />
                  <path d="M22 220 L66 198 L112 218 L154 192 L198 210" />
                  <path d="M58 76 L108 66 L142 42 L186 56 L224 32" />
                  <path d="M336 34 L374 58 L428 42 L472 70 L554 62" />
                  <path d="M336 118 L382 128 L430 110 L474 132 L556 124" />
                  <path d="M330 214 L380 202 L432 222 L476 206 L558 224" />
                  <path d="M322 266 L374 262 L424 282 L470 264 L534 282" />
                </g>

                <g fill="#6ed4d3" opacity="0.95">
                  <circle cx="18" cy="156" r="2.5" />
                  <circle cx="66" cy="108" r="2.5" />
                  <circle cx="120" cy="122" r="2.5" />
                  <circle cx="162" cy="86" r="2.5" />
                  <circle cx="208" cy="104" r="2.5" />
                  <circle cx="58" cy="76" r="2.5" />
                  <circle cx="108" cy="66" r="2.5" />
                  <circle cx="142" cy="42" r="2.5" />
                  <circle cx="186" cy="56" r="2.5" />
                  <circle cx="224" cy="32" r="2.5" />
                  <circle cx="336" cy="34" r="2.5" />
                  <circle cx="374" cy="58" r="2.5" />
                  <circle cx="428" cy="42" r="2.5" />
                  <circle cx="472" cy="70" r="2.5" />
                  <circle cx="554" cy="62" r="2.5" />
                  <circle cx="336" cy="118" r="2.5" />
                  <circle cx="382" cy="128" r="2.5" />
                  <circle cx="430" cy="110" r="2.5" />
                  <circle cx="474" cy="132" r="2.5" />
                  <circle cx="556" cy="124" r="2.5" />
                  <circle cx="330" cy="214" r="2.5" />
                  <circle cx="380" cy="202" r="2.5" />
                  <circle cx="432" cy="222" r="2.5" />
                  <circle cx="476" cy="206" r="2.5" />
                  <circle cx="558" cy="224" r="2.5" />
                  <circle cx="22" cy="220" r="2.5" />
                  <circle cx="66" cy="198" r="2.5" />
                  <circle cx="112" cy="218" r="2.5" />
                  <circle cx="154" cy="192" r="2.5" />
                  <circle cx="198" cy="210" r="2.5" />
                </g>
                </svg>
              </div>

              <div className="relative left-1/2 top-[60%] flex h-[144px] w-[144px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,_rgba(167,245,233,0.58)_0%,_rgba(255,255,255,0.84)_62%,_rgba(255,255,255,0)_100%)]">
                <svg viewBox="0 0 120 120" className="h-[94px] w-[94px]" aria-hidden="true">
                  <polygon points="60,16 104,40 16,40" fill="#13a7a0" />
                  <rect x="20" y="43" width="80" height="8" rx="2" fill="#13a7a0" />
                  <rect x="26" y="54" width="10" height="36" rx="5" fill="#13a7a0" />
                  <rect x="44" y="54" width="10" height="36" rx="5" fill="#13a7a0" />
                  <rect x="62" y="54" width="10" height="36" rx="5" fill="#13a7a0" />
                  <rect x="80" y="54" width="10" height="36" rx="5" fill="#13a7a0" />
                  <rect x="18" y="95" width="84" height="10" rx="4" fill="#13a7a0" />
                </svg>
              </div>

              <div className="pointer-events-none absolute inset-0">
                <div className="absolute left-[21%] top-[27%] flex h-[62px] w-[62px] items-center justify-center rounded-full border border-[#dce9f7] bg-white text-[#3f5f8f] shadow-sm">
                  <FileText className="h-[22px] w-[22px]" strokeWidth={1.8} />
                </div>
                <div className="absolute left-[20%] top-[58%] flex h-[62px] w-[62px] items-center justify-center rounded-full border border-[#dce9f7] bg-white text-[#3f5f8f] shadow-sm">
                  <ClipboardList className="h-[22px] w-[22px]" strokeWidth={1.8} />
                </div>
                <div className="absolute left-1/2 top-[7%] flex h-[62px] w-[62px] -translate-x-1/2 items-center justify-center rounded-full border border-[#dce9f7] bg-white text-[#3f5f8f] shadow-sm">
                  <ClipboardList className="h-[22px] w-[22px]" strokeWidth={1.8} />
                </div>
                <div className="absolute right-[21%] top-[21%] flex h-[62px] w-[62px] items-center justify-center rounded-full border border-[#dce9f7] bg-white text-[#3f5f8f] shadow-sm">
                  <Scale className="h-[22px] w-[22px]" strokeWidth={1.8} />
                </div>
                <div className="absolute right-[18%] top-[54%] flex h-[62px] w-[62px] items-center justify-center rounded-full border border-[#dce9f7] bg-white text-[#3f5f8f] shadow-sm">
                  <Users className="h-[22px] w-[22px]" strokeWidth={1.8} />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {trustChips.map((chip) => {
              const Icon = chip.icon;
              return (
                <div key={chip.title} className="rounded-xl border border-[var(--dai-border)] bg-white px-4 py-3 shadow-sm min-h-[74px]">
                  <div className="flex items-start gap-2">
                    <div className={`rounded-md p-1.5 ${chip.tone}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-[var(--dai-ink)]">{chip.title}</p>
                      <p className="text-xs text-[var(--dai-slate)]">{chip.sub}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-[36px] font-semibold text-[var(--dai-ink)]">Explore popular ways to research</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {goals.map((goal) => {
              const Icon = goal.icon;
              return (
                <a
                  key={goal.label}
                  href="/research"
                  className="rounded-xl border border-[var(--dai-border)] bg-white px-4 py-3 text-left text-sm font-medium text-[var(--dai-slate)] shadow-sm hover:border-[var(--color-teal-600)]"
                >
                  <span className="inline-flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${goal.color}`} />
                    {goal.label}
                  </span>
                </a>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {principleCards.map((card) => {
            const Icon = card.icon;
            return (
              <article key={card.title} className={`rounded-2xl border border-[var(--dai-border)] p-5 shadow-sm ${card.tone}`}>
                <div className="inline-flex rounded-xl bg-white/80 p-2 text-[var(--color-teal-600)]">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-4xl font-semibold leading-tight text-[var(--dai-ink)]">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-[var(--dai-slate)]">{card.text}</p>
                <a href="/responsible-ai" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-teal-600)] hover:text-[var(--color-teal-500)]">
                  {card.cta}
                  <ArrowRight className="h-4 w-4" />
                </a>
                {card.title.includes('Open Source') && <Github className="ml-auto mt-4 h-5 w-5 text-[var(--dai-ink)]" />}
              </article>
            );
          })}
        </section>

        <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-[var(--color-teal-100)] p-2 text-[var(--color-teal-600)]">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-4xl font-semibold text-[var(--dai-ink)]">Politically neutral. Public interest only.</p>
                <p className="text-sm text-[var(--dai-slate)]">
                  Parliament AI is politically neutral and non-partisan. Our mission is to promote transparency,
                  accountability, and informed civic engagement.
                </p>
              </div>
            </div>
            <a href="/responsible-ai" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-navy-900)] hover:text-[var(--color-teal-600)]">
              Learn more about our mission
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </section>

        <section className="border-t border-[var(--dai-border)] pt-4 text-xs text-[var(--dai-slate)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p>© 2026 Democratic AI. All rights reserved</p>
            <p>
              Data sourced from{' '}
              <a className="text-blue-600 hover:underline" href="https://www.oireachtas.ie/en/copyright-and-reuse/" target="_blank" rel="noopener noreferrer">official parliamentary records</a>{' '}
              under the{' '}
              <a className="text-blue-600 hover:underline" href="https://data.oireachtas.ie/ie/oireachtas/corporate/governanceAndReform/2016/2016-03-27_oireachtas-psi-licence-open-data_en.pdf" target="_blank" rel="noopener noreferrer">Oireachtas Open Data PSI Licence</a>.
            </p>
            <div className="flex items-center gap-4">
              <a href="/responsible-ai" className="hover:text-[var(--dai-slate)]">Privacy Policy</a>
              <a href="/responsible-ai" className="hover:text-[var(--dai-slate)]">Terms of Use</a>
              <a href="/responsible-ai" className="hover:text-[var(--dai-slate)]">Contact</a>
            </div>
          </div>
        </section>
      </main>
    </PageShell>
  );
}

