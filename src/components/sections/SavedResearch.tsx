import {
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleEllipsis,
  Clock3,
  Cloud,
  Download,
  FileText,
  Lightbulb,
  Link2,
  MessageCircle,
  Plus,
  Search,
  Share2,
  Star,
  Trash2,
} from 'lucide-react';

import { PageShell } from '@/components/patterns/PageShell';

const savedItems = [
  {
    title: 'Housing Crisis: Key Themes and Party Positions',
    summary: 'Comprehensive analysis of housing debate themes, government actions and party differences.',
    date: '27 May 2025',
    sources: 12,
    type: 'Report',
    icon: FileText,
    active: true,
  },
  {
    title: 'AI Mentions in Parliamentary Debates',
    summary: 'Explored how AI is discussed across recent debates and key policy areas.',
    date: '24 May 2025',
    sources: 8,
    type: 'Conversation',
    icon: MessageCircle,
  },
  {
    title: 'Climate Action Bill Analysis',
    summary: 'Plain language explanation of the Climate Action and Low Carbon Development Bill.',
    date: '20 May 2025',
    sources: 15,
    type: 'Report',
    icon: FileText,
  },
  {
    title: 'Member Profile: Leo Varadkar',
    summary: 'Summary of career, key speeches and voting record.',
    date: '18 May 2025',
    sources: 6,
    type: 'Report',
    icon: Lightbulb,
  },
  {
    title: 'Voting Patterns on Healthcare',
    summary: 'Comparison of party voting behaviour on major healthcare legislation.',
    date: '15 May 2025',
    sources: 10,
    type: 'Report',
    icon: Bookmark,
  },
];

const summaryBullets = [
  'Housing supply and planning reform were the most discussed themes across all parties.',
  'Government emphasized increased delivery targets and infrastructure investment.',
  'Opposition parties called for stronger rent controls and faster delivery of social housing.',
  'Cross-party agreement on the need for long-term, sustainable housing strategy.',
];

const statCards = [
  { value: '18', label: 'Saved Reports', sub: 'Total saved', icon: Bookmark },
  { value: '24', label: 'Saved Prompts', sub: 'From library & your own', icon: MessageCircle },
  { value: '12', label: 'This Month', sub: 'Active research', icon: Clock3 },
  { value: '2.4 MB', label: 'Storage Used', sub: 'Cloud synced', icon: Cloud },
];

