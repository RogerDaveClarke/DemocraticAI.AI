import { useMemo, useState } from 'react';
import { track } from '@/utils/analytics';
import {
  CalendarDays,
  Eye,
  Filter,
  LineChart,
  ListChecks,
  Shield,
  Sparkles,
  Users,
} from 'lucide-react';
import {
  EvidencePanel,
  FilterBar,
  InsightCard,
  PageHero,
  PageMetric,
  SearchToolbar,
  TrustIndicator,
} from '@/components/patterns';

interface MinisterCard {
  id: string;
  name: string;
  party: string;
  position: string;
  constituency: string;
  avatarUrl?: string;
  initials: string;
  communicationStyle: 'Diplomatic' | 'Direct' | 'Technical';
  politicalPosition: 'Centre' | 'Centre-Right';
  emotionalSignal: 'Confidence' | 'Determination' | 'Caution';
  votingConsistency: number;
  popularityRating: number;
  mediaPresence: number;
  yearsInOffice: number;
  billsSponsored: number;
  influenceScore: number;
  policyDomains: string[];
}

const ministerCards: MinisterCard[] = [
  {
    id: 'micheal-martin',
    name: 'Micheal Martin TD',
    party: 'Fianna Fail',
    position: 'Tanaiste\nMinister for Foreign Affairs and Trade',
    constituency: 'Cork South-Central',
    initials: 'MM',
    communicationStyle: 'Diplomatic',
    politicalPosition: 'Centre',
    emotionalSignal: 'Confidence',
    votingConsistency: 89,
    popularityRating: 71,
    mediaPresence: 92,
    yearsInOffice: 35,
    billsSponsored: 47,
    influenceScore: 98,
    policyDomains: ['Government Leadership', 'International Relations', 'Economic Policy', 'Public Health'],
  },
  {
    id: 'simon-harris',
    name: 'Simon Harris TD',
    party: 'Fine Gael',
    position: 'Tanaiste and Minister for Foreign Affairs and Trade;\nand Minister for Defence',
    constituency: 'Wicklow',
    avatarUrl: 'https://data.oireachtas.ie/ie/oireachtas/member/id/Simon-Harris.D.2011-03-09/image/thumb',
    initials: 'SH',
    communicationStyle: 'Direct',
    politicalPosition: 'Centre-Right',
    emotionalSignal: 'Determination',
    votingConsistency: 92,
    popularityRating: 73,
    mediaPresence: 85,
    yearsInOffice: 14,
    billsSponsored: 31,
    influenceScore: 91,
    policyDomains: ['Foreign Affairs', 'Defence', 'Trade', 'International Security'],
  },
  {
    id: 'paschal-donohoe',
    name: 'Paschal Donohoe TD',
    party: 'Fine Gael',
    position: 'Minister for Finance',
    constituency: 'Dublin Central',
    initials: 'PD',
    communicationStyle: 'Technical',
    politicalPosition: 'Centre-Right',
    emotionalSignal: 'Caution',
    votingConsistency: 95,
    popularityRating: 68,
    mediaPresence: 82,
    yearsInOffice: 14,
    billsSponsored: 24,
    influenceScore: 89,
    policyDomains: ['Fiscal Policy', 'Banking', 'Taxation', 'EU Economic Affairs'],
  },
];

const styleTone: Record<MinisterCard['communicationStyle'], string> = {
  Diplomatic: 'bg-blue-50 text-blue-700',
  Direct: 'bg-emerald-50 text-emerald-700',
  Technical: 'bg-violet-50 text-violet-700',
};

const domainTone: Record<MinisterCard['communicationStyle'], string> = {
  Diplomatic: 'bg-blue-100 text-blue-700',
  Direct: 'bg-emerald-100 text-emerald-700',
  Technical: 'bg-violet-100 text-violet-700',
};

