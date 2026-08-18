import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  Download,
  Filter,
  Flame,
  GitCompareArrows,
  Globe,
  Handshake,
  Landmark,
  MapPinned,
  Scale,
  Search,
  Timer,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageShell } from '@/components/patterns';

type VoteResult = 'Carried' | 'Not Carried';

interface VoteExplorerRow {
  id: string;
  date: string;
  bill: string;
  government: string;
  party: string;
  chamber: 'Dail' | 'Seanad' | 'Joint';
  member: string;
  result: VoteResult;
  margin: number;
  topic: string;
  turnout: number;
  debateDays: number;
  forVotes: number;
  againstVotes: number;
  abstentions: number;
  partyRebellion: boolean;
}

const trendData = [
  { month: 'Feb 23', carried: 6, notCarried: 3 },
  { month: 'Mar 23', carried: 8, notCarried: 4 },
  { month: 'Apr 23', carried: 4, notCarried: 2 },
  { month: 'May 23', carried: 7, notCarried: 3 },
  { month: 'Jun 23', carried: 10, notCarried: 5 },
  { month: 'Jul 23', carried: 22, notCarried: 8 },
  { month: 'Aug 23', carried: 16, notCarried: 6 },
  { month: 'Sep 23', carried: 21, notCarried: 7 },
  { month: 'Oct 23', carried: 9, notCarried: 6 },
  { month: 'Nov 23', carried: 14, notCarried: 5 },
  { month: 'Dec 23', carried: 5, notCarried: 3 },
  { month: 'Jan 24', carried: 11, notCarried: 4 },
  { month: 'Feb 24', carried: 8, notCarried: 2 },
];

const outcomeData = [
  { name: 'Votes Carried', value: 119, color: '#14b8a6' },
  { name: 'Votes Not Carried', value: 60, color: '#ef4444' },
];

const voteRows: VoteExplorerRow[] = [
  {
    id: 'v-001',
    date: '6 Aug 2026',
    bill: 'Online Safety (Amendment) Bill 2026',
    government: 'Current Government',
    party: 'FF',
    chamber: 'Dail',
    member: 'John O Dowd',
    result: 'Carried',
    margin: 6,
    topic: 'Digital Regulation',
    turnout: 72,
    debateDays: 18,
    forVotes: 78,
    againstVotes: 72,
    abstentions: 12,
    partyRebellion: false,
  },
  {
    id: 'v-002',
    date: '5 Aug 2026',
    bill: 'Housing Crisis Motion',
    government: 'Current Government',
    party: 'FG',
    chamber: 'Dail',
    member: 'Claire Kerrane',
    result: 'Not Carried',
    margin: 2,
    topic: 'Housing',
    turnout: 65,
    debateDays: 9,
    forVotes: 45,
    againstVotes: 47,
    abstentions: 29,
    partyRebellion: true,
  },
  {
    id: 'v-003',
    date: '4 Aug 2026',
    bill: 'Climate Action (Amendment) Bill 2026',
    government: 'Current Government',
    party: 'GP',
    chamber: 'Seanad',
    member: 'Mary Lou McDonald',
    result: 'Carried',
    margin: 12,
    topic: 'Climate',
    turnout: 74,
    debateDays: 21,
    forVotes: 81,
    againstVotes: 69,
    abstentions: 8,
    partyRebellion: false,
  },
  {
    id: 'v-004',
    date: '3 Aug 2026',
    bill: 'Public Health (Amendment) Bill 2026',
    government: 'Current Government',
    party: 'LAB',
    chamber: 'Dail',
    member: 'Sean Haughey',
    result: 'Carried',
    margin: 35,
    topic: 'Health',
    turnout: 78,
    debateDays: 26,
    forVotes: 92,
    againstVotes: 57,
    abstentions: 5,
    partyRebellion: false,
  },
  {
    id: 'v-005',
    date: '2 Aug 2026',
    bill: 'SME Tax Relief Motion',
    government: 'Current Government',
    party: 'SF',
    chamber: 'Joint',
    member: 'Richard Boyd Barrett',
    result: 'Not Carried',
    margin: 20,
    topic: 'Economy',
    turnout: 68,
    debateDays: 7,
    forVotes: 49,
    againstVotes: 69,
    abstentions: 16,
    partyRebellion: false,
  },
  {
    id: 'v-006',
    date: '31 Jul 2026',
    bill: 'Education Equality Bill 2026',
    government: 'Previous Government',
    party: 'FF',
    chamber: 'Dail',
    member: 'Ivana Bacik',
    result: 'Carried',
    margin: 4,
    topic: 'Education',
    turnout: 81,
    debateDays: 12,
    forVotes: 71,
    againstVotes: 67,
    abstentions: 17,
    partyRebellion: true,
  },
  {
    id: 'v-007',
    date: '30 Jul 2026',
    bill: 'Transport Emissions Amendment',
    government: 'Current Government',
    party: 'FG',
    chamber: 'Seanad',
    member: 'Brid Smith',
    result: 'Carried',
    margin: 10,
    topic: 'Transport',
    turnout: 70,
    debateDays: 15,
    forVotes: 74,
    againstVotes: 64,
    abstentions: 11,
    partyRebellion: false,
  },
  {
    id: 'v-008',
    date: '29 Jul 2026',
    bill: 'Agriculture Support Package',
    government: 'Previous Government',
    party: 'IND',
    chamber: 'Joint',
    member: 'Michael Healy Rae',
    result: 'Not Carried',
    margin: 1,
    topic: 'Agriculture',
    turnout: 63,
    debateDays: 5,
    forVotes: 53,
    againstVotes: 54,
    abstentions: 31,
    partyRebellion: true,
  },
];

