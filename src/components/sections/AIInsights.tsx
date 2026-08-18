import {
  BookOpen,
  Bookmark,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Filter,
  Import,
  Library,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from 'lucide-react';
import { useState } from 'react';

import { PageShell } from '@/components/patterns/PageShell';

type PromptCard = {
  title: string;
  description: string;
  tags: string[];
  meta: string;
  uses: string;
  icon: React.ComponentType<{ className?: string }>;
  iconTint: string;
};

const stats = [
  { value: '24', label: 'Public Prompts', sub: 'Curated by experts', icon: Library },
  { value: '7', label: 'My Prompts', sub: 'Created by you', icon: CircleUserRound },
  { value: '18', label: 'Saved Reports', sub: 'Your research', icon: Bookmark },
  { value: '92', label: 'Conversations', sub: 'This month', icon: Clock3 },
];

const promptCards: PromptCard[] = [
  {
    title: 'Analyze bias framing in a debate',
    description: 'Identify framing techniques, loaded language, and rhetorical strategies used by speakers.',
    tags: ['Debate Analysis', 'Bias'],
    meta: '4.9',
    uses: '1.2k uses',
    icon: MessageSquare,
    iconTint: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Summarize the main debate themes this year',
    description: 'Extract the key topics and emerging themes from parliamentary debates.',
    tags: ['Trends', 'Summary'],
    meta: '4.8',
    uses: '985 uses',
    icon: Sparkles,
    iconTint: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Analyze sentiment in parliamentary debate',
    description: 'Determine the overall sentiment and emotional tone of debate contributions.',
    tags: ['Sentiment Analysis', 'NLP'],
    meta: '4.7',
    uses: '842 uses',
    icon: BookOpen,
    iconTint: 'bg-violet-50 text-violet-600',
  },
  {
    title: "How has the government's position changed over time?",
    description: 'Track and compare the government’s stance on an issue across time periods.',
    tags: ['Trend Analysis', 'Government'],
    meta: '4.9',
    uses: '1.1k uses',
    icon: ShieldCheck,
    iconTint: 'bg-orange-50 text-orange-600',
  },
  {
    title: "Show this member's recent voting history",
    description: 'Display a member’s votes, positions, and alignment on key legislation.',
    tags: ['Members', 'Voting'],
    meta: '4.8',
    uses: '1.0k uses',
    icon: Users,
    iconTint: 'bg-blue-50 text-blue-600',
  },
  {
    title: 'Explain this bill in plain language',
    description: 'Generate a citizen-friendly explanation of a bill and its implications.',
    tags: ['Legislation', 'Explanation'],
    meta: '4.9',
    uses: '1.5k uses',
    icon: BookOpen,
    iconTint: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Compare voting patterns between parties',
    description: 'Analyze how parties vote on key issues and legislation.',
    tags: ['Voting', 'Comparison'],
    meta: '4.7',
    uses: '912 uses',
    icon: Users,
    iconTint: 'bg-pink-50 text-pink-600',
  },
  {
    title: 'Detect likely AI usage in this speech',
    description: 'Analyze a speech for patterns that may indicate AI assistance.',
    tags: ['AI Integrity', 'Detection'],
    meta: '4.6',
    uses: '673 uses',
    icon: ShieldCheck,
    iconTint: 'bg-red-50 text-red-600',
  },
  {
    title: 'Find key quotes from this debate',
    description: 'Extract the most important and impactful quotes from a debate.',
    tags: ['Debate', 'Quotes'],
    meta: '4.8',
    uses: '1.3k uses',
    icon: Search,
    iconTint: 'bg-amber-50 text-amber-600',
  },
];

const categoryItems = [
  ['Debate Analysis', 8],
  ['Legislation', 7],
  ['Members & Representatives', 6],
  ['Voting & Divisions', 6],
  ['AI Integrity', 5],
  ['Bias & Rhetoric', 5],
  ['Trends & Insights', 4],
  ['General Information', 3],
] as const;

const popularPrompts = [
  ['Analyze bias framing in a debate', '1.2k uses'],
  ['Explain this bill in plain language', '1.1k uses'],
  ["Show this member's recent voting history", '1.0k uses'],
  ["How has the government's position changed over time?", '985 uses'],
  ['Find key quotes from this debate', '854 uses'],
] as const;

const tabs = ['Public Library', 'My Prompts', 'Saved Reports'] as const;
type Tab = (typeof tabs)[number];

export default function AIInsights() {
  const [activeTab, setActiveTab] = useState<Tab>('Public Library');

  return (
    <PageShell>
      <div className="grid grid-cols-1 gap-6 py-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-6">
            <section className="overflow-hidden rounded-2xl border border-[var(--dai-border)] bg-white shadow-sm">
              <div className="bg-gradient-to-r from-white via-white to-[#eef8fb] px-6 py-6 sm:px-8 sm:py-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                  <div className="max-w-3xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-teal-100)] bg-[var(--color-teal-100)]/60 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-teal-600)]">
                      Curated prompt library
                    </div>
                    <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--dai-ink)] sm:text-5xl">Research Library</h1>
                    <p className="mt-3 max-w-2xl text-xl font-semibold leading-8 text-[var(--color-teal-600)]">
                      Curated prompts to help you explore, analyze, and understand democracy.
                    </p>
                    <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--dai-slate)] sm:text-lg">
                      Use expert-crafted prompts to investigate parliamentary data, or create and save your own for future research.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-600)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-teal-500)]">
                        <Plus className="h-4 w-4" />
                        Create New Prompt
                      </button>
                      <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]">
                        <Import className="h-4 w-4" />
                        Import Prompts
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:w-[520px] xl:grid-cols-2">
                    {stats.map((item) => {
                      const Icon = item.icon;
                      return (
                        <article key={item.label} className="rounded-2xl border border-[var(--dai-border)] bg-white px-4 py-4 shadow-sm">
                          <div className="flex items-center gap-2 text-[var(--dai-slate)]">
                            <Icon className="h-4 w-4 text-[var(--color-teal-600)]" />
                            <span className="text-3xl font-bold text-[var(--dai-ink)]">{item.value}</span>
                          </div>
                          <p className="mt-1 text-sm font-semibold text-[var(--dai-ink)]">{item.label}</p>
                          <p className="text-xs text-[var(--dai-slate)]">{item.sub}</p>
                        </article>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="flex flex-wrap items-center gap-6 border-b border-[var(--dai-border)] px-2">
                {tabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`border-b-2 pb-3 text-sm font-semibold transition-colors ${activeTab === tab ? 'border-[var(--color-teal-600)] text-[var(--color-teal-600)]' : 'border-transparent text-[var(--dai-slate)] hover:text-[var(--dai-ink)]'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
                <div className="grid gap-3 xl:grid-cols-[1.2fr_0.9fr_0.9fr_auto]">
                  <button type="button" className="inline-flex items-center justify-between rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2 text-sm text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]">
                    <span className="inline-flex items-center gap-2"><Filter className="h-4 w-4" /> All Categories</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button type="button" className="inline-flex items-center justify-between rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2 text-sm text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]">
                    <span>All Goals</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <button type="button" className="inline-flex items-center justify-between rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2 text-sm text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]">
                    <span>Sort by: Popular</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dai-slate)]" />
                    <input
                      type="text"
                      placeholder="Search prompts..."
                      className="w-full rounded-lg border border-[var(--dai-border)] bg-white py-2 pl-10 pr-3 text-sm text-[var(--dai-slate)] outline-none focus:border-[var(--color-teal-600)] xl:w-[250px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {promptCards.map((card) => {
                  const Icon = card.icon;
                  return (
                    <article key={card.title} className="min-h-[240px] rounded-2xl border border-[var(--dai-border)] bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5 hover:shadow-md">
                      <div className="flex items-start justify-between gap-3">
                        <div className={`inline-flex rounded-xl p-2 ${card.iconTint}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <Bookmark className="h-4 w-4 text-[var(--dai-slate)]" />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold leading-7 text-[var(--dai-ink)]">{card.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--dai-slate)]">{card.description}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {card.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-[var(--dai-muted)] px-2.5 py-1 text-xs font-medium text-[var(--dai-slate)]">
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div className="mt-5 flex items-center justify-between border-t border-[var(--dai-border)] pt-3 text-xs text-[var(--dai-slate)]">
                        <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 text-amber-500" /> {card.meta}</span>
                        <span>{card.uses}</span>
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="flex justify-center">
                <button type="button" className="rounded-lg border border-[var(--dai-border)] bg-white px-5 py-2 text-sm font-semibold text-[var(--dai-slate)] shadow-sm hover:bg-[var(--dai-muted)]">
                  Load more prompts
                </button>
              </div>
            </section>

            <section className="rounded-xl border border-[var(--dai-border)] bg-white px-4 py-3 text-sm text-[var(--dai-slate)] shadow-sm">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <p className="inline-flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[var(--color-teal-600)]" />
                  All prompts are designed to work with Irish parliamentary data. Results are grounded in official records and include citations so you can verify everything.
                </p>
                <button type="button" className="inline-flex items-center gap-1 font-semibold text-[var(--color-teal-600)] hover:text-[var(--color-teal-500)]">
                  Suggest a prompt
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
              <div className="relative mb-4">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dai-slate)]" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  className="w-full rounded-lg border border-[var(--dai-border)] bg-white py-2 pl-10 pr-3 text-sm text-[var(--dai-slate)] outline-none focus:border-[var(--color-teal-600)]"
                />
              </div>
              <h3 className="text-lg font-semibold text-[var(--dai-ink)]">Categories</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {categoryItems.map(([label, count]) => (
                  <li key={label} className="flex items-center justify-between text-[var(--dai-slate)]">
                    <span>{label}</span>
                    <span className="rounded-full bg-[var(--dai-muted)] px-2 py-0.5 text-xs text-[var(--dai-slate)]">{count}</span>
                  </li>
                ))}
              </ul>
              <button type="button" className="mt-4 text-sm font-semibold text-[var(--color-teal-600)] hover:text-[var(--color-teal-500)]">
                View all categories
              </button>
            </section>

            <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h3 className="text-lg font-semibold text-[var(--dai-ink)]">Popular Prompts</h3>
              <ol className="mt-3 space-y-3 text-sm">
                {popularPrompts.map(([label, uses], index) => (
                  <li key={label} className="flex items-start gap-3">
                    <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--dai-muted)] text-xs font-semibold text-[var(--dai-slate)]">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--dai-ink)]">{label}</p>
                      <p className="text-xs text-[var(--dai-slate)]">{uses}</p>
                    </div>
                  </li>
                ))}
              </ol>
              <button type="button" className="mt-4 text-sm font-semibold text-[var(--color-teal-600)] hover:text-[var(--color-teal-500)]">
                View all popular prompts
              </button>
            </section>
          </aside>
      </div>
    </PageShell>
  );
}

