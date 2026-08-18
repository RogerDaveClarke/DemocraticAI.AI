import { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, 
  ChevronLeft, ChevronRight, Box, Maximize2
} from 'lucide-react';
import { API_URL } from '@/config/runtime';

const API_BASE_URL = (import.meta.env.VITE_API_URL || API_URL).replace(/\/$/, '');

interface Member {
  memberCode: string;
  fullName: string;
  photoUrl?: string;
  currentParty?: string;
  isActive: boolean;
}

interface DebateSegment {
  id: string;
  speaker: string;
  party: string;
  content: string;
  duration: number;
  timestamp: string;
  type: 'speech' | 'interjection' | 'question' | 'response';
}

interface DebateTopic {
  id: string;
  name: string;
  date?: string;
}
const fallbackDebateTopics: DebateTopic[] = [
  { id: 'housing', name: 'Housing Crisis Debate', date: '2025-10-15' },
  { id: 'healthcare', name: 'Healthcare Reform', date: '2025-10-20' },
  { id: 'climate', name: 'Climate Action Plan', date: '2025-10-25' },
  { id: 'education', name: 'Education Funding', date: '2025-11-01' },
];

const normalizeDebateTopics = (payload: any): DebateTopic[] => {
  const potentialLists = [payload?.debates, payload?.results, payload];
  const list = potentialLists.find((entry) => Array.isArray(entry)) || [];
  if (!Array.isArray(list)) return [];

  return list
    .map((item: any, index: number) => {
      const record = item?.debate || item;
      const name = record?.title || record?.topic || record?.showAs || record?.reference || 'Parliamentary Debate';
      const idSource = record?.debateId || record?.id || record?.slug || record?.guid || `${record?.date || record?.publishedAt || 'debate'}-${index}`;
      const date = record?.date || record?.sittingDate || record?.publishedAt || record?.when || record?.timestamp;
      return {
        id: String(idSource),
        name,
        date,
      } as DebateTopic;
    })
    .filter((topic) => Boolean(topic.id && topic.name));
};

const mockDebate: DebateSegment[] = [
  {
    id: '1',
    speaker: 'Simon Harris',
    party: 'Fine Gael',
    content: 'The Government remains committed to delivering affordable housing for all Irish families.',
    duration: 15000,
    timestamp: '14:30:00',
    type: 'speech'
  },
  {
    id: '2',
    speaker: 'Mary Lou McDonald',
    party: 'Sinn Féin',
    content: 'Taoiseach, with respect, we have heard these promises before.',
    duration: 8000,
    timestamp: '14:30:15',
    type: 'question'
  }
];