const stageFlow = ['Bill Introduced', 'Debates', 'Committee', 'Amendments', 'Final Vote', 'President'];

const partyAgreementMatrix = [
  { party: 'FF', FF: 100, FG: 82, SF: 47, GP: 71, LAB: 66 },
  { party: 'FG', FF: 82, FG: 100, SF: 44, GP: 69, LAB: 62 },
  { party: 'SF', FF: 47, FG: 44, SF: 100, GP: 48, LAB: 53 },
  { party: 'GP', FF: 71, FG: 69, SF: 48, GP: 100, LAB: 72 },
  { party: 'LAB', FF: 66, FG: 62, SF: 53, GP: 72, LAB: 100 },
];

const representativeProfiles = [
  {
    name: 'John O Dowd',
    attendance: 92,
    votingFrequency: 42,
    partyAgreement: 87,
    governmentAgreement: 78,
    constituencyAgreement: 81,
    heatmap: [
      [3, 1, 0, 2, 3, 2, 1],
      [2, 2, 1, 3, 3, 1, 0],
      [1, 2, 3, 2, 1, 3, 2],
      [0, 1, 2, 3, 1, 2, 3],
    ],
  },
  {
    name: 'Claire Kerrane',
    attendance: 98,
    votingFrequency: 46,
    partyAgreement: 91,
    governmentAgreement: 65,
    constituencyAgreement: 88,
    heatmap: [
      [2, 3, 2, 1, 3, 3, 2],
      [1, 2, 3, 2, 3, 2, 1],
      [3, 2, 1, 3, 2, 1, 2],
      [2, 1, 2, 3, 2, 3, 1],
    ],
  },
  {
    name: 'Sean Haughey',
    attendance: 89,
    votingFrequency: 39,
    partyAgreement: 79,
    governmentAgreement: 84,
    constituencyAgreement: 74,
    heatmap: [
      [1, 1, 2, 3, 2, 1, 2],
      [2, 3, 1, 2, 1, 2, 3],
      [3, 2, 2, 1, 2, 3, 1],
      [2, 3, 1, 2, 3, 1, 2],
    ],
  },
];

const geoRows = [
  { constituency: 'Dublin South-Central', turnout: 92, attendance: 95, govSupport: 68 },
  { constituency: 'Cork North-West', turnout: 87, attendance: 89, govSupport: 71 },
  { constituency: 'Galway West', turnout: 79, attendance: 83, govSupport: 64 },
  { constituency: 'Limerick City', turnout: 75, attendance: 78, govSupport: 59 },
];

