import { useState, useEffect } from 'react';
import { X, MessageSquare, Calendar, Clock, Eye, ExternalLink } from 'lucide-react';

interface Speech {
  id: string;
  date: string;
  debateTitle: string;
  speechTitle: string;
  duration: string;
  wordCount: number;
  excerpt: string;
  fullText: string;
  debateType: string;
  chamber: string;
  topics: string[];
}

interface MemberSpeechesModalProps {
  isOpen: boolean;
  onClose: () => void;
  memberName: string;
  memberCode: string;
  totalSpeeches: number;
}

export default function MemberSpeechesModal({ isOpen, onClose, memberName, memberCode, totalSpeeches }: MemberSpeechesModalProps) {
  const [loading, setLoading] = useState(true);
  const [speeches, setSpeeches] = useState<Speech[]>([]);
  const [expandedSpeech, setExpandedSpeech] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');

  useEffect(() => {
    if (isOpen) {
      fetchMemberSpeeches();
    }
  }, [isOpen, memberCode]);

  const fetchMemberSpeeches = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockSpeeches: Speech[] = [
        {
          id: 'speech-001',
          date: '2024-10-18',
          debateTitle: 'Housing Crisis Response',
          speechTitle: 'Emergency Housing Measures',
          duration: '12:34',
          wordCount: 1247,
          excerpt: 'The housing crisis requires immediate and decisive action. We cannot continue to fail our citizens who are struggling to find affordable accommodation...',
          fullText: 'The housing crisis requires immediate and decisive action. We cannot continue to fail our citizens who are struggling to find affordable accommodation. This government has a moral obligation to address the root causes of this crisis, not just treat the symptoms. We need comprehensive reform of our planning system, increased social housing construction, and immediate support for first-time buyers.',
          debateType: 'Emergency Session',
          chamber: 'Dáil Éireann',
          topics: ['Housing', 'Social Policy', 'Crisis Response']
        },
        {
          id: 'speech-002',
          date: '2024-10-15',
          debateTitle: 'Climate Action Bill 2024',
          speechTitle: 'Renewable Energy Transition',
          duration: '8:21',
          wordCount: 823,
          excerpt: 'Ireland has an opportunity to lead Europe in renewable energy transition. Our offshore wind potential is enormous, and we must capitalize on this advantage...',
          fullText: 'Ireland has an opportunity to lead Europe in renewable energy transition. Our offshore wind potential is enormous, and we must capitalize on this advantage to create jobs and achieve our climate targets.',
          debateType: 'Second Stage',
          chamber: 'Dáil Éireann',
          topics: ['Climate Change', 'Energy', 'Environment']
        },
        {
          id: 'speech-003',
          date: '2024-10-12',
          debateTitle: 'Education Funding Review',
          speechTitle: 'Special Needs Education Support',
          duration: '15:47',
          wordCount: 1456,
          excerpt: 'Every child deserves equal access to quality education. Our special needs students and their families have been let down by inadequate funding and resources...',
          fullText: 'Every child deserves equal access to quality education. Our special needs students and their families have been let down by inadequate funding and resources. We must invest in special needs education as a priority, not an afterthought.',
          debateType: 'Committee Stage',
          chamber: 'Dáil Éireann',
          topics: ['Education', 'Special Needs', 'Children']
        }
      ];
      
      setSpeeches(mockSpeeches);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching member speeches:', error);
      setLoading(false);
    }
  };

  const filteredSpeeches = speeches.filter(speech => {
    const matchesSearch = speech.debateTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         speech.speechTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         speech.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || speech.debateType === selectedType;
    return matchesSearch && matchesType;
  });

  const debateTypes = ['all', ...Array.from(new Set(speeches.map(speech => speech.debateType)))];

  const toggleExpandedSpeech = (speechId: string) => {
    setExpandedSpeech(expandedSpeech === speechId ? null : speechId);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="w-6 h-6 text-blue-600" />
                </div>
                Speeches by {memberName}
              </h2>
              <p className="text-gray-600 mt-1">
                {totalSpeeches} speeches found • Detailed parliamentary contributions and debate participation
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

          {/* Search and Filter Controls */}
          <div className="mt-4 flex gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search speeches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {debateTypes.map(type => (
                <option key={type} value={type}>
                  {type === 'all' ? 'All Types' : type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-200px)] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading speeches...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredSpeeches.map((speech) => (
                <div key={speech.id} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">{speech.speechTitle}</h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(speech.date).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {speech.duration}
                        </span>
                        <span>{speech.wordCount} words</span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {speech.debateType}
                        </span>
                      </div>
                      <div className="text-sm font-medium text-gray-700 mb-3">{speech.debateTitle}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleExpandedSpeech(speech.id)}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {expandedSpeech === speech.id ? 'Hide' : 'View'} Full Text
                      </button>
                      <button
                        onClick={() => window.open(`/debates/${speech.id}`, '_blank')}
                        className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                        View Debate
                      </button>
                    </div>
                  </div>

                  {/* Topics */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {speech.topics.map((topic) => (
                      <span
                        key={topic}
                        className="px-2 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>

                  {/* Speech Content */}
                  <div className="text-gray-700">
                    <p className="italic text-gray-600 mb-2">"{speech.excerpt}"</p>
                    
                    {expandedSpeech === speech.id && (
                      <div className="mt-4 p-4 bg-white rounded-lg border">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Full Speech Text:</h4>
                        <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                          {speech.fullText}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filteredSpeeches.length === 0 && (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No speeches found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}