const cardHeaderTone: Record<MinisterCard['communicationStyle'], string> = {
  Diplomatic: 'from-blue-50 via-slate-50 to-blue-100',
  Direct: 'from-emerald-50 via-cyan-50 to-emerald-100',
  Technical: 'from-violet-50 via-slate-50 to-violet-100',
};

const shortcutCards = [
  { title: 'Compare Ministers', subtitle: 'Compare profiles and metrics', icon: Users },
  { title: 'Portfolio Overview', subtitle: 'See all ministerial portfolios', icon: Shield },
  { title: 'Timeline', subtitle: 'Key events and milestones', icon: ListChecks },
  { title: 'Performance Trends', subtitle: 'Track metrics over time', icon: LineChart },
  { title: 'AI Insights', subtitle: 'AI-powered analysis', icon: Sparkles },
];

function MetricBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-[var(--dai-slate)]">{label}</span>
        <span className="font-semibold text-[var(--dai-slate)]">{value}/100</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--dai-muted)]">
        <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function Personas() {
  const [searchTerm, setSearchTerm] = useState('');
  const [partyFilter, setPartyFilter] = useState('all');

  const parties = useMemo(() => ['all', ...Array.from(new Set(ministerCards.map((minister) => minister.party)))], []);

  const visibleMinisters = useMemo(() => {
    return ministerCards.filter((minister) => {
      const query = searchTerm.trim().toLowerCase();
      const matchesQuery = !query
        || minister.name.toLowerCase().includes(query)
        || minister.position.toLowerCase().includes(query)
        || minister.policyDomains.some((domain) => domain.toLowerCase().includes(query));
      const matchesParty = partyFilter === 'all' || minister.party === partyFilter;
      return matchesQuery && matchesParty;
    });
  }, [searchTerm, partyFilter]);

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f9fd] px-4 py-4 lg:px-6">
      <div className="mx-auto max-w-[1280px] space-y-4">
        <PageHero
          title="Ministerial Personas"
          subtitle="Comprehensive profiles and data cards for Irish government ministers."
          icon={Users}
          question="How do ministerial roles, policy domains, and public-facing signals differ across the current cabinet?"
        />

        <FilterBar>
          <SearchToolbar
            value={searchTerm}
            onChange={setSearchTerm}
            onBlur={(v) => { if(v.trim()) track('personas','search','submit',v.trim()); }}
            placeholder="Search ministers, positions, or keywords..."
            rightSlot={(
              <label className="relative block min-w-[220px]">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dai-slate)]" />
                <select
                  value={partyFilter}
                  onChange={(event) => { setPartyFilter(event.target.value); track('personas','filter','select',event.target.value); }}
                  className="h-11 w-full appearance-none rounded-xl border border-[var(--dai-border)] bg-white pl-10 pr-3 text-sm text-[var(--dai-slate)] outline-none ring-cyan-200 transition focus:ring"
                >
                  {parties.map((party) => (
                    <option key={party} value={party}>{party === 'all' ? 'All Parties' : party}</option>
                  ))}
                </select>
              </label>
            )}
          />
        </FilterBar>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <TrustIndicator label="Source grounded" detail="Profile metadata maps to official office and constituency records." />
          <TrustIndicator label="Human review needed" detail="Communication and emotional labels are interpretive summaries, not official facts." />
          <TrustIndicator label="Contestable" detail="Profiles should be challenged against transcripts, voting records, and source citations." />
        </div>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {visibleMinisters.map((minister) => (
            <article key={minister.id} className="overflow-hidden rounded-2xl border border-[var(--dai-border)] bg-white shadow-sm">
              <div className={`relative bg-gradient-to-br ${cardHeaderTone[minister.communicationStyle]} p-6`}>
                <span className={`absolute right-4 top-4 rounded-full px-2.5 py-1 text-xs font-semibold ${styleTone[minister.communicationStyle]}`}>
                  {minister.communicationStyle}
                </span>
                <div className="mx-auto h-20 w-20 overflow-hidden rounded-full bg-white ring-1 ring-slate-200">
                  {minister.avatarUrl ? (
                    <img src={minister.avatarUrl} alt={minister.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-indigo-600">{minister.initials}</div>
                  )}
                </div>
              </div>

              <div className="space-y-4 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-[1.6rem] font-semibold tracking-[-0.03em] text-[var(--dai-ink)]">{minister.name}</h3>
                    <p className="mt-1 whitespace-pre-line text-sm font-medium text-cyan-700">{minister.position}</p>
                  </div>
                  <button type="button" className="rounded-full p-1.5 text-[var(--dai-slate)] transition hover:bg-[var(--dai-muted)]">
                    <Eye className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--dai-slate)]">
                  <span>{minister.constituency}</span>
                  <span>�</span>
                  <span>{minister.party}</span>
                </div>

                <div className="flex items-center gap-4 text-xs">
                  <span className="text-indigo-700">{minister.politicalPosition}</span>
                  <span className="text-rose-600">{minister.emotionalSignal}</span>
                </div>

                <div className="space-y-2.5">
                  <MetricBar label="Voting Consistency" value={minister.votingConsistency} />
                  <MetricBar label="Popularity Rating" value={minister.popularityRating} />
                  <MetricBar label="Media Presence" value={minister.mediaPresence} />
                </div>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <PageMetric label="Years" value={minister.yearsInOffice} />
                  <PageMetric label="Bills" value={minister.billsSponsored} />
                  <PageMetric label="Influence" value={minister.influenceScore} />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--dai-slate)]">Policy Domains</p>
                  <div className="flex flex-wrap gap-1.5">
                    {minister.policyDomains.map((domain) => (
                      <span key={`${minister.id}-${domain}`} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${domainTone[minister.communicationStyle]}`}>
                        {domain}
                      </span>
                    ))}
                  </div>
                </div>

                <button type="button" className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--dai-border)] bg-white text-sm font-semibold text-cyan-700 transition hover:bg-[var(--dai-muted)]">
                  <Eye className="h-4 w-4" /> View Full Profile
                </button>
              </div>
            </article>
          ))}
        </section>

        {visibleMinisters.length === 0 && (
          <section className="rounded-2xl border border-[var(--dai-border)] bg-white px-6 py-14 text-center">
            <p className="text-lg font-semibold text-[var(--dai-slate)]">No ministers match your filters.</p>
            <p className="mt-1 text-sm text-[var(--dai-slate)]">Try a broader search term or switch party filter to All Parties.</p>
          </section>
        )}

        <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-3 shadow-sm">
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
            {shortcutCards.map((shortcut) => {
              return (
                <InsightCard key={shortcut.title} title={shortcut.title} subtitle={shortcut.subtitle} icon={shortcut.icon} />
              );
            })}
          </div>
        </section>

        <EvidencePanel
          title="Evidence expectations for this page"
          points={[
            'Cabinet role and constituency should be verifiable against official Oireachtas records.',
            'Voting, media, and influence metrics must include clear provenance in deeper profile views.',
            'Policy-domain tags are summaries and should link to supporting source material.',
          ]}
          limitation="Persona traits are directional and should not be used as definitive assessments."
        />

        <footer className="flex flex-col gap-2 border-t border-[var(--dai-border)] pb-2 pt-1 text-xs text-[var(--dai-slate)] md:flex-row md:items-center md:justify-between">
          <div className="inline-flex items-center gap-2">
            <CalendarDays className="h-3.5 w-3.5" />
            <span>Data sourced from Oireachtas API</span>
            <span>�</span>
            <span>Updates daily</span>
          </div>
          <div className="inline-flex items-center gap-4">
            <button type="button" className="hover:text-[var(--dai-slate)]">About the data</button>
            <button type="button" className="hover:text-[var(--dai-slate)]">Provide feedback</button>
          </div>
        </footer>
      </div>
    </div>
  );
}



