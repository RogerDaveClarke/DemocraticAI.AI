import { useState, useEffect, useMemo } from 'react';
import { type LegacyColumnDef as ColumnDef } from '@tanstack/react-table/legacy';
import {
  Building,
  ChevronDown,
  Grid2x2,
  List,
  Loader2,
  MapPin,
  Search,
  SlidersHorizontal,
  User,
  Users,
} from 'lucide-react';
import {
  EvidencePanel,
  FilterBar,
  MemberCard,
  PageHeader,
  PageHero,
  ResearchTable,
  SearchToolbar,
  StatusBadge,
  TrustIndicator,
} from '@/components/patterns';
import { API_URL } from '@/config/runtime';

const API_BASE_URL = `${API_URL}/api`;

interface Member {
  memberCode: string;
  fullName: string;
  photoUrl?: string;
  currentParty?: string;
  currentHouse?: string;
  currentConstituency?: string;
  isActive: boolean;
}

interface Party {
  partyCode: string;
  showAs: string;
  memberCount: number;
  imageUrl?: string;
}

interface House {
  houseCode: string;
  houseNo: string;
  showAs: string;
  memberCount: number;
}

interface Constituency {
  representCode: string;
  showAs: string;
  memberCount: number;
}

interface Panel {
  representCode: string;
  showAs: string;
  memberCount: number;
}

interface FiltersData {
  parties: Party[];
  houses: House[];
  constituencies: Constituency[];
  panels: Panel[];
  lastUpdated: string;
}

interface MembersResponse {
  members: Member[];
  total: number;
  hasMore: boolean;
  filters: {
    applied: any;
    available: any;
  };
}

