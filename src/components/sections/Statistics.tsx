import { useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ExternalLink,
  FileText,
  Gauge,
  Info,
  Landmark,
  MoreVertical,
  Search,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageShell } from '@/components/patterns';

const billTypeData = [
  { name: 'Government Bills', value: 72, color: '#2563eb' },
  { name: 'Private Members\' Bills', value: 44, color: '#10b981' },
  { name: 'Committee Bills', value: 37, color: '#f59e0b' },
];

const activityData = [
  { category: 'Bills', count: 87 },
  { category: 'Questions', count: 338 },
  { category: 'Debates', count: 164 },
  { category: 'Motions', count: 85 },
];

const sentimentData = [
  { month: 'May', positive: 72, neutral: 18, negative: 10 },
  { month: 'Jun', positive: 68, neutral: 22, negative: 10 },
  { month: 'Jul', positive: 74, neutral: 16, negative: 10 },
  { month: 'Aug', positive: 70, neutral: 20, negative: 10 },
];

const stageMetrics = [
  { label: 'Introduced', value: 153, icon: FileText, color: 'text-sky-600', bg: 'bg-sky-50' },
  { label: 'Second Stage', value: 98, icon: ArrowRight, color: 'text-blue-600', bg: 'bg-blue-50' },
  { label: 'Committee', value: 76, icon: Users, color: 'text-cyan-600', bg: 'bg-cyan-50' },
  { label: 'Report Stage', value: 42, icon: CheckCircle2, color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: 'Final Stage', value: 27, icon: Gauge, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Enacted', value: 18, icon: Landmark, color: 'text-green-600', bg: 'bg-green-50' },
];

const recentBills = [
  { title: 'Online Safety (Amendment) Bill 2026', type: 'Government', stage: 'Committee Stage', house: 'Dáil Éireann', time: '3 days', updated: '6 Aug 2026', category: 'government' },
  { title: 'Climate Action (Amendment) Bill 2026', type: 'Government', stage: 'Report Stage', house: 'Seanad Éireann', time: '67 days', updated: '6 Aug 2026', category: 'government' },
  { title: 'Public Health (Tobacco) Bill 2026', type: 'Private Member', stage: 'Second Stage', house: 'Dáil Éireann', time: '18 days', updated: '5 Aug 2026', category: 'private' },
  { title: 'Housing (Amendment) Bill 2025', type: 'Government', stage: 'Third Stage', house: 'Dáil Éireann', time: '91 days', updated: '3 Aug 2026', category: 'government' },
  { title: 'Electoral Reform (Joint Committee) Bill 2026', type: 'Committee', stage: 'Committee Stage', house: 'Dáil Éireann', time: '29 days', updated: '2 Aug 2026', category: 'committee' },
];

const actionCards = [
  { title: 'Track a Bill', description: 'Follow progress in real time', icon: FileText, tone: 'text-sky-600 bg-sky-50' },
  { title: 'Compare Bills', description: 'Compare related legislation', icon: BarChart3, tone: 'text-emerald-600 bg-emerald-50' },
  { title: 'Amendment History', description: 'View all iterations & changes', icon: BookOpen, tone: 'text-blue-600 bg-blue-50' },
  { title: 'Votes & Divisions', description: 'See how members voted', icon: CheckCircle2, tone: 'text-cyan-600 bg-cyan-50' },
  { title: 'Debates Explorer', description: 'Read related debates', icon: Search, tone: 'text-teal-600 bg-teal-50' },
  { title: 'Impact Analysis', description: 'Assess potential impact', icon: TrendingUp, tone: 'text-emerald-700 bg-emerald-50' },
];

export default function Statistics() {
  const [selectedTab, setSelectedTab] = useState<'all' | 'government' | 'private' | 'committee'>('all');
  const totalBillCount = billTypeData.reduce((sum, item) => sum + item.value, 0);
  const filteredRecentBills = selectedTab === 'all'
    ? recentBills
    : recentBills.filter((bill) => bill.category === selectedTab);

  return (
    <PageShell>
      <div className="space-y-4">
        <section className="rounded-2xl border border-[var(--dai-border)] bg-white px-5 py-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-700 text-white shadow-sm">
                <FileText className="h-7 w-7" />
              </div>
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">
                  Legislation Explorer
                </div>
                <h1 className="mt-2 text-[clamp(1.9rem,2.8vw,2.8rem)] font-semibold tracking-[-0.03em] text-[var(--dai-ink)]">
                  Legislation Explorer
                </h1>
                <p className="mt-1 max-w-2xl text-sm text-[var(--dai-slate)] sm:text-base">
                  Explore bills, acts, and amendments through their full parliamentary journey.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start">
              <button
                type="button"
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--dai-border)] bg-white px-4 text-sm font-medium text-[var(--dai-slate)] shadow-sm transition hover:border-[var(--dai-border)] hover:bg-[var(--dai-muted)]"
              >
                <Search className="h-4 w-4" />
                Advanced Search
              </button>
              <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--dai-border)] bg-white text-[var(--dai-slate)] shadow-sm transition hover:bg-[var(--dai-muted)]">
                <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Bills', value: '153', sub: 'This session', note: '+12% vs last session', icon: FileText, tone: 'text-sky-600', bg: 'bg-sky-50' },
            { label: 'Active Bills', value: '220', sub: 'Across both houses', note: '', icon: Users, tone: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Sitting Days', value: '128', sub: 'This year', note: '', icon: CalendarDays, tone: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Committees', value: '34', sub: 'Active', note: '', icon: Users, tone: 'text-violet-600', bg: 'bg-violet-50' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--dai-slate)]">{card.label}</p>
                    <p className="mt-1 text-[2rem] font-semibold leading-none text-[var(--dai-ink)]">{card.value}</p>
                    <p className="mt-2 text-sm text-[var(--dai-slate)]">{card.sub}</p>
                    {card.note && <p className="mt-1 text-xs font-medium text-emerald-600">↑ {card.note}</p>}
                  </div>
                  <div className={`rounded-2xl p-3 ${card.bg} ${card.tone}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Bills by Type</h2>
              <button type="button" className="text-[var(--dai-slate)] hover:text-[var(--dai-slate)]">
                <MoreVertical className="h-4 w-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr] lg:items-center">
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={billTypeData} dataKey="value" innerRadius={48} outerRadius={84} paddingAngle={2}>
                      {billTypeData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-4">
                {billTypeData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3 text-sm">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-[var(--dai-ink)]">{item.name}</p>
                      <p className="text-[var(--dai-slate)]">{item.value} bills</p>
                    </div>
                    <p className="text-[var(--dai-slate)]">{Math.round((item.value / totalBillCount) * 100)}%</p>
                  </div>
                ))}
                <button type="button" className="inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800">
                  View all bill types <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Parliamentary Activity</h2>
              <div className="inline-flex rounded-lg border border-[var(--dai-border)] p-1 text-xs font-medium text-[var(--dai-slate)]">
                <button className="rounded-md bg-[var(--dai-muted)] px-3 py-1 text-[var(--dai-slate)]" type="button">This Year</button>
                <button className="rounded-md px-3 py-1 hover:bg-[var(--dai-muted)]" type="button">Last Year</button>
              </div>
            </div>
            <div className="h-[292px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="category" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#0ea5b7" radius={[8, 8, 0, 0]} barSize={48} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Recent Bills</h2>
                <div className="mt-3 inline-flex rounded-xl border border-[var(--dai-border)] p-1 text-xs font-medium text-[var(--dai-slate)]">
                  {(['all', 'government', 'private', 'committee'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setSelectedTab(tab)}
                      className={`rounded-lg px-3 py-1.5 capitalize transition ${selectedTab === tab ? 'bg-cyan-700 text-white' : 'hover:bg-[var(--dai-muted)]'}`}
                    >
                      {tab === 'all' ? 'All' : tab === 'government' ? 'Government' : tab === 'private' ? "Private Members'" : 'Committee'}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" className="text-sm font-medium text-cyan-700 hover:text-cyan-800">View all →</button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-[var(--dai-border)]">
              <table className="w-full border-collapse text-left text-sm">
                <thead className="bg-[var(--dai-muted)] text-[var(--dai-slate)]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Bill</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Stage</th>
                    <th className="px-4 py-3 font-medium">House</th>
                    <th className="px-4 py-3 font-medium">Time in Progress</th>
                    <th className="px-4 py-3 font-medium">Last Updated</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {filteredRecentBills.map((bill, index) => (
                    <tr key={bill.title} className={`${index !== filteredRecentBills.length - 1 ? 'border-b border-[var(--dai-border)]' : ''} hover:bg-[var(--dai-muted)]/70`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`rounded-lg p-2 ${index % 2 === 0 ? 'bg-sky-50 text-sky-600' : 'bg-cyan-50 text-cyan-600'}`}>
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium text-[var(--dai-ink)]">{bill.title}</p>
                            <p className="text-xs text-[var(--dai-slate)]">Bill</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--dai-slate)]">{bill.type}</td>
                      <td className="px-4 py-3 text-[var(--dai-slate)]">{bill.stage}</td>
                      <td className="px-4 py-3 text-[var(--dai-slate)]">{bill.house}</td>
                      <td className="px-4 py-3 text-[var(--dai-slate)]">{bill.time}</td>
                      <td className="px-4 py-3 text-[var(--dai-slate)]">{bill.updated}</td>
                      <td className="px-4 py-3 text-right">
                        <button type="button" className="text-[var(--dai-slate)] hover:text-[var(--dai-slate)]">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredRecentBills.length === 0 && (
                    <tr>
                      <td className="px-4 py-6 text-center text-[var(--dai-slate)]" colSpan={7}>
                        No bills found for this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h2 className="mb-4 text-sm font-semibold text-[var(--dai-ink)]">Legislation Journey Overview</h2>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-6 xl:grid-cols-3">
                {stageMetrics.map((stage, index) => {
                  const Icon = stage.icon;
                  return (
                    <div key={stage.label} className="flex flex-col items-center text-center">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${stage.bg} ${stage.color} shadow-sm`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-3 h-px w-full bg-[var(--dai-muted)]" />
                      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--dai-slate)]">{stage.label}</p>
                      <p className="text-sm font-semibold text-[var(--dai-ink)]">{stage.value}</p>
                      {index === stageMetrics.length - 1 && <span className="mt-2 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-semibold text-emerald-700">Latest</span>}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-1">
              <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Key Insights</h2>
                  <Info className="h-4 w-4 text-[var(--dai-slate)]" />
                </div>
                <ul className="space-y-3 text-sm text-[var(--dai-slate)]">
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-600" />72 bills (47%) introduced by Government</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-600" />Committee Stage is the longest bottleneck (avg. 46 days)</li>
                  <li className="flex gap-2"><CheckCircle2 className="mt-0.5 h-4 w-4 text-cyan-600" />18 bills enacted this session</li>
                </ul>
                <button type="button" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800">
                  Explore all insights <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Sentiment Over Time</h2>
                  <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--dai-border)] px-3 py-1 text-xs font-medium text-[var(--dai-slate)]">
                    Last 90 Days <ChevronDown className="h-3.5 w-3.5" />
                  </div>
                </div>
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sentimentData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="month" tickLine={false} axisLine={false} />
                      <YAxis tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip />
                      <Line type="monotone" dataKey="positive" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="neutral" stroke="#94a3b8" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="negative" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-[var(--dai-slate)]">
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" />Positive</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--dai-slate)]" />Neutral</span>
                  <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" />Negative</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Explore Legislation in Depth</h2>
            <span className="text-xs text-[var(--dai-slate)]">8 tools</span>
          </div>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
            {actionCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.title}
                  type="button"
                  className="group rounded-2xl border border-[var(--dai-border)] bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className={`mb-3 inline-flex rounded-xl p-2 ${card.tone}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <h3 className="text-sm font-semibold text-[var(--dai-ink)]">{card.title}</h3>
                      <p className="mt-1 text-xs leading-5 text-[var(--dai-slate)]">{card.description}</p>
                    </div>
                    <ArrowRight className="mt-1 h-4 w-4 text-[var(--dai-slate)] transition group-hover:text-[var(--dai-slate)]" />
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <footer className="flex flex-col gap-3 border-t border-[var(--dai-border)] pb-2 pt-1 text-xs text-[var(--dai-slate)] md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-[var(--dai-border)] text-[11px]">i</span>
            <span>Data sourced from Oireachtas API · Updates daily</span>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" className="hover:text-[var(--dai-slate)]">About the data</button>
            <button type="button" className="hover:text-[var(--dai-slate)]">Provide feedback</button>
          </div>
        </footer>
      </div>
    </PageShell>
  );
}



