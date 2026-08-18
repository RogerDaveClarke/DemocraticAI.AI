import {
  Activity,
  Calendar,
  CheckCircle2,
  Circle,
  Clock3,
  Database,
  Download,
  ExternalLink,
  FileText,
  Landmark,
  Shield,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { PageShell } from '@/components/patterns';

type StatCard = {
  title: string;
  value: string;
  sub: string;
  icon: React.ElementType;
  tone: string;
};

type DataSourceRow = {
  sourceType: string;
  status: string;
  lastSync: string;
  records: string;
};

const statCards: StatCard[] = [
  {
    title: 'Current Legislature',
    value: 'Ireland (Oireachtas)',
    sub: 'Change legislature',
    icon: Landmark,
    tone: 'text-emerald-600 bg-emerald-50',
  },
  {
    title: 'Platform Version',
    value: '2026.1',
    sub: 'Released May 24, 2025',
    icon: FileText,
    tone: 'text-blue-600 bg-blue-50',
  },
  {
    title: 'Knowledge Base',
    value: 'Healthy',
    sub: 'All systems operational',
    icon: Database,
    tone: 'text-emerald-600 bg-emerald-50',
  },
  {
    title: 'Responsible AI',
    value: 'Enabled',
    sub: 'Active safeguards',
    icon: Shield,
    tone: 'text-teal-600 bg-teal-50',
  },
  {
    title: 'Last Updated',
    value: '3 hours ago',
    sub: 'May 24, 2025 08:45 UTC',
    icon: Clock3,
    tone: 'text-[var(--dai-slate)] bg-[var(--dai-muted)]',
  },
];

const dataSources: DataSourceRow[] = [
  { sourceType: 'Debates / Houses & Committees', status: 'Healthy', lastSync: 'Today, 08:45 UTC', records: '482,341' },
  { sourceType: 'Questions / Parliamentary Questions', status: 'Healthy', lastSync: 'Today, 08:40 UTC', records: '118,223' },
  { sourceType: 'Votes / Divisions & Voting Records', status: 'Healthy', lastSync: 'Today, 08:41 UTC', records: '24,115' },
  { sourceType: 'Bills / Legislation & Amendments', status: 'Healthy', lastSync: 'Today, 08:37 UTC', records: '3,987' },
  { sourceType: 'Members / Representatives & Profiles', status: 'Healthy', lastSync: 'Today, 08:30 UTC', records: '227' },
];

const supportedLegislatures = [
  'UK Parliament',
  'Scottish Parliament',
  'Welsh Parliament',
  'European Parliament',
  'US Congress',
  'Canadian Parliament',
  'Australian Parliament',
  'New Zealand Parliament',
];

export default function PlatformStatus() {
  return (
    <PageShell className="p-5 xl:p-6">
      <div className="space-y-4">
        <section className="rounded-xl border border-[var(--dai-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h1 className="flex items-center gap-2 text-[42px] font-semibold text-[var(--dai-ink)]">
                <TrendingUp className="h-8 w-8 text-teal-600" />
                Platform Status
              </h1>
              <p className="text-sm text-[var(--dai-slate)]">Transparency, data sources, and system health.</p>
            </div>
            <button className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]">
              <Download className="h-4 w-4" />
              View system logs
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.title} className="rounded-xl border border-[var(--dai-border)] bg-white px-4 py-3">
                  <div className={`mb-2 inline-flex rounded-md p-1.5 ${card.tone}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs font-semibold text-[var(--dai-slate)]">{card.title}</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--dai-ink)]">{card.value}</p>
                  <p className="text-xs text-[var(--dai-slate)]">{card.sub}</p>
                </div>
              );
            })}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1.85fr_1.7fr]">
          <article className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Data Sources</h2>
            <div className="overflow-hidden rounded-lg border border-[var(--dai-border)]">
              <table className="w-full text-xs">
                <thead className="bg-[var(--dai-muted)] text-[var(--dai-slate)]">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Source Type</th>
                    <th className="px-3 py-2 text-left font-semibold">Status</th>
                    <th className="px-3 py-2 text-left font-semibold">Last Sync</th>
                    <th className="px-3 py-2 text-left font-semibold">Records</th>
                  </tr>
                </thead>
                <tbody>
                  {dataSources.map((row) => (
                    <tr key={row.sourceType} className="border-t border-[var(--dai-border)]">
                      <td className="px-3 py-2 text-[var(--dai-slate)]">{row.sourceType}</td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center gap-1 text-emerald-700">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[var(--dai-slate)]">{row.lastSync}</td>
                      <td className="px-3 py-2 text-[var(--dai-slate)]">{row.records}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-teal-700 hover:text-teal-800">View all data sources</button>
          </article>

          <article className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Data Freshness</h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-start justify-between rounded-lg border border-[var(--dai-border)] p-3">
                <div className="flex items-center gap-2 text-[var(--dai-slate)]"><CheckCircle2 className="h-4 w-4 text-emerald-600" />Last successful ingestion</div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--dai-ink)]">3 hours ago</p>
                  <p className="text-xs text-[var(--dai-slate)]">May 24, 2025 08:45 UTC</p>
                </div>
              </div>
              <div className="flex items-start justify-between rounded-lg border border-[var(--dai-border)] p-3">
                <div className="flex items-center gap-2 text-[var(--dai-slate)]"><Clock3 className="h-4 w-4 text-sky-600" />Average ingestion duration</div>
                <p className="font-semibold text-[var(--dai-ink)]">12 minutes</p>
              </div>
              <div className="flex items-start justify-between rounded-lg border border-[var(--dai-border)] p-3">
                <div className="flex items-center gap-2 text-[var(--dai-slate)]"><Activity className="h-4 w-4 text-emerald-600" />Current ingestion status</div>
                <div className="inline-flex items-center gap-1 text-emerald-700"><Circle className="h-3 w-3 fill-current" />Idle</div>
              </div>
              <div className="flex items-start justify-between rounded-lg border border-[var(--dai-border)] p-3">
                <div className="flex items-center gap-2 text-[var(--dai-slate)]"><Calendar className="h-4 w-4 text-violet-600" />Next scheduled run</div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--dai-ink)]">Tonight, 01:00 UTC</p>
                  <p className="text-xs text-[var(--dai-slate)]">May 25, 2025</p>
                </div>
              </div>
            </div>
          </article>

          <article className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Supported Legislatures</h2>
            <div className="mb-2 rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Ireland (Oireachtas)</span>
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold">Active</span>
              </div>
            </div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--dai-slate)]">Coming soon</p>
            <div className="space-y-1 text-xs text-[var(--dai-slate)]">
              {supportedLegislatures.map((legislature) => (
                <div key={legislature} className="flex items-center gap-2">
                  <Circle className="h-3 w-3" />
                  {legislature}
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800">Request a legislature</button>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_2fr_1.6fr]">
          <article className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Architecture Health</h2>
            <div className="space-y-2 text-xs">
              {['Data Ingestion', 'Embedding Generation', 'Vector Index', 'Responsible AI Layer', 'AI Chat Service', 'Web Application'].map((service) => (
                <div key={service} className="flex items-center justify-between rounded-md border border-[var(--dai-border)] px-3 py-2">
                  <span className="text-[var(--dai-slate)]">{service}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Healthy</span>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800">View architecture diagram</button>
          </article>

          <article className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Platform Metrics</h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                ['1.2M', 'Official Records', 'Total ingested'],
                ['4.8M', 'Embeddings', 'Total generated'],
                ['812K', 'Documents Indexed', 'In vector store'],
                ['22 GB', 'Vector DB Size', 'Current storage'],
                ['1.1 sec', 'Avg Response Time', 'Last 7 days'],
                ['7.3', 'Avg Citations', 'Per response'],
              ].map(([value, label, sub]) => (
                <div key={label} className="rounded-lg border border-[var(--dai-border)] bg-[var(--dai-muted)] p-3">
                  <p className="text-lg font-semibold text-[var(--dai-ink)]">{value}</p>
                  <p className="font-semibold text-[var(--dai-slate)]">{label}</p>
                  <p className="text-[var(--dai-slate)]">{sub}</p>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800">View full metrics dashboard</button>
          </article>

          <article className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Data Source Configuration</h2>
            <div className="space-y-2 text-xs text-[var(--dai-slate)]">
              <div className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2"><span>Current Legislature</span><span>Ireland (Oireachtas)</span></div>
              <div className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2"><span>Open Data Endpoint</span><span className="inline-flex items-center gap-1 text-blue-600">https://api.oireachtas.ie <ExternalLink className="h-3 w-3" /></span></div>
              <div className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2"><span>Refresh Frequency</span><span>Every 24 hours</span></div>
              <div className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2"><span>Vector Model</span><span>text-embedding-004</span></div>
              <div className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2"><span>Language</span><span>English</span></div>
              <div className="flex items-center justify-between"><span>Timezone</span><span>Europe/Dublin</span></div>
            </div>
            <button className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800">Edit configuration</button>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_2fr_1.6fr]">
          <article className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Transparency & Licensing</h2>
            <div className="space-y-2 text-xs text-[var(--dai-slate)]">
              <div className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2"><span>Data Licence</span><span className="text-blue-600">Oireachtas Open Data PSI Licence</span></div>
              <div className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2"><span>Attribution</span><span>Required (see licence)</span></div>
              <div className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2"><span>Official Website</span><span className="inline-flex items-center gap-1 text-blue-600">www.oireachtas.ie <ExternalLink className="h-3 w-3" /></span></div>
              <div className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2"><span>API Status</span><span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />Operational</span></div>
              <div className="flex items-center justify-between"><span>Documentation</span><span className="inline-flex items-center gap-1 text-blue-600">Oireachtas API Docs <ExternalLink className="h-3 w-3" /></span></div>
            </div>
          </article>

          <article className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">AI Configuration</h2>
            <div className="space-y-2 text-xs text-[var(--dai-slate)]">
              {[
                ['LLM Model', 'Gemini 2.5 Pro'],
                ['Embedding Model', 'text-embedding-004'],
                ['Grounding (RAG)', 'Enabled'],
                ['Citation Enforcement', 'Enabled'],
                ['Bias Analysis', 'Enabled'],
                ['Hallucination Detection', 'Enabled'],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between border-b border-[var(--dai-border)] pb-2 last:border-b-0">
                  <span>{label}</span>
                  <span className="inline-flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5" />{value}</span>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800">View AI & safety details</button>
          </article>

          <article className="rounded-xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Version History</h2>
            <div className="space-y-2 text-xs text-[var(--dai-slate)]">
              {[
                ['2026.1', 'Latest', 'May 24, 2025'],
                ['2026.0', '', 'May 10, 2025'],
                ['2025.2', '', 'Apr 26, 2025'],
                ['2025.1', '', 'Apr 12, 2025'],
              ].map(([version, tag, date]) => (
                <div key={version} className="flex items-center justify-between rounded-md border border-[var(--dai-border)] px-2.5 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[var(--dai-ink)]">{version}</span>
                    {tag && <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">{tag}</span>}
                  </div>
                  <div className="text-right">
                    <p className="text-[var(--dai-slate)]">{date}</p>
                    <button className="text-[11px] font-semibold text-blue-600">View notes</button>
                  </div>
                </div>
              ))}
            </div>
            <button className="mt-3 text-xs font-semibold text-teal-700 hover:text-teal-800">View full changelog</button>
          </article>
        </section>

        <section className="grid grid-cols-1 gap-3 rounded-xl border border-[var(--dai-border)] bg-white p-4 text-xs text-[var(--dai-slate)] xl:grid-cols-3">
          <div className="inline-flex items-start gap-2">
            <Sparkles className="mt-0.5 h-4 w-4 text-teal-600" />
            <p>Parliament AI is committed to transparency, accuracy, and responsible use of AI. Learn more about our Responsible AI principles.</p>
          </div>
          <div>
            <p className="font-semibold text-[var(--dai-slate)]">Questions or issues with the data?</p>
            <button className="text-blue-600 hover:underline">Report an issue</button>
          </div>
          <div>
            <p>Data sourced from official parliamentary records under the Oireachtas Open Data PSI Licence.</p>
          </div>
        </section>
      </div>
    </PageShell>
  );
}