function AmphoraAvatar({ isPlaying, member }: { isPlaying: boolean; member?: Member }) {
  const gradientId = 'amphoraGradient';
  const highlightId = 'amphoraHighlight';
  const headBackground = member?.photoUrl
    ? {
        backgroundImage: `url(${member.photoUrl})`,
        backgroundPosition: 'center',
        backgroundSize: 'cover'
      }
    : { backgroundColor: '#FFE4C4' };

  return (
    <div className="relative flex flex-col items-center" style={{ width: '260px', height: '420px' }}>
      {isPlaying && (
        <div 
          className="absolute -top-32 left-1/2 transform -translate-x-1/2 bg-white rounded-3xl px-6 py-3 shadow-2xl"
          style={{ animation: 'fadeInOut 2s ease-in-out infinite', minWidth: '200px' }}
        >
          <div className="text-center text-gray-800 font-medium">Speaking...</div>
          <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
        </div>
      )}
      <div
        className="relative"
        style={{
          width: '150px',
          height: '150px',
          animation: isPlaying ? 'bobHead 2s ease-in-out infinite' : 'none'
        }}
      >
        <div
          className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-orange-200"
          style={headBackground}
        >
          {!member?.photoUrl && (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              👤
            </div>
          )}
        </div>
        <div
          className="absolute bg-black rounded-full shadow-lg"
          style={{ width: '18px', height: '18px', top: '58%', left: '32%' }}
        ></div>
        <div
          className="absolute bg-black rounded-full shadow-lg"
          style={{ width: '18px', height: '18px', top: '58%', right: '32%' }}
        ></div>
        <div
          className="absolute bg-red-900 rounded-full shadow-lg transition-all duration-150"
          style={{
            width: '42px',
            height: isPlaying ? '22px' : '14px',
            top: '72%',
            left: '50%',
            transform: 'translateX(-50%)',
            animation: isPlaying ? 'mouthTalk 0.3s ease-in-out infinite' : 'none'
          }}
        ></div>
      </div>
      <div className="w-24 h-4 rounded-full bg-orange-200 shadow-inner -mt-2 mb-2"></div>
      <svg viewBox="0 0 220 320" className="w-[220px] h-[320px] drop-shadow-2xl">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f9d88c" />
            <stop offset="55%" stopColor="#cf7c30" />
            <stop offset="100%" stopColor="#7b2c0f" />
          </linearGradient>
          <linearGradient id={highlightId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
        </defs>
        <path
          d="M70 30 Q55 35 55 65 L55 120 Q25 150 25 200 Q25 250 60 280 L80 305 L140 305 L160 280 Q195 250 195 200 Q195 150 165 120 L165 65 Q165 35 150 30 Q135 25 70 30 Z"
          fill={`url(#${gradientId})`}
          stroke="#5a1f04"
          strokeWidth="4"
        />
        <path
          d="M55 120 C15 150 15 210 55 240"
          fill="none"
          stroke="#a44b12"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M165 120 C205 150 205 210 165 240"
          fill="none"
          stroke="#a44b12"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M95 80 C85 120 85 220 115 260"
          fill="none"
          stroke={`url(#${highlightId})`}
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.6"
        />
        <ellipse cx="110" cy="60" rx="58" ry="14" fill="#e5a55b" stroke="#5a1f04" strokeWidth="3" />
        <ellipse cx="110" cy="305" rx="55" ry="10" fill="#4c1f07" />
        <rect x="92" y="295" width="36" height="18" rx="8" fill="#723310" />
      </svg>
    </div>
  );
}

export default function VirtualDail() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [view3D, setView3D] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>();
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [debateTopics, setDebateTopics] = useState<DebateTopic[]>(fallbackDebateTopics);
  const [selectedDebate, setSelectedDebate] = useState(fallbackDebateTopics[0]?.id ?? '');
  const [isLoadingDebates, setIsLoadingDebates] = useState(false);

  const currentSegment = mockDebate[currentSegmentIndex];

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/members?limit=20`);
        const data = await response.json();
        setMembers(data.members || []);
        if (data.members && data.members.length > 0) {
          setSelectedMember(data.members[0]);
        }
      } catch (error) {
        console.error('Failed to load members:', error);
      } finally {
        setIsLoadingMembers(false);
      }
    };
    
    loadMembers();
  }, []);

  useEffect(() => {
    const loadDebates = async () => {
      setIsLoadingDebates(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/debates?limit=50`);
        const data = await response.json();
        const normalized = normalizeDebateTopics(data);
        if (normalized.length > 0) {
          setDebateTopics(normalized);
          setSelectedDebate((prev) => prev || normalized[0].id);
        }
      } catch (error) {
        console.warn('Failed to load debates:', error);
      } finally {
        setIsLoadingDebates(false);
      }
    };

    loadDebates();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentSegment) {
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 100;
          
          if (newTime >= currentSegment.duration) {
            if (currentSegmentIndex < mockDebate.length - 1) {
              setCurrentSegmentIndex(currentSegmentIndex + 1);
              return 0;
            } else {
              setIsPlaying(false);
              return 0;
            }
          }
          
          return newTime;
        });
      }, 100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, currentSegmentIndex, currentSegment]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentSegmentIndex(0);
    setCurrentTime(0);
  };

  const handlePrevious = () => {
    if (currentSegmentIndex > 0) {
      setCurrentSegmentIndex(currentSegmentIndex - 1);
      setCurrentTime(0);
    }
  };

  const handleNext = () => {
    if (currentSegmentIndex < mockDebate.length - 1) {
      setCurrentSegmentIndex(currentSegmentIndex + 1);
      setCurrentTime(0);
    }
  };

  const getProgressPercentage = () => {
    if (!currentSegment) return 0;
    return (currentTime / currentSegment.duration) * 100;
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Virtual Dáil Chamber</h1>
              <p className="text-gray-600">Experience parliamentary debates in an interactive {view3D ? '3D' : '2D'} chamber simulation</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => setView3D(!view3D)}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                {view3D ? <Box className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                {view3D ? 'Switch to 2D' : 'Switch to 3D'}
              </button>
              <button
                onClick={handlePlayPause}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                {isPlaying ? 'Pause' : 'Play'}
              </button>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Reset
              </button>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="flex items-center gap-2 bg-gray-100 text-gray-800 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                aria-pressed={isMuted}
              >
                {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                {isMuted ? 'Muted' : 'Sound'}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Debate</label>
              <select
                value={selectedDebate}
                onChange={(e) => {
                  setSelectedDebate(e.target.value);
                  handleReset();
                }}
                disabled={isLoadingDebates || debateTopics.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              >
                {debateTopics.length === 0 ? (
                  <option value="">
                    {isLoadingDebates ? 'Loading debates...' : 'No debates available'}
                  </option>
                ) : (
                  debateTopics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}{topic.date ? ` (${topic.date})` : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select TD</label>
              <select
                value={selectedMember?.memberCode || ''}
                onChange={(e) => {
                  const member = members.find(m => m.memberCode === e.target.value);
                  setSelectedMember(member);
                }}
                disabled={isLoadingMembers || members.length === 0}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              >
                <option value="" disabled={members.length > 0} hidden={Boolean(selectedMember)}>
                  {isLoadingMembers ? 'Loading TDs...' : 'Select a TD'}
                </option>
                {members.map((member) => (
                  <option key={member.memberCode} value={member.memberCode}>
                    {member.fullName} {member.currentParty ? `(${member.currentParty})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>Segment {currentSegmentIndex + 1} of {mockDebate.length}</span>
          <span>{Math.round(getProgressPercentage())}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-100"
            style={{ width: `${getProgressPercentage()}%` }}
          ></div>
        </div>
      </div>

      {view3D ? (
        /* 3D View */
        <div className="relative">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg shadow-lg overflow-hidden p-8" style={{ height: '600px', perspective: '1000px' }}>
            {isLoadingMembers ? (
              <div className="h-full flex items-center justify-center text-white">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                  <p>Loading members...</p>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center">
                <AmphoraAvatar isPlaying={isPlaying} member={selectedMember} />
              </div>
            )}
          </div>
          
          <div className="absolute top-4 left-4 z-10 bg-black/70 text-white p-4 rounded-lg max-w-xs">
            <h2 className="text-xl font-bold mb-2">3D Parliament</h2>
            <p className="text-sm mb-4">Select a TD and watch their animated 3D avatar!</p>
            
            {isPlaying && selectedMember && (
              <div className="mt-4 pt-4 border-t border-gray-600">
                <div className="text-yellow-300 text-xs font-medium mb-1">Currently Speaking:</div>
                <div className="text-sm">{selectedMember.fullName}</div>
                <div className="text-xs text-gray-400">{selectedMember.currentParty}</div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 2D View */
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-2xl font-bold mb-4">2D Chamber View</h2>
          
          {currentSegment && (
            <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{currentSegment.speaker}</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentSegment.type}
                </span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{currentSegment.content}</p>
              <div className="mt-2 text-xs text-gray-500">
                {currentSegment.timestamp} • {currentSegment.party}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={handlePrevious}
              disabled={currentSegmentIndex === 0}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            
            <span className="text-sm text-gray-600 font-medium">
              Segment {currentSegmentIndex + 1} / {mockDebate.length}
            </span>
            
            <button
              onClick={handleNext}
              disabled={currentSegmentIndex === mockDebate.length - 1}
              className="p-2 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
