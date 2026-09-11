import {
  Bookmark,
  Calendar,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Cloud,
  Download,
  FileText,
  Lightbulb,
  Link2,
  MessageCircle,
  Plus,
  Printer,
  Search,
  Share2,
  Star,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { PageShell } from '@/components/patterns/PageShell';
import { apiDelete, apiGet, apiPost } from '@/utils/api';
import ReactMarkdown from 'react-markdown';
import { toPublicOfficialSourceUrl } from '@/utils/officialSources';

type ReportSource = { id: string; title: string; uri?: string; source?: string; date?: string };
type SavedReport = {
  id: string; title: string; summary: string; content: string; sources: ReportSource[]; sourceCount: number;
  keyFindings: string[]; relatedRecords: ReportSource[]; createdAt?: { seconds?: number } | string; isPublic: boolean;
  ratingTotal: number; ratingCount: number; model: string; tokensInput: number; tokensOutput: number; cost: number;
  private?: boolean; isOwner?: boolean;
};

const statCards = [
  { value: '18', label: 'Saved Reports', sub: 'Total saved', icon: Bookmark },
  { value: '24', label: 'Saved Prompts', sub: 'From library & your own', icon: MessageCircle },
  { value: '12', label: 'This Month', sub: 'Active research', icon: Clock3 },
  { value: '2.4 MB', label: 'Storage Used', sub: 'Cloud synced', icon: Cloud },
];

export default function SavedResearch() {
  const [tab, setTab] = useState<'all' | 'mine'>(() => new URLSearchParams(window.location.search).get('scope') === 'mine' ? 'mine' : 'all');
  const [reports, setReports] = useState<SavedReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<SavedReport | null>(null);
  const [detailTab, setDetailTab] = useState<'summary' | 'findings' | 'sources' | 'related'>('summary');
  const [error, setError] = useState('');
  const [ratingNotice, setRatingNotice] = useState('');
  const [ratedReportIds, setRatedReportIds] = useState<Set<string>>(new Set());
  const [directReportId] = useState(() => new URLSearchParams(window.location.search).get('report'));
  const [accessNotice, setAccessNotice] = useState('');

  const loadReports = async (scope: 'all' | 'mine') => {
    try {
      setError('');
      const loadedReports = await apiGet<SavedReport[]>(`/api/reports?scope=${scope}`);
      setReports(loadedReports);
      setSelectedReport(loadedReports[0] ?? null);
    } catch {
      setError('Could not load saved reports.');
      setReports([]);
      setSelectedReport(null);
    }
  };

  useEffect(() => { void loadReports(tab); }, [tab]);

  useEffect(() => {
    if (!directReportId) return;
    apiGet<SavedReport>(`/api/reports/${directReportId}`)
      .then((report) => setSelectedReport(report))
      .catch(() => setError('Could not load this report.'));
  }, [directReportId]);

  const formatDate = (report: SavedReport) => {
    const value = typeof report.createdAt === 'string' ? new Date(report.createdAt) : report.createdAt?.seconds ? new Date(report.createdAt.seconds * 1000) : null;
    return value && !Number.isNaN(value.getTime()) ? value.toLocaleDateString('en-IE', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date unavailable';
  };
  const rateReport = async (report: SavedReport, rating: 1 | -1) => {
    if (ratedReportIds.has(report.id)) return;
    setRatedReportIds((rated) => new Set(rated).add(report.id));
    setRatingNotice('Rating saved.');
    const applyRating = (item: SavedReport) => item.id === report.id ? { ...item, ratingTotal: item.ratingTotal + rating, ratingCount: item.ratingCount + 1 } : item;
    setReports((currentReports) => currentReports.map(applyRating));
    setSelectedReport((currentReport) => currentReport ? applyRating(currentReport) : null);
    try { await apiPost(`/api/reports/${report.id}/rating`, { rating }); }
    catch {
      setRatingNotice('You have already rated this report.');
      setReports((currentReports) => currentReports.map((item) => item.id === report.id ? { ...item, ratingTotal: item.ratingTotal - rating, ratingCount: Math.max(0, item.ratingCount - 1) } : item));
      setSelectedReport((currentReport) => currentReport?.id === report.id ? { ...currentReport, ratingTotal: currentReport.ratingTotal - rating, ratingCount: Math.max(0, currentReport.ratingCount - 1) } : currentReport);
    }
  };
  const deleteReport = async (report: SavedReport) => {
    if (!confirm(`Delete ${report.title}?`)) return;
    try { await apiDelete(`/api/reports/${report.id}`); await loadReports(tab); } catch { setError('Could not delete this report.'); }
  };
  const shareReport = async (report: SavedReport) => { await navigator.clipboard.writeText(`${window.location.origin}/saved-research?report=${report.id}`); };
  const requestAccess = async (report: SavedReport) => {
    try {
      await apiPost(`/api/reports/${report.id}/access-requests`, {});
      setAccessNotice('Access request sent to the report author.');
    } catch {
      setAccessNotice('Could not send the access request.');
    }
  };

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
            <button type="button" onClick={() => setTab('all')} className={`border-b-2 pb-3 ${tab === 'all' ? 'border-[var(--color-teal-600)] text-[var(--color-teal-600)]' : 'border-transparent hover:text-[var(--dai-ink)]'}`}>All Saved</button>
            <button type="button" onClick={() => setTab('mine')} className={`border-b-2 pb-3 ${tab === 'mine' ? 'border-[var(--color-teal-600)] text-[var(--color-teal-600)]' : 'border-transparent hover:text-[var(--dai-ink)]'}`}>My Reports</button>
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
          {ratingNotice && <p className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">{ratingNotice}</p>}
          {error ? <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</p> : reports.length === 0 ? <p className="rounded-xl border border-[var(--dai-border)] bg-white p-4 text-sm text-[var(--dai-slate)]">{tab === 'mine' ? 'You have not saved any private reports yet.' : 'No public reports have been saved yet.'}</p> : reports.map((item) => {
            return (
              <article
                key={item.id}
                onClick={() => { setSelectedReport(item); setDetailTab('summary'); }}
                className={`cursor-pointer rounded-2xl border p-4 shadow-sm ${selectedReport?.id === item.id ? 'border-[var(--color-teal-500)] bg-[#eafaf8]' : 'border-[var(--dai-border)] bg-white hover:border-teal-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="rounded-xl bg-teal-50 p-2 text-teal-700">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-[var(--dai-ink)]">{item.title}</h3>
                      <p className="mt-1 text-sm text-[var(--dai-slate)]">{item.summary}</p>
                      <div className="mt-2 flex items-center gap-4 text-xs text-[var(--dai-slate)]">
                        <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(item)}</span>
                        <span className="inline-flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />{item.sourceCount} sources</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${item.isPublic ? 'border-teal-200 bg-teal-50 text-teal-700' : 'border-slate-200 bg-white text-slate-600'}`}>{item.isPublic ? 'Public' : 'Private'}</span>
                    <button type="button" disabled={ratedReportIds.has(item.id)} onClick={(event) => { event.stopPropagation(); void rateReport(item, 1); }} title={ratedReportIds.has(item.id) ? 'Report rated' : 'Rate this report'} className={`inline-flex items-center gap-1 text-xs disabled:cursor-default ${ratedReportIds.has(item.id) ? 'text-amber-600' : 'text-[var(--dai-slate)] hover:text-amber-600'}`}><Star className={`h-4 w-4 ${ratedReportIds.has(item.id) ? 'fill-current' : ''}`} />{item.ratingCount}</button>
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
          {selectedReport?.private ? <div className="py-8 text-center"><FileText className="mx-auto h-8 w-8 text-slate-400" /><h2 className="mt-3 text-lg font-semibold text-[var(--dai-ink)]">Report is private</h2><p className="mx-auto mt-2 max-w-sm text-sm text-[var(--dai-slate)]">Only the author can view this report and its source material.</p>{accessNotice && <p className="mt-3 text-sm text-teal-700">{accessNotice}</p>}<button type="button" onClick={() => void requestAccess(selectedReport)} className="mt-4 rounded-lg bg-[var(--color-teal-600)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-teal-500)]">Request Access</button></div> : selectedReport ? <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold text-[var(--dai-ink)]">{selectedReport.title}</h2>
              <div className="mt-2 flex items-center gap-3 text-xs text-[var(--dai-slate)]">
                <span className="inline-flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{formatDate(selectedReport)}</span>
                <span className="inline-flex items-center gap-1"><Link2 className="h-3.5 w-3.5" />{selectedReport.sourceCount} sources</span>
                <span className={`rounded-full px-2 py-0.5 ${selectedReport.isPublic ? 'bg-teal-50 text-teal-700' : 'bg-[var(--dai-muted)]'}`}>{selectedReport.isPublic ? 'Public' : 'Private'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" disabled={ratedReportIds.has(selectedReport.id)} onClick={() => void rateReport(selectedReport, 1)} title={ratedReportIds.has(selectedReport.id) ? 'Report rated' : 'Rate this report'} className={`rounded-lg border border-[var(--dai-border)] p-2 disabled:cursor-default ${ratedReportIds.has(selectedReport.id) ? 'text-amber-600' : 'text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]'}`}><Star className={`h-4 w-4 ${ratedReportIds.has(selectedReport.id) ? 'fill-current' : ''}`} /></button>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-6 border-b border-[var(--dai-border)] text-sm font-semibold text-[var(--dai-slate)]">
            {(['summary', 'findings', 'sources', 'related'] as const).map((item) => <button key={item} type="button" onClick={() => setDetailTab(item)} className={`border-b-2 pb-2 capitalize ${detailTab === item ? 'border-[var(--color-teal-600)] text-[var(--color-teal-600)]' : 'border-transparent hover:text-[var(--dai-ink)]'}`}>{item === 'findings' ? 'Key Findings' : item === 'sources' ? `Sources (${selectedReport.sourceCount})` : item}</button>)}
          </div>

          {detailTab === 'summary' && <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 text-[var(--color-teal-600)]" />
              <div>
                <p className="text-sm font-semibold text-[var(--dai-ink)]">Research Summary</p>
                <p className="mt-1 text-sm text-[var(--dai-slate)]">
                  {selectedReport.summary}
                </p>
              </div>
            </div>
            </div>
            <div className="prose prose-sm max-w-none text-[var(--dai-ink)]"><ReactMarkdown>{selectedReport.content}</ReactMarkdown></div>
          </div>}
          {detailTab === 'findings' && <ul className="mt-4 space-y-2 text-sm text-[var(--dai-slate)]">{selectedReport.keyFindings.length ? selectedReport.keyFindings.map((finding) => <li key={finding} className="flex gap-2"><span className="mt-1 h-2 w-2 rounded-full bg-emerald-500" />{finding}</li>) : <li>No key findings were extracted from this report.</li>}</ul>}
          {detailTab === 'sources' && <ol className="mt-4 space-y-3">{selectedReport.sources.map((source, index) => <li key={`${source.id}-${index}`} className="border-b border-slate-100 pb-3 text-sm">{toPublicOfficialSourceUrl(source.uri) ? <a href={toPublicOfficialSourceUrl(source.uri)} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">{index + 1}. {source.title}</a> : <span className="font-medium text-[var(--dai-ink)]">{index + 1}. {source.title}</span>}<p className="mt-1 text-xs text-[var(--dai-slate)]">{source.source} {source.date ? `| ${source.date}` : ''}</p></li>)}</ol>}
          {detailTab === 'related' && <div className="mt-4"><p className="mb-3 text-xs text-[var(--dai-slate)]">Further reading related to this report. These records were not used as evidence for its findings.</p><ol className="space-y-3">{selectedReport.relatedRecords.length ? selectedReport.relatedRecords.map((source, index) => <li key={`${source.id}-${index}`} className="border-b border-slate-100 pb-3 text-sm">{toPublicOfficialSourceUrl(source.uri) ? <a href={toPublicOfficialSourceUrl(source.uri)} target="_blank" rel="noreferrer" className="font-medium text-teal-700 hover:underline">{source.title}</a> : <span className="font-medium text-[var(--dai-ink)]">{source.title}</span>}<p className="mt-1 text-xs text-[var(--dai-slate)]">{source.source} {source.date ? `| ${source.date}` : ''}</p></li>) : <li className="text-sm text-[var(--dai-slate)]">No additional related records were found.</li>}</ol></div>}

          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-teal-600)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--color-teal-500)]"><Download className="h-4 w-4" />Download PDF</button>
            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"><Printer className="h-4 w-4" />Print</button>
            <button type="button" onClick={() => void shareReport(selectedReport)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]"><Share2 className="h-4 w-4" />Share Link</button>
            <button type="button" onClick={() => void deleteReport(selectedReport)} className="inline-flex items-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" />Delete</button>
          </div>
          </> : <p className="text-sm text-[var(--dai-slate)]">Select a report to review its saved analysis and sources.</p>}
        </section>
      </div>
    </PageShell>
  );
}
