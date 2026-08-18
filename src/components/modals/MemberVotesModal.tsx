import { useState, useEffect } from 'react';
import { X, Vote, Calendar, CheckCircle, XCircle, Minus, Eye, ExternalLink } from 'lucide-react';
import { votingDataService, MemberVoteRecord } from '../../services/votingDataService';

interface MemberVotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberCode: string;
  votingAttendance: number;
}

export default function MemberVotesModal({ isOpen, onClose, memberName, memberCode, votingAttendance }: MemberVotesModalProps) {
  const [loading, setLoading] = useState(true);
  const [votes, setVotes] = useState<MemberVoteRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVoteType, setSelectedVoteType] = useState<string>('all');
  const [selectedMemberVote, setSelectedMemberVote] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchMemberVotes();
    }
  }, [isOpen, memberCode]);

  const fetchMemberVotes = async () => {
    setLoading(true);
    try {
      const memberVoteRecords = await votingDataService.getMemberVotingRecords(memberCode);
      setVotes(memberVoteRecords);
    } catch (error) {
      console.error('Error fetching member votes:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVotes = votes.filter(vote => {
    const matchesSearch = vote.voteTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (vote.billTitle && vote.billTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
                         vote.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesVoteType = selectedVoteType === 'all' || vote.voteType === selectedVoteType;
    const matchesMemberVote = selectedMemberVote === 'all' || vote.memberVote === selectedMemberVote;
    return matchesSearch && matchesVoteType && matchesMemberVote;
  });

  const voteTypes = ['all', ...Array.from(new Set(votes.map(vote => vote.voteType)))];
  const memberVoteOptions = ['all', 'yes', 'no', 'abstain', 'absent'];

  const getVoteIcon = (vote: string) => {
    switch (vote) {
      case 'yes': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'no': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'abstain': return <Minus className="w-5 h-5 text-yellow-600" />;
      case 'absent': return <Minus className="w-5 h-5 text-gray-400" />;
      default: return null;
    }
  };

  const getVoteColor = (vote: string) => {
    switch (vote) {
      case 'yes': return 'bg-green-100 text-green-800 border-green-200';
      case 'no': return 'bg-red-100 text-red-800 border-red-200';
      case 'abstain': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'absent': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getResultColor = (result: string) => {
    return result === 'passed' ? 'text-green-600' : 'text-red-600';
  };

  // Calculate voting statistics
  const yesVotes = votes.filter(v => v.memberVote === 'yes').length;
  const noVotes = votes.filter(v => v.memberVote === 'no').length;
  const abstainVotes = votes.filter(v => v.memberVote === 'abstain').length;
  const absentVotes = votes.filter(v => v.memberVote === 'absent').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Vote className="w-6 h-6 text-orange-600" />
                </div>
                Voting Record - {memberName}
              </h2>
              <p className="text-gray-600 mt-1">
                {votes.length} votes recorded • {votingAttendance}% attendance rate
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Voting Statistics */}
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-800">{yesVotes}</div>
              <div className="text-xs text-green-600">Yes Votes</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-lg font-semibold text-red-800">{noVotes}</div>
              <div className="text-xs text-red-600">No Votes</div>
            </div>
            <div className="text-center p-3 bg-yellow-50 rounded-lg">
              <div className="text-lg font-semibold text-yellow-800">{abstainVotes}</div>
              <div className="text-xs text-yellow-600">Abstentions</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-800">{absentVotes}</div>
              <div className="text-xs text-gray-600">Absent</div>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search votes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedVoteType}
              onChange={(e) => setSelectedVoteType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {voteTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            <select
              value={selectedMemberVote}
              onChange={(e) => setSelectedMemberVote(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {memberVoteOptions.map(vote => (
                <option key={vote} value={vote}>
                  {vote === 'all' ? 'All Votes' : vote.charAt(0).toUpperCase() + vote.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-300px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-gray-600">Loading voting record...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredVotes.map((vote) => (
                <div key={vote.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{vote.voteTitle}</h3>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full border ${getVoteColor(vote.memberVote)}`}>
                          {getVoteIcon(vote.memberVote)}
                          <span className="text-xs font-medium uppercase">{vote.memberVote}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(vote.date).toLocaleDateString()}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {vote.voteType}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                          {vote.stage}
                        </span>
                        <span className={`font-medium ${getResultColor(vote.result)}`}>
                          {vote.result.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="text-sm font-medium text-gray-700 mb-3">{vote.billTitle || 'Parliamentary Business'}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => window.open(`/votes/${vote.id}`, '_blank')}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      {vote.billTitle && (
                        <button
                          onClick={() => window.open(`/bills/${vote.billTitle!.replace(/\s+/g, '-').toLowerCase()}`, '_blank')}
                          className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Bill
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Vote Results */}
                  <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-green-700 font-medium">{vote.yesCount} Yes</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <XCircle className="w-4 h-4 text-red-600" />
                      <span className="text-red-700 font-medium">{vote.noCount} No</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Minus className="w-4 h-4 text-yellow-600" />
                      <span className="text-yellow-700 font-medium">{vote.abstainCount} Abstain</span>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {vote.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-gray-700 italic">"{vote.description}"</p>
                </div>
              ))}

              {filteredVotes.length === 0 && (
                <div className="text-center py-12">
                  <Vote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No votes found</h3>
                  <p className="text-gray-600">Try adjusting your search or filter criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}