const researchShortcuts = [
  'Compare Representatives',
  'Party Voting History',
  'Closest Votes',
  'AI Analysis',
  'Debate Before Vote',
  'Export CSV',
];

const breakdownData = [
  { label: 'Government', value: 84, color: 'bg-emerald-500' },
  { label: 'Opposition', value: 52, color: 'bg-blue-500' },
  { label: 'Independent', value: 68, color: 'bg-amber-500' },
];

const parties = ['all', 'FF', 'FG', 'SF', 'GP', 'LAB', 'IND'];
const chambers = ['all', 'Dail', 'Seanad', 'Joint'];
const results: Array<'all' | VoteResult> = ['all', 'Carried', 'Not Carried'];
const topics = ['all', 'Housing', 'Health', 'Climate', 'Economy', 'Education', 'Transport', 'Digital Regulation', 'Agriculture'];

export default function Voting() {
  const [searchQuery, setSearchQuery] = useState('');
  const [partyFilter, setPartyFilter] = useState('all');
  const [chamberFilter, setChamberFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState<'all' | VoteResult>('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [selectedStage, setSelectedStage] = useState(stageFlow.length - 1);
  const [selectedRepresentative, setSelectedRepresentative] = useState(representativeProfiles[0].name);
  const [compareA, setCompareA] = useState(voteRows[0].bill);
  const [compareB, setCompareB] = useState(voteRows[2].bill);

  const filteredVotes = useMemo(() => {
    return voteRows.filter((vote) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery = !query
        || vote.bill.toLowerCase().includes(query)
        || vote.member.toLowerCase().includes(query)
        || vote.government.toLowerCase().includes(query);
      const matchesParty = partyFilter === 'all' || vote.party === partyFilter;
      const matchesChamber = chamberFilter === 'all' || vote.chamber === chamberFilter;
      const matchesResult = resultFilter === 'all' || vote.result === resultFilter;
      const matchesTopic = topicFilter === 'all' || vote.topic === topicFilter;

      return matchesQuery && matchesParty && matchesChamber && matchesResult && matchesTopic;
    });
  }, [searchQuery, partyFilter, chamberFilter, resultFilter, topicFilter]);

  const closestVote = useMemo(() => {
    return voteRows.reduce((closest, vote) => (vote.margin < closest.margin ? vote : closest), voteRows[0]);
  }, []);

  const controversialVotes = useMemo(() => {
    return voteRows.filter((vote) => vote.margin <= 3 || vote.abstentions >= 20 || vote.partyRebellion);
  }, []);

  const selectedProfile = representativeProfiles.find((profile) => profile.name === selectedRepresentative) || representativeProfiles[0];
  const voteA = voteRows.find((vote) => vote.bill === compareA) || voteRows[0];
  const voteB = voteRows.find((vote) => vote.bill === compareB) || voteRows[2];

  const kpis = [
    { label: 'Total Divisions', value: '179', hint: 'Recent period', icon: Scale, color: 'text-teal-700 bg-teal-50' },
    { label: 'Average Attendance', value: '78%', hint: 'Members per vote', icon: Users, color: 'text-blue-700 bg-blue-50' },
    { label: 'Average Majority Margin', value: '14', hint: 'Votes', icon: Landmark, color: 'text-cyan-700 bg-cyan-50' },
    { label: 'Cross-Party Agreement', value: '63%', hint: 'Session mean', icon: Handshake, color: 'text-emerald-700 bg-emerald-50' },
    { label: 'Closest Vote', value: `${closestVote.forVotes}-${closestVote.againstVotes}`, hint: closestVote.bill, icon: AlertTriangle, color: 'text-rose-700 bg-rose-50' },
    { label: 'Debate-to-Vote Time', value: '14 days', hint: 'Average elapsed time', icon: Timer, color: 'text-indigo-700 bg-indigo-50' },
  ];

  const getCellTone = (value: number) => {
    if (value >= 80) {
      return 'bg-emerald-100 text-emerald-800';
    }
    if (value >= 60) {
      return 'bg-teal-100 text-teal-800';
    }
    if (value >= 50) {
      return 'bg-amber-100 text-amber-800';
    }
    return 'bg-rose-100 text-rose-800';
  };

  return (
    <PageShell>
      <div className="space-y-4">
        <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cyan-700 text-white">
                <Landmark className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-[clamp(1.8rem,2.6vw,2.5rem)] font-semibold tracking-[-0.03em] text-[var(--dai-ink)]">Voting Explorer</h1>
                <p className="text-sm text-[var(--dai-slate)] sm:text-base">
                  Explore how votes are cast, analyze trends, and identify representative behavior across parliamentary divisions.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-[var(--dai-border)] bg-white px-4 text-sm font-medium text-[var(--dai-slate)] shadow-sm transition hover:border-[var(--dai-border)] hover:bg-[var(--dai-muted)]"
            >
              <Search className="h-4 w-4" />
              Advanced Search
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div key={kpi.label} className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-[var(--dai-slate)]">{kpi.label}</p>
                    <p className="mt-1 text-3xl font-semibold leading-none text-[var(--dai-ink)]">{kpi.value}</p>
                    <p className="mt-2 text-xs text-[var(--dai-slate)]">{kpi.hint}</p>
                  </div>
                  <div className={`rounded-xl p-2.5 ${kpi.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.65fr_0.9fr]">
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Voting Trends</h2>
              <span className="text-xs text-[var(--dai-slate)]">Last 24 months</span>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="carried" fill="#14b8a6" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="notCarried" fill="#ef4444" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Votes by Outcome</h2>
              <div className="grid grid-cols-[180px_1fr] items-center gap-2">
                <div className="h-[170px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={outcomeData} dataKey="value" innerRadius={40} outerRadius={70} strokeWidth={0}>
                        {outcomeData.map((slice) => (
                          <Cell key={slice.name} fill={slice.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 text-sm">
                  {outcomeData.map((slice) => (
                    <div key={slice.name} className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                      <span className="font-medium text-[var(--dai-slate)]">{slice.name}</span>
                      <span className="ml-auto text-[var(--dai-slate)]">{slice.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Voting Breakdown</h2>
              <div className="space-y-3">
                {breakdownData.map((item) => (
                  <div key={item.label}>
                    <div className="mb-1 flex items-center justify-between text-xs text-[var(--dai-slate)]">
                      <span>{item.label}</span>
                      <span>{item.value}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-[var(--dai-muted)]">
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.value}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Vote Explorer</h2>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--dai-slate)]" />
                <input
                  value={searchQuery}
                  onKeyDown={(event) => { if(event.key==='Enter') track('voting','search','submit',event.currentTarget.value); }} onKeyDown={(event) => { if(event.key==='Enter') track('voting','search','submit',event.currentTarget.value); }} onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Bill, member, government"
                  className="h-9 w-full rounded-lg border border-[var(--dai-border)] bg-white pl-9 pr-3 text-xs text-[var(--dai-slate)] outline-none ring-cyan-200 transition focus:ring"
                />
              </label>
              <select value={partyFilter} onChange={(event) => { setPartyFilter(event.target.value); track('voting','filter','select',event.target.value); }} className="h-9 rounded-lg border border-[var(--dai-border)] px-3 text-xs text-[var(--dai-slate)]">
                {parties.map((party) => (
                  <option key={party} value={party}>{party === 'all' ? 'All parties' : party}</option>
                ))}
              </select>
              <select value={chamberFilter} onChange={(event) => { setChamberFilter(event.target.value); track('voting','filter','select',event.target.value); }} className="h-9 rounded-lg border border-[var(--dai-border)] px-3 text-xs text-[var(--dai-slate)]">
                {chambers.map((chamber) => (
                  <option key={chamber} value={chamber}>{chamber === 'all' ? 'All chambers' : chamber}</option>
                ))}
              </select>
              <select value={resultFilter} onChange={(event) => { setResultFilter(event.target.value as 'all' | VoteResult); track('voting','filter','select',event.target.value); }} className="h-9 rounded-lg border border-[var(--dai-border)] px-3 text-xs text-[var(--dai-slate)]">
                {results.map((result) => (
                  <option key={result} value={result}>{result === 'all' ? 'All results' : result}</option>
                ))}
              </select>
              <select value={topicFilter} onChange={(event) => { setTopicFilter(event.target.value); track('voting','filter','select',event.target.value); }} className="h-9 rounded-lg border border-[var(--dai-border)] px-3 text-xs text-[var(--dai-slate)]">
                {topics.map((topic) => (
                  <option key={topic} value={topic}>{topic === 'all' ? 'All topics' : topic}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-[var(--dai-border)]">
            <table className="w-full min-w-[980px] border-collapse text-left text-xs">
              <thead className="bg-[var(--dai-muted)] text-[var(--dai-slate)]">
                <tr>
                  <th className="px-3 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Bill</th>
                  <th className="px-3 py-2 font-medium">Government</th>
                  <th className="px-3 py-2 font-medium">Party</th>
                  <th className="px-3 py-2 font-medium">Chamber</th>
                  <th className="px-3 py-2 font-medium">Member</th>
                  <th className="px-3 py-2 font-medium">Result</th>
                  <th className="px-3 py-2 font-medium">Margin</th>
                  <th className="px-3 py-2 font-medium">Topic</th>
                </tr>
              </thead>
              <tbody>
                {filteredVotes.map((vote) => (
                  <tr key={vote.id} className="border-t border-[var(--dai-border)] hover:bg-[var(--dai-muted)]/60">
                    <td className="px-3 py-2 text-[var(--dai-slate)]">{vote.date}</td>
                    <td className="px-3 py-2 font-medium text-[var(--dai-ink)]">{vote.bill}</td>
                    <td className="px-3 py-2 text-[var(--dai-slate)]">{vote.government}</td>
                    <td className="px-3 py-2 text-[var(--dai-slate)]">{vote.party}</td>
                    <td className="px-3 py-2 text-[var(--dai-slate)]">{vote.chamber}</td>
                    <td className="px-3 py-2 text-[var(--dai-slate)]">{vote.member}</td>
                    <td className="px-3 py-2">
                      <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${vote.result === 'Carried' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                        {vote.result}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-[var(--dai-slate)]">{vote.margin}</td>
                    <td className="px-3 py-2 text-[var(--dai-slate)]">{vote.topic}</td>
                  </tr>
                ))}
                {filteredVotes.length === 0 && (
                  <tr>
                    <td className="px-3 py-8 text-center text-[var(--dai-slate)]" colSpan={9}>
                      No votes match these filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Legislative Timeline</h2>
              <div className="flex flex-wrap items-center gap-2">
                {stageFlow.map((stage, index) => (
                  <button
                    key={stage}
                    type="button"
                    onClick={() => setSelectedStage(index)}
                    className={`rounded-xl border px-3 py-2 text-xs font-medium transition ${selectedStage === index ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-[var(--dai-border)] bg-white text-[var(--dai-slate)] hover:bg-[var(--dai-muted)]'}`}
                  >
                    {stage}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-sm text-[var(--dai-slate)]">
                Current spotlight stage: <span className="font-semibold text-[var(--dai-ink)]">{stageFlow[selectedStage]}</span>
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Party Agreement Matrix</h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] border-collapse text-center text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-2 text-left text-[var(--dai-slate)]">Party</th>
                      {['FF', 'FG', 'SF', 'GP', 'LAB'].map((party) => (
                        <th key={party} className="px-2 py-2 text-[var(--dai-slate)]">{party}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {partyAgreementMatrix.map((row) => (
                      <tr key={row.party} className="border-t border-[var(--dai-border)]">
                        <td className="px-2 py-2 text-left font-semibold text-[var(--dai-slate)]">{row.party}</td>
                        {['FF', 'FG', 'SF', 'GP', 'LAB'].map((key) => {
                          const value = row[key as 'FF' | 'FG' | 'SF' | 'GP' | 'LAB'];
                          return (
                            <td key={`${row.party}-${key}`} className="px-2 py-2">
                              <span className={`inline-flex min-w-10 items-center justify-center rounded-md px-2 py-1 font-semibold ${getCellTone(value)}`}>
                                {value}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Representative Voting Profile</h2>
                <select
                  value={selectedRepresentative}
                  onChange={(event) => setSelectedRepresentative(event.target.value)}
                  className="h-8 rounded-lg border border-[var(--dai-border)] px-2 text-xs text-[var(--dai-slate)]"
                >
                  {representativeProfiles.map((profile) => (
                    <option key={profile.name} value={profile.name}>{profile.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg bg-[var(--dai-muted)] p-2"><span className="text-[var(--dai-slate)]">Attendance</span><p className="text-base font-semibold text-[var(--dai-ink)]">{selectedProfile.attendance}%</p></div>
                <div className="rounded-lg bg-[var(--dai-muted)] p-2"><span className="text-[var(--dai-slate)]">Voting Frequency</span><p className="text-base font-semibold text-[var(--dai-ink)]">{selectedProfile.votingFrequency} votes</p></div>
                <div className="rounded-lg bg-[var(--dai-muted)] p-2"><span className="text-[var(--dai-slate)]">Agreement With Party</span><p className="text-base font-semibold text-[var(--dai-ink)]">{selectedProfile.partyAgreement}%</p></div>
                <div className="rounded-lg bg-[var(--dai-muted)] p-2"><span className="text-[var(--dai-slate)]">Agreement With Government</span><p className="text-base font-semibold text-[var(--dai-ink)]">{selectedProfile.governmentAgreement}%</p></div>
                <div className="col-span-2 rounded-lg bg-[var(--dai-muted)] p-2"><span className="text-[var(--dai-slate)]">Constituency Alignment</span><p className="text-base font-semibold text-[var(--dai-ink)]">{selectedProfile.constituencyAgreement}%</p></div>
              </div>
              <div className="mt-3">
                <p className="mb-2 text-xs font-medium text-[var(--dai-slate)]">Voting Heatmap</p>
                <div className="grid grid-cols-7 gap-1">
                  {selectedProfile.heatmap.flatMap((week, weekIndex) => (
                    week.map((value, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`h-5 rounded ${value === 0 ? 'bg-[var(--dai-muted)]' : value === 1 ? 'bg-cyan-200' : value === 2 ? 'bg-cyan-400' : 'bg-cyan-600'}`}
                        title={`Activity intensity: ${value}`}
                      />
                    ))
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Controversial Votes</h2>
              <div className="space-y-2 text-xs">
                {controversialVotes.map((vote) => (
                  <div key={vote.id} className="rounded-lg border border-[var(--dai-border)] p-2">
                    <p className="font-semibold text-[var(--dai-ink)]">{vote.bill}</p>
                    <p className="mt-1 text-[var(--dai-slate)]">Margin: {vote.margin} • Abstentions: {vote.abstentions} • Rebellion: {vote.partyRebellion ? 'Yes' : 'No'}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">Amendment Impact</h2>
            <div className="space-y-2 text-xs text-[var(--dai-slate)]">
              <div className="rounded-lg bg-[var(--dai-muted)] p-2">Original Bill</div>
              <div className="pl-2 text-[var(--dai-slate)]">↓</div>
              <div className="rounded-lg bg-[var(--dai-muted)] p-2">7 Amendments</div>
              <div className="pl-2 text-[var(--dai-slate)]">↓</div>
              <div className="rounded-lg bg-[var(--dai-muted)] p-2">Committee Changes</div>
              <div className="pl-2 text-[var(--dai-slate)]">↓</div>
              <div className="rounded-lg bg-[var(--dai-muted)] p-2">Final Vote (81-69)</div>
              <div className="pl-2 text-[var(--dai-slate)]">↓</div>
              <div className="rounded-lg bg-[var(--dai-muted)] p-2">Public Sentiment +18%</div>
              <div className="pl-2 text-[var(--dai-slate)]">↓</div>
              <div className="rounded-lg bg-emerald-50 p-2 font-semibold text-emerald-800">Passed and Implemented</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-semibold text-[var(--dai-ink)]">AI Insights</h2>
            <div className="space-y-2 text-sm text-[var(--dai-slate)]">
              <p className="rounded-lg bg-cyan-50 p-2">Government support remained stable despite committee revisions.</p>
              <p className="rounded-lg bg-cyan-50 p-2">Opposition support increased after Amendment 12.</p>
              <p className="rounded-lg bg-cyan-50 p-2">{selectedProfile.name} voted against party whip three times this session.</p>
            </div>
            <button type="button" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800">
              Run deeper AI analysis <BrainCircuit className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <GitCompareArrows className="h-4 w-4 text-cyan-700" />
              <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Compare Votes</h2>
            </div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              <select value={compareA} onChange={(event) => setCompareA(event.target.value)} className="h-9 rounded-lg border border-[var(--dai-border)] px-2 text-xs text-[var(--dai-slate)]">
                {voteRows.map((vote) => (
                  <option key={vote.id} value={vote.bill}>{vote.bill}</option>
                ))}
              </select>
              <select value={compareB} onChange={(event) => setCompareB(event.target.value)} className="h-9 rounded-lg border border-[var(--dai-border)] px-2 text-xs text-[var(--dai-slate)]">
                {voteRows.map((vote) => (
                  <option key={vote.id} value={vote.bill}>{vote.bill}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
              <div className="rounded-lg bg-[var(--dai-muted)] p-2">
                <p className="font-semibold text-[var(--dai-ink)]">{voteA.bill}</p>
                <p className="mt-1 text-[var(--dai-slate)]">Result: {voteA.result} • Margin: {voteA.margin}</p>
              </div>
              <div className="rounded-lg bg-[var(--dai-muted)] p-2">
                <p className="font-semibold text-[var(--dai-ink)]">{voteB.bill}</p>
                <p className="mt-1 text-[var(--dai-slate)]">Result: {voteB.result} • Margin: {voteB.margin}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center gap-2">
              <MapPinned className="h-4 w-4 text-cyan-700" />
              <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Geographic View</h2>
            </div>
            <div className="space-y-2">
              {geoRows.map((row) => (
                <div key={row.constituency} className="rounded-lg border border-[var(--dai-border)] p-2 text-xs">
                  <p className="font-semibold text-[var(--dai-ink)]">{row.constituency}</p>
                  <p className="mt-1 text-[var(--dai-slate)]">Turnout {row.turnout}% • Attendance {row.attendance}% • Government support {row.govSupport}%</p>
                </div>
              ))}
            </div>
            <button type="button" className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-cyan-700 hover:text-cyan-800">
              Open constituency map <Globe className="h-4 w-4" />
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[var(--dai-border)] bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center gap-2">
            <Filter className="h-4 w-4 text-cyan-700" />
            <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Research Shortcuts</h2>
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-6">
            {researchShortcuts.map((shortcut) => (
              <button
                key={shortcut}
                type="button"
                className="inline-flex items-center justify-between rounded-xl border border-[var(--dai-border)] bg-white px-3 py-2 text-left text-xs font-medium text-[var(--dai-slate)] transition hover:bg-[var(--dai-muted)]"
              >
                <span>{shortcut}</span>
                {shortcut === 'AI Analysis' ? <BrainCircuit className="h-3.5 w-3.5" /> : shortcut === 'Export CSV' ? <Download className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-4">
          <div className="flex items-start gap-3">
            <Flame className="mt-0.5 h-5 w-5 text-cyan-700" />
            <div>
              <h2 className="text-sm font-semibold text-[var(--dai-ink)]">Legislative Evolution Spotlight</h2>
              <p className="mt-1 text-sm text-[var(--dai-slate)]">Bill Introduced → 12 Debates → 46 Amendments → Sentiment shifted +18% → Government accepted 9 amendments → Passed 81–69 → Implemented.</p>
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}