export default function SavedResearch() {
  return (
    <PageShell>
      <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="text-5xl font-bold tracking-tight text-[var(--dai-ink)]">Saved Research</h1>
            <p className="mt-2 text-2xl text-[var(--dai-slate)]">Access and manage your saved research, prompts and reports.</p>
            <p className="mt-1 text-2xl text-[var(--dai-slate)]">Continue your research, revisit key insights, and build on previous analyses.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:min-w-[520px]">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <article key={card.label} className="rounded-xl border border-[var(--dai-border)] bg-white px-4 py-3 shadow-sm">
                  <div className="flex items-center gap-2 text-[var(--color-teal-600)]">
                    <Icon className="h-4 w-4" />
                    <p className="text-xl font-bold text-[var(--dai-ink)]">{card.value}</p>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-[var(--dai-slate)]">{card.label}</p>
                  <p className="text-xs text-[var(--dai-slate)]">{card.sub}</p>
                </article>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-b border-[var(--dai-border)] pb-0">
          <div className="flex items-center gap-6 text-sm font-semibold text-[var(--dai-slate)]">
            <button type="button" className="border-b-2 border-[var(--color-teal-600)] pb-3 text-[var(--color-teal-600)]">All Saved</button>
            <button type="button" className="pb-3 hover:text-[var(--dai-ink)]">Reports</button>
            <button type="button" className="pb-3 hover:text-[var(--dai-ink)]">Conversations</button>
            <button type="button" className="pb-3 hover:text-[var(--dai-ink)]">Prompts</button>
          </div>
          <button type="button" className="mb-2 inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-teal-500)]">
            <Plus className="h-4 w-4" />
            Save Current Research
          </button>
        </div>

        <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12">
          <label className="xl:col-span-4 flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-3 py-2 text-sm text-[var(--dai-slate)]">
            <Search className="h-4 w-4" />
            <input
              type="text"
              readOnly
              value="Search your saved research..."
              className="w-full bg-transparent outline-none"
            />
          </label>

          {['All Types', 'All Categories', 'Last 30 Days', 'Sort: Most Recent'].map((filter) => (
            <button key={filter} type="button" className="xl:col-span-2 inline-flex items-center justify-between rounded-lg border border-[var(--dai-border)] bg-white px-3 py-2 text-sm text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]">
              {filter}
              <ChevronDown className="h-4 w-4 text-[var(--dai-slate)]" />
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-12">
        <section className="xl:col-span-6 space-y-3">
          {savedItems.map((item) => {
            const Icon = item.icon;
            return (
              <article
                key={item.title}
                className={`rounded-2xl border p-4 shadow-sm ${item.active ? 'border-[var(--color-teal-500)] bg-[#eafaf8]' : 'border-[var(--dai-border)] bg-white'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className={`rounded-xl p-2 ${item.active ? 'bg-teal-100 text-teal-700' : 'bg-[var(--dai-muted)] text-[var(--dai-slate)]'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--dai-ink)]">{item.title}</h3>
                      <p className="mt-1 text-sm text-[var(--dai-slate)]">{item.summary}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--dai-slate)]">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{item.date}</span>
                        <span className="inline-flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />{item.sources} sources</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-[var(--color-teal-600)] border border-[var(--dai-border)]">{item.type}</span>
                    <Star className="h-4 w-4 text-[var(--dai-slate)]" />
                  </div>
                </div>
              </article>
            );
          })}

          <div className="flex items-center justify-between px-1 text-xs text-[var(--dai-slate)]">
            <p>Showing 5 of 18 saved items</p>
            <div className="flex items-center gap-2">
              <button type="button" className="rounded-md border border-[var(--dai-border)] bg-white p-1.5 hover:bg-[var(--dai-muted)]"><ChevronLeft className="h-3.5 w-3.5" /></button>
              <button type="button" className="rounded-md bg-[var(--color-teal-600)] px-2.5 py-1 text-white">1</button>
              <button type="button" className="px-1.5 py-1">2</button>
              <button type="button" className="px-1.5 py-1">3</button>
              <button type="button" className="px-1.5 py-1">4</button>
              <button type="button" className="rounded-md border border-[var(--dai-border)] bg-white p-1.5 hover:bg-[var(--dai-muted)]"><ChevronRight className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        </section>

        <section className="xl:col-span-6 rounded-2xl border border-[var(--dai-border)] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-4xl font-bold text-[var(--dai-ink)]">Housing Crisis: Key Themes and Party Positions</h2>
              <div className="mt-2 flex items-center gap-3 text-xs text-[var(--dai-slate)]">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />27 May 2025</span>
                <span className="inline-flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />12 sources</span>
                <span className="rounded-full bg-[var(--dai-muted)] px-2 py-0.5">Housing</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full border border-[var(--dai-border)] bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">Report</span>
              <button type="button" className="rounded-lg border border-[var(--dai-border)] p-2 text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"><Star className="h-4 w-4" /></button>
              <button type="button" className="rounded-lg border border-[var(--dai-border)] p-2 text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"><CircleEllipsis className="h-4 w-4" /></button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-6 border-b border-[var(--dai-border)] text-sm font-semibold text-[var(--dai-slate)]">
            <button type="button" className="border-b-2 border-[var(--color-teal-600)] pb-2 text-[var(--color-teal-600)]">Summary</button>
            <button type="button" className="pb-2 hover:text-[var(--dai-ink)]">Key Findings</button>
            <button type="button" className="pb-2 hover:text-[var(--dai-ink)]">Sources (12)</button>
            <button type="button" className="pb-2 hover:text-[var(--dai-ink)]">Related</button>
          </div>

          <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 text-[var(--color-teal-600)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--dai-ink)]">Research Summary</p>
                <p className="mt-1 text-sm text-[var(--dai-slate)]">
                  Comprehensive analysis of the housing crisis based on recent Oireachtas debates, statements and legislation.
                  Identifies the main themes, government actions and differences in party positions.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--dai-border)] p-4">
            <p className="text-sm font-semibold text-[var(--dai-ink)]">Key Topics</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {['Housing Supply', 'Affordability', 'Planning Reform', 'Social Housing', 'Rent Controls'].map((topic) => (
                <span key={topic} className="rounded-full bg-[var(--dai-muted)] px-2.5 py-1 text-xs text-[var(--dai-slate)]">{topic}</span>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[var(--dai-border)] p-4">
            <p className="text-sm font-semibold text-[var(--dai-ink)]">Main Insights</p>
            <ul className="mt-2 space-y-2 text-sm text-[var(--dai-slate)]">
              {summaryBullets.map((insight) => (
                <li key={insight} className="flex items-start gap-2">
                  <span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-teal-500)]">
              <MessageCircle className="h-4 w-4" />
              Continue Research
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]">
              <Download className="h-4 w-4" />
              Download PDF
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]">
              <Share2 className="h-4 w-4" />
              Share Link
            </button>
            <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
