import { useState, useEffect } from 'react';
import { X, Users, Search, TrendingUp, MessageSquare, Vote, Calendar } from 'lucide-react';
import MemberSpeechesModal from './MemberSpeechesModal';
import MemberVotesModal from './MemberVotesModal';

interface MemberInsight {
  memberCode: string;
  fullName: string;
  party: string;
  photoUrl?: string;
  activityScore: number;
  totalSpeeches: number;
  questionsAsked: number;
  votingAttendance: number;
  topTopics: string[];
  recentActivity: string;
  trendingScore: number;
  weeklyChange: number;
}

interface MemberInsightsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemberInsightsModal({ isOpen, onClose }: MemberInsightsModalProps) {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'activity' | 'speeches' | 'questions' | 'attendance'>('activity');
  const [members, setMembers] = useState<MemberInsight[]>([]);
  const [parties, setParties] = useState<string[]>([]);
  const [speechesModal, setSpeechesModal] = useState<{
    isOpen: boolean;
    memberName: string;
    memberCode: string;
    totalSpeeches: number;
  }>({
    isOpen: false,
    memberName: '',
    memberCode: '',
    totalSpeeches: 0
  });
  const [votesModal, setVotesModal] = useState<{
    isOpen: boolean;
    memberName: string;
    memberCode: string;
    votingAttendance: number;
  }>({
    isOpen: false,
    memberName: '',
    memberCode: '',
    votingAttendance: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchMemberInsights();
    }
  }, [isOpen, selectedParty, sortBy]);

  useEffect(() => {
    if (isOpen && searchTerm) {
      const debounceTimer = setTimeout(() => {
        fetchMemberInsights();
      }, 500);
      return () => clearTimeout(debounceTimer);
    }
  }, [searchTerm]);

  const fetchMemberInsights = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedParty && selectedParty !== 'all') params.append('party', selectedParty);
      if (searchTerm) params.append('search', searchTerm);
      if (sortBy) params.append('sortBy', sortBy === 'activity' ? 'activityScore' : sortBy);
      params.append('sortOrder', 'desc');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/member-insights?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setMembers(result.data.members);
        setParties(result.data.filters.parties);
      } else {
        throw new Error(result.error || 'Failed to fetch member insights');
      }
    } catch (error) {
      console.error('Error fetching member insights:', error);
      // Fallback to mock data
      const mockMembers = generateMockMemberInsights();
      const uniqueParties = Array.from(new Set(mockMembers.map(m => m.party)));
      
      setMembers(mockMembers);
      setParties(uniqueParties);
    } finally {
      setLoading(false);
    }
  };

  const generateMockMemberInsights = (): MemberInsight[] => {
    const parties = ['Fine Gael', 'Fianna Fáil', 'Sinn Féin', 'Labour Party', 'Green Party', 'Social Democrats'];
    const topics = ['Housing', 'Healthcare', 'Education', 'Environment', 'Economy', 'Justice', 'Transport'];
    
    return Array.from({ length: 20 }, (_, i) => ({
      memberCode: `member_${i + 1}`,
      fullName: `TD ${String.fromCharCode(65 + i)} O'Connor`,
      party: parties[Math.floor(Math.random() * parties.length)],
      photoUrl: `https://via.placeholder.com/60x60/4A90E2/FFFFFF?text=${String.fromCharCode(65 + i)}`,
      activityScore: Math.floor(Math.random() * 40) + 60,
      totalSpeeches: Math.floor(Math.random() * 50) + 10,
      questionsAsked: Math.floor(Math.random() * 30) + 5,
      votingAttendance: Math.floor(Math.random() * 20) + 80,
      topTopics: topics.slice(0, Math.floor(Math.random() * 3) + 2),
      recentActivity: ['Spoke on housing bill', 'Asked question about healthcare', 'Voted on climate legislation'][Math.floor(Math.random() * 3)],
      trendingScore: Math.floor(Math.random() * 30) + 70,
      weeklyChange: (Math.random() - 0.5) * 20
    }));
  };

  const filteredAndSortedMembers = members
    .filter(member => 
      member.fullName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (selectedParty === 'all' || member.party === selectedParty)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'activity': return b.activityScore - a.activityScore;
        case 'speeches': return b.totalSpeeches - a.totalSpeeches;
        case 'questions': return b.questionsAsked - a.questionsAsked;
        case 'attendance': return b.votingAttendance - a.votingAttendance;
        default: return 0;
      }
    });

  const getPartyColor = (party: string) => {
    const colors: { [key: string]: string } = {
      'Fine Gael': 'bg-blue-100 text-blue-800',
      'Fianna Fáil': 'bg-green-100 text-green-800',
      'Sinn Féin': 'bg-orange-100 text-orange-800',
      'Labour Party': 'bg-red-100 text-red-800',
      'Green Party': 'bg-emerald-100 text-emerald-800',
      'Social Democrats': 'bg-purple-100 text-purple-800'
    };
    return colors[party] || 'bg-gray-100 text-gray-800';
  };

  const openSpeechesModal = (member: MemberInsight) => {
    setSpeechesModal({
      isOpen: true,
      memberName: member.fullName,
      memberCode: member.memberCode,
      totalSpeeches: member.totalSpeeches
    });
  };

  const closeSpeechesModal = () => {
    setSpeechesModal({
      isOpen: false,
      memberName: '',
      memberCode: '',
      totalSpeeches: 0
    });
  };

  const openVotesModal = (member: MemberInsight) => {
    setVotesModal({
      isOpen: true,
      memberName: member.fullName,
      memberCode: member.memberCode,
      votingAttendance: member.votingAttendance
    });
  };

  const closeVotesModal = () => {
    setVotesModal({
      isOpen: false,
      memberName: '',
      memberCode: '',
      votingAttendance: 0
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                Member Insights
              </h2>
              <p className="text-gray-600 mt-1">
                AI-generated summaries of individual member activities and engagement patterns
              </p>
            </div>
            <button
              onClick={onClose} aria-label="Close dialog"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            ><X className="w-6 h-6" />
            </button>
          </div>
          
          {/* Filters */}
          <div className="mt-4 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-gray-500" />
              <label htmlFor="input-jpp127n5i" className="sr-only">Search members...</label>
<input
                type="text"
                id="input-jpp127n5i" placeholder="Search members..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
            
            <select
              value={selectedParty}
              onChange={(e) => setSelectedParty(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="all">All Parties</option>
              {parties.map(party => (
                <option key={party} value={party}>{party}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="activity">Sort by Activity Score</option>
              <option value="speeches">Sort by Speeches</option>
              <option value="questions">Sort by Questions</option>
              <option value="attendance">Sort by Attendance</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Analyzing member data...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedMembers.map((member, index) => (
                <div key={member.memberCode} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-12 h-12 bg-purple-600 text-white text-lg font-bold rounded-full">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{member.fullName}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPartyColor(member.party)}`}>
                              {member.party}
                            </span>
                            <span className="text-sm text-gray-600">
                              Activity Score: {member.activityScore}/100
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-purple-600 font-medium">
                            <TrendingUp className="w-4 h-4" />
                            {member.trendingScore.toFixed(1)}
                          </div>
                          <p className="text-xs text-gray-500">
                            {member.weeklyChange >= 0 ? '+' : ''}{member.weeklyChange.toFixed(1)}% this week
                          </p>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <button 
                          onClick={() => openSpeechesModal(member)}
                          className="text-center p-3 bg-white rounded-lg hover:bg-blue-50 hover:border-blue-200 border border-gray-200 transition-colors cursor-pointer group"
                        >
                          <MessageSquare className="w-5 h-5 text-blue-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                          <div className="text-lg font-semibold text-gray-900">{member.totalSpeeches}</div>
                          <div className="text-xs text-gray-600">Speeches</div>
                          <div className="text-xs text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">Click to view</div>
                        </button>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <MessageSquare className="w-5 h-5 text-green-600 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-gray-900">{member.questionsAsked}</div>
                          <div className="text-xs text-gray-600">Questions</div>
                        </div>
                        <button 
                          onClick={() => openVotesModal(member)}
                          className="text-center p-3 bg-white rounded-lg hover:bg-orange-50 hover:border-orange-200 border border-gray-200 transition-colors cursor-pointer group"
                        >
                          <Vote className="w-5 h-5 text-orange-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                          <div className="text-lg font-semibold text-gray-900">{member.votingAttendance}%</div>
                          <div className="text-xs text-gray-600">Attendance</div>
                          <div className="text-xs text-orange-600 opacity-0 group-hover:opacity-100 transition-opacity">Click to view</div>
                        </button>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-gray-900">Active</div>
                          <div className="text-xs text-gray-600">Status</div>
                        </div>
                      </div>

                      {/* Top Topics */}
                      <div className="mb-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Top Discussion Topics:</h4>
                        <div className="flex flex-wrap gap-1">
                          {member.topTopics.map((topic) => (
                            <span
                              key={topic}
                              className="px-2 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Recent Activity */}
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Recent Activity:</span> {member.recentActivity}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {filteredAndSortedMembers.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No members found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Components */}
      <MemberSpeechesModal
        isOpen={speechesModal.isOpen}
        onClose={closeSpeechesModal}
        memberName={speechesModal.memberName}
        memberCode={speechesModal.memberCode}
        totalSpeeches={speechesModal.totalSpeeches}
      />

      <MemberVotesModal
        isOpen={votesModal.isOpen}
        onClose={closeVotesModal}
        memberName={votesModal.memberName}
        memberCode={votesModal.memberCode}
        votingAttendance={votesModal.votingAttendance}
      />
    </div>
  );
}