export default function Officials() {
  const [filtersData, setFiltersData] = useState<FiltersData | null>(null);
  const [filtersLoading, setFiltersLoading] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [totalMembers, setTotalMembers] = useState(0);

  const [selectedParty, setSelectedParty] = useState('');
  const [selectedHouse, setSelectedHouse] = useState('');
  const [selectedConstituency, setSelectedConstituency] = useState('');
  const [selectedPanel, setSelectedPanel] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name-asc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        setFiltersLoading(true);
        setError(null);

        const response = await fetch(`${API_BASE_URL}/filters`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: FiltersData = await response.json();
        setFiltersData(data);
      } catch (err) {
        console.error('Error loading filters:', err);
        setError('Failed to load filter options. Please try again.');
      } finally {
        setFiltersLoading(false);
      }
    };

    loadFilters();
  }, []);

  useEffect(() => {
    loadMembers();
  }, [selectedParty, selectedHouse, selectedConstituency, selectedPanel, searchQuery]);

  const loadMembers = async () => {
    try {
      setMembersLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (selectedParty) params.append('party', selectedParty);
      if (selectedHouse) params.append('house', selectedHouse);
      if (selectedConstituency) params.append('constituency', selectedConstituency);
      if (selectedPanel) params.append('panel', selectedPanel);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('active_only', 'true');

      const response = await fetch(`${API_BASE_URL}/members?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: MembersResponse = await response.json();
      setMembers(data.members);
      setTotalMembers(data.total);
    } catch (err) {
      console.error('Error loading members:', err);
      setError('Failed to load members. Please try again.');
    } finally {
      setMembersLoading(false);
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setSelectedMember('');

    switch (filterType) {
      case 'party':
        setSelectedParty(value);
        break;
      case 'house':
        setSelectedHouse(value);
        break;
      case 'constituency':
        setSelectedConstituency(value);
        if (value) setSelectedPanel('');
        break;
      case 'panel':
        setSelectedPanel(value);
        if (value) setSelectedConstituency('');
        break;
      case 'search':
        setSearchQuery(value);
        break;
      default:
        break;
    }
  };

  const clearFilters = () => {
    setSelectedParty('');
    setSelectedHouse('');
    setSelectedConstituency('');
    setSelectedPanel('');
    setSelectedMember('');
    setSearchQuery('');
  };

  const sortedMembers = useMemo(() => {
    const nextMembers = [...members];
    if (sortBy === 'name-desc') {
      nextMembers.sort((left, right) => right.fullName.localeCompare(left.fullName));
    } else {
      nextMembers.sort((left, right) => left.fullName.localeCompare(right.fullName));
    }
    return nextMembers;
  }, [members, sortBy]);

  const getPartyName = (partyCode?: string) => {
    if (!partyCode || !filtersData) return partyCode || 'Unknown';
    const party = filtersData.parties.find((entry) => entry.partyCode === partyCode);
    return party?.showAs || partyCode;
  };

  const getHouseName = (houseCode?: string) => {
    if (!houseCode || !filtersData) return houseCode || 'Unknown';
    const house = filtersData.houses.find((entry) => `${entry.houseCode}-${entry.houseNo}` === houseCode);
    return house?.showAs || houseCode;
  };

  const getConstituencyName = (constituencyCode?: string) => {
    if (!constituencyCode || !filtersData) return constituencyCode || 'Unknown';
    const constituency = filtersData.constituencies.find((entry) => entry.representCode === constituencyCode);
    return constituency?.showAs || constituencyCode;
  };

  const listColumns = useMemo<ColumnDef<Member>[]>(() => {
    return [
      {
        accessorKey: 'fullName',
        header: 'Official',
        cell: ({ row }) => {
          const member = row.original;
          return (
            <div className="flex min-w-[240px] items-center gap-3">
              {member.photoUrl ? (
                <img
                  src={member.photoUrl}
                  alt={member.fullName}
                  className="h-10 w-10 rounded-full object-cover ring-1 ring-slate-200"
                  onError={(event) => {
                    event.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200">
                  <User className="h-5 w-5 text-[var(--dai-slate)]" />
                </div>
              )}
              <div className="min-w-0">
                <p className="truncate font-medium text-[var(--dai-ink)]">{member.fullName}</p>
                <p className="truncate text-xs text-[var(--dai-slate)]">{member.memberCode}</p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'party',
        header: 'Party',
        accessorFn: (member) => getPartyName(member.currentParty),
        cell: ({ getValue }) => <span className="text-sm text-[var(--dai-slate)]">{String(getValue())}</span>,
      },
      {
        id: 'chamber',
        header: 'Chamber',
        accessorFn: (member) => getHouseName(member.currentHouse),
        cell: ({ getValue }) => <span className="text-sm text-[var(--dai-slate)]">{String(getValue())}</span>,
      },
      {
        id: 'constituency',
        header: 'Constituency',
        accessorFn: (member) => getConstituencyName(member.currentConstituency),
        cell: ({ getValue }) => <span className="text-sm text-[var(--dai-slate)]">{String(getValue())}</span>,
      },
      {
        accessorKey: 'isActive',
        header: 'Status',
        cell: ({ row }) => <StatusBadge status={row.original.isActive ? 'active' : 'inactive'} label={row.original.isActive ? 'Active' : 'Inactive'} />,
      },
    ];
  }, [filtersData]);

  if (filtersLoading) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg bg-white p-8 shadow">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              <span className="ml-2 text-lg text-slate-600">Loading filters...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-lg bg-white p-8 shadow">
            <div className="py-12 text-center">
              <div className="mb-2 text-lg font-medium text-red-600">Error</div>
              <div className="mb-4 text-gray-600">{error}</div>
              <button
                onClick={() => window.location.reload()}
                aria-label="Perform action"
                className="rounded-lg bg-[var(--color-teal-600)] px-4 py-2 text-white hover:bg-[var(--color-teal-500)]"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] overflow-x-hidden bg-slate-50 px-4 py-4 lg:px-6">
      <div className="mx-auto max-w-[1240px] space-y-4">
        <PageHero
          title="Elected Officials"
          subtitle="Browse members of Dáil Éireann and Seanad Éireann."
          icon={Users}
          question="Who represents the public, and which official records support that profile?"
          rightMeta={filtersData?.lastUpdated ? `Last updated: ${new Date(filtersData.lastUpdated).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : undefined}
        />

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <TrustIndicator label="Source grounded" detail="Directory fields come directly from official Oireachtas member records." />
          <TrustIndicator label="No AI inference" detail="This page is a factual directory; it does not rank or infer intent." />
          <TrustIndicator label="Verifiable" detail="Party, chamber, and constituency values can be checked against source records." />
        </div>

        <FilterBar className="rounded-2xl bg-white/95 backdrop-blur">
          <SearchToolbar
            value={searchQuery}
            onChange={(value) => handleFilterChange('search', value)}
            placeholder="Search by name, party or constituency..."
            rightSlot={(
              <button
                onClick={clearFilters}
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-[var(--dai-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--dai-slate)] shadow-sm transition hover:border-[var(--dai-border)] hover:bg-slate-100"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Clear Filters
              </button>
            )}
          />

          <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-12 xl:items-end">
            <div className="xl:col-span-4">
              <p className="mb-2 text-sm font-medium text-[var(--dai-slate)]">Filter by parliamentary metadata</p>
              <p className="text-sm text-[var(--dai-slate)]">Combine party, chamber, constituency, and panel filters to narrow official records.</p>
            </div>

            <div className="xl:col-span-2">
              <label htmlFor="party" className="mb-2 block text-sm font-medium text-[var(--dai-slate)]"><Users className="mr-1 inline h-4 w-4" />Party</label>
              <div className="relative">
                <select id="party" value={selectedParty} onChange={(event) => handleFilterChange('party', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-[var(--dai-border)] bg-white px-4 pr-10 text-sm text-[var(--dai-slate)] outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100">
                  <option value="">All Parties</option>
                  {filtersData?.parties.map((party) => <option key={party.partyCode} value={party.partyCode}>{party.showAs}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dai-slate)]" />
              </div>
            </div>

            <div className="xl:col-span-2">
              <label htmlFor="house" className="mb-2 block text-sm font-medium text-[var(--dai-slate)]"><Building className="mr-1 inline h-4 w-4" />Chamber</label>
              <div className="relative">
                <select id="house" value={selectedHouse} onChange={(event) => handleFilterChange('house', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-[var(--dai-border)] bg-white px-4 pr-10 text-sm text-[var(--dai-slate)] outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100">
                  <option value="">All Chambers</option>
                  <option value="dail">Dáil Éireann</option>
                  <option value="seanad">Seanad Éireann</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dai-slate)]" />
              </div>
            </div>

            <div className="xl:col-span-2">
              <label htmlFor="constituency" className="mb-2 block text-sm font-medium text-[var(--dai-slate)]"><MapPin className="mr-1 inline h-4 w-4" />Constituency</label>
              <div className="relative">
                <select id="constituency" value={selectedConstituency} onChange={(event) => handleFilterChange('constituency', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-[var(--dai-border)] bg-white px-4 pr-10 text-sm text-[var(--dai-slate)] outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100">
                  <option value="">All Constituencies</option>
                  {filtersData?.constituencies.map((constituency) => <option key={constituency.representCode} value={constituency.representCode}>{constituency.showAs}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dai-slate)]" />
              </div>
            </div>

            <div className="xl:col-span-2">
              <label htmlFor="panel" className="mb-2 block text-sm font-medium text-[var(--dai-slate)]"><Users className="mr-1 inline h-4 w-4" />Panel</label>
              <div className="relative">
                <select id="panel" value={selectedPanel} onChange={(event) => handleFilterChange('panel', event.target.value)} className="h-12 w-full appearance-none rounded-xl border border-[var(--dai-border)] bg-white px-4 pr-10 text-sm text-[var(--dai-slate)] outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100">
                  <option value="">All Panels</option>
                  {filtersData?.panels.map((panel) => <option key={panel.representCode} value={panel.representCode}>{panel.showAs}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dai-slate)]" />
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-col gap-3 border-t border-[var(--dai-border)] pt-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="text-sm text-[var(--dai-slate)]">
              {membersLoading ? (
                <div className="flex items-center">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin text-teal-600" />
                  Loading members...
                </div>
              ) : (
                <>
                  Showing {members.length} of {totalMembers.toLocaleString()} members
                  {(selectedParty || selectedHouse || selectedConstituency || selectedPanel || searchQuery) ? <span className="text-teal-700"> (filtered)</span> : null}
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 text-sm text-[var(--dai-slate)]">
                <span>Sort by</span>
                <div className="relative">
                  <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="h-10 appearance-none rounded-xl border border-[var(--dai-border)] bg-white px-4 pr-10 text-sm text-[var(--dai-slate)] outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100">
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--dai-slate)]" />
                </div>
              </div>

              <div className="inline-flex rounded-xl border border-[var(--dai-border)] bg-white p-1 shadow-sm">
                <button type="button" onClick={() => setViewMode('grid')} className={`rounded-lg p-2 transition ${viewMode === 'grid' ? 'bg-[var(--color-teal-600)] text-white' : 'text-[var(--dai-slate)] hover:bg-slate-100'}`} aria-label="Grid view">
                  <Grid2x2 className="h-4 w-4" />
                </button>
                <button type="button" onClick={() => setViewMode('list')} className={`rounded-lg p-2 transition ${viewMode === 'list' ? 'bg-[var(--color-teal-600)] text-white' : 'text-[var(--dai-slate)] hover:bg-slate-100'}`} aria-label="List view">
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </FilterBar>

        <PageHeader
          title="Directory results"
          subtitle="Use grid view for quick profile scanning and list view for structured comparison."
        />

        {membersLoading ? null : members.length > 0 ? (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                {sortedMembers.map((member) => (
                  <MemberCard
                    key={member.memberCode}
                    id={member.memberCode}
                    name={member.fullName}
                    party={getPartyName(member.currentParty)}
                    chamber={getHouseName(member.currentHouse)}
                    constituency={member.currentConstituency ? getConstituencyName(member.currentConstituency) : undefined}
                    photoUrl={member.photoUrl}
                    selected={selectedMember === member.memberCode}
                    onSelect={(id) => setSelectedMember(selectedMember === id ? '' : id)}
                  />
                ))}
              </div>
            ) : (
              <ResearchTable columns={listColumns} data={sortedMembers} className="px-1" initialPageSize={20} pageSizeOptions={[20, 40, 60]} />
            )}
          </>
        ) : (
          <div className="rounded-2xl border border-[var(--dai-border)] bg-white py-16 text-center shadow-sm">
            <Search className="mx-auto mb-4 h-12 w-12 text-[var(--dai-slate)]" />
            <p className="text-lg font-medium text-[var(--dai-slate)]">No members found</p>
            <p className="mt-2 text-sm text-[var(--dai-slate)]">
              {(selectedParty || selectedHouse || selectedConstituency || selectedPanel || searchQuery) ? 'Try adjusting your filters' : 'Select filters to view officials'}
            </p>
          </div>
        )}

        <EvidencePanel
          points={[
            'Official records remain authoritative for member identity and parliamentary role.',
            'Filtering logic narrows records only by published parliamentary metadata.',
            'No behavioral ranking or sentiment scoring is applied in this directory.',
          ]}
          limitation="Data freshness depends on source publication schedules."
        />
      </div>
    </div>
  );
}

