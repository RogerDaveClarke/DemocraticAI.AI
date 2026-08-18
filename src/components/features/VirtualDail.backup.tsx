import { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, Volume2, VolumeX, 
  Users, Clock, MessageSquare, ChevronLeft, ChevronRight, Box, Maximize2
} from 'lucide-react';

interface Minister {
  id: string;
  name: string;
  party: string;
  position: string;
  imageUrl: string;
  seatPosition: { x: number; y: number; section: 'government' | 'opposition' | 'independent' };
}

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

// Mock ministers with curved auditorium positions
const mockMinisters: Minister[] = [
  {
    id: 'taoiseach',
    name: 'Simon Harris',
    party: 'Fine Gael',
    position: 'Taoiseach',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Simon.Harris.1980-10-17/image',
    seatPosition: { x: 50, y: 35, section: 'government' }
  },
  {
    id: 'tanaiste',
    name: 'Micheál Martin',
    party: 'Fianna Fáil',
    position: 'Tánaiste',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Micheal.Martin.1960-08-01/image',
    seatPosition: { x: 43, y: 37, section: 'government' }
  },
  {
    id: 'minister-finance',
    name: 'Jack Chambers',
    party: 'Fianna Fáil',
    position: 'Minister for Finance',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Jack.Chambers.1981-04-07/image',
    seatPosition: { x: 57, y: 37, section: 'government' }
  },
  {
    id: 'minister-justice',
    name: 'Helen McEntee',
    party: 'Fine Gael',
    position: 'Minister for Justice',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Helen.McEntee.1986-06-08/image',
    seatPosition: { x: 36, y: 39, section: 'government' }
  },
  {
    id: 'minister-foreign',
    name: 'Paschal Donohoe',
    party: 'Fine Gael',
    position: 'Minister for Public Expenditure',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Paschal.Donohoe.1974-09-19/image',
    seatPosition: { x: 64, y: 39, section: 'government' }
  },
  {
    id: 'minister-health',
    name: 'Stephen Donnelly',
    party: 'Fianna Fáil',
    position: 'Minister for Health',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Stephen.Donnelly.1975-05-12/image',
    seatPosition: { x: 40, y: 52, section: 'government' }
  },
  {
    id: 'minister-education',
    name: 'Norma Foley',
    party: 'Fianna Fáil',
    position: 'Minister for Education',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Norma.Foley.1970-01-01/image',
    seatPosition: { x: 47, y: 54, section: 'government' }
  },
  {
    id: 'minister-housing',
    name: 'Darragh O\'Brien',
    party: 'Fianna Fáil',
    position: 'Minister for Housing',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Darragh.OBrien.1974-05-18/image',
    seatPosition: { x: 53, y: 54, section: 'government' }
  },
  {
    id: 'minister-enterprise',
    name: 'Peter Burke',
    party: 'Fine Gael',
    position: 'Minister for Enterprise',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Peter.Burke.1982-12-12/image',
    seatPosition: { x: 60, y: 52, section: 'government' }
  },
  {
    id: 'opposition-leader',
    name: 'Mary Lou McDonald',
    party: 'Sinn Féin',
    position: 'Leader of the Opposition',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Mary.Lou.McDonald.1969-05-01/image',
    seatPosition: { x: 50, y: 75, section: 'opposition' }
  },
  {
    id: 'sf-deputy-leader',
    name: 'Pearse Doherty',
    party: 'Sinn Féin',
    position: 'Deputy Leader',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Pearse.Doherty.1977-07-15/image',
    seatPosition: { x: 43, y: 77, section: 'opposition' }
  },
  {
    id: 'labour-leader',
    name: 'Ivana Bacik',
    party: 'Labour',
    position: 'Labour Party Leader',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Ivana.Bacik.1968-05-25/image',
    seatPosition: { x: 67, y: 77, section: 'opposition' }
  },
  {
    id: 'social-democrats',
    name: 'Holly Cairns',
    party: 'Social Democrats',
    position: 'Party Leader',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Holly.Cairns.1989-12-18/image',
    seatPosition: { x: 74, y: 79, section: 'opposition' }
  },
  {
    id: 'sf-housing',
    name: 'Eoin Ó Broin',
    party: 'Sinn Féin',
    position: 'Housing Spokesperson',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Eoin.O.Broin.1972-10-16/image',
    seatPosition: { x: 36, y: 79, section: 'opposition' }
  },
  {
    id: 'sf-finance',
    name: 'Mairead Farrell',
    party: 'Sinn Féin',
    position: 'Finance Spokesperson',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Mairead.Farrell.1988-01-31/image',
    seatPosition: { x: 57, y: 77, section: 'opposition' }
  },
  {
    id: 'pb4p-leader',
    name: 'Richard Boyd Barrett',
    party: 'People Before Profit',
    position: 'Party Leader',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Richard.Boyd.Barrett.1967-05-19/image',
    seatPosition: { x: 26, y: 82, section: 'opposition' }
  },
  {
    id: 'green-leader',
    name: 'Roderic O\'Gorman',
    party: 'Green Party',
    position: 'Party Leader',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Roderic.OGorman.1982-11-24/image',
    seatPosition: { x: 67, y: 54, section: 'government' }
  },
  {
    id: 'independent-1',
    name: 'Michael Lowry',
    party: 'Independent',
    position: 'Independent TD',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Michael.Lowry.1953-03-02/image',
    seatPosition: { x: 80, y: 65, section: 'independent' }
  },
  {
    id: 'independent-2',
    name: 'Michael Healy-Rae',
    party: 'Independent',
    position: 'Independent TD',
    imageUrl: 'https://www.oireachtas.ie/api/v1/members/Michael.Healy-Rae.1967-03-30/image',
    seatPosition: { x: 20, y: 65, section: 'independent' }
  }
];

const debateTopics = [
  { id: 'housing', name: 'Housing Crisis Debate', date: '2025-10-15' },
  { id: 'healthcare', name: 'Healthcare Reform', date: '2025-10-20' },
  { id: 'climate', name: 'Climate Action Plan', date: '2025-10-25' },
  { id: 'education', name: 'Education Funding', date: '2025-11-01' },
];

// Mock debate data
const mockDebate: DebateSegment[] = [
  {
    id: '1',
    speaker: 'Simon Harris',
    party: 'Fine Gael',
    content: 'The Government remains committed to delivering affordable housing for all Irish families. Our housing plan will deliver 300,000 new homes by 2030.',
    duration: 15000,
    timestamp: '14:30:00',
    type: 'speech'
  },
  {
    id: '2',
    speaker: 'Mary Lou McDonald',
    party: 'Sinn Féin',
    content: 'Taoiseach, with respect, we have heard these promises before. What concrete action will you take this month to address the housing crisis?',
    duration: 8000,
    timestamp: '14:30:15',
    type: 'question'
  },
  {
    id: '3',
    speaker: 'Jack Chambers',
    party: 'Fianna Fáil',
    content: 'The Deputy knows well that we have increased housing investment by 40% this year. The Help-to-Buy scheme has assisted over 50,000 families.',
    duration: 12000,
    timestamp: '14:30:23',
    type: 'response'
  },
  {
    id: '4',
    speaker: 'Holly Cairns',
    party: 'Social Democrats',
    content: 'Will the Minister acknowledge that first-time buyers are still being priced out of the market in every county?',
    duration: 6000,
    timestamp: '14:30:35',
    type: 'interjection'
  }
];

export default function VirtualDail() {
  console.log('VirtualDail component rendering...');
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speakingMinister, setSpeakingMinister] = useState<string | null>(null);
  const [view3D, setView3D] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<Member | undefined>();
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [selectedDebate, setSelectedDebate] = useState('housing');

  const currentSegment = mockDebate[currentSegmentIndex];
  
  console.log('VirtualDail state:', { isPlaying, currentSegmentIndex, currentSegment });

  useEffect(() => {
    const loadMembers = async () => {
      setIsLoadingMembers(true);
      try {
        const response = await fetch('http://localhost:8080/api/members?limit=20');
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
    let interval: NodeJS.Timeout;
    
    if (isPlaying && currentSegment) {
      // Set the current speaker as speaking
      setSpeakingMinister(currentSegment.speaker);
      
      interval = setInterval(() => {
        setCurrentTime(prev => {
          const newTime = prev + 100;
          
          // Check if current segment is finished
          if (newTime >= currentSegment.duration) {
            // Move to next segment
            if (currentSegmentIndex < mockDebate.length - 1) {
              setCurrentSegmentIndex(currentSegmentIndex + 1);
              return 0;
            } else {
              // End of debate
              setIsPlaying(false);
              setSpeakingMinister(null);
              return 0;
            }
          }
          
          return newTime;
        });
      }, 100);
    } else {
      setSpeakingMinister(null);
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
    setSpeakingMinister(null);
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

  const getSpeechTypeColor = (type: string) => {
    switch (type) {
      case 'speech': return 'bg-blue-100 text-blue-800';
      case 'question': return 'bg-red-100 text-red-800';
      case 'response': return 'bg-green-100 text-green-800';
      case 'interjection': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressPercentage = () => {
    if (!currentSegment) return 0;
    return (currentTime / currentSegment.duration) * 100;
  };

  console.log('VirtualDail about to return JSX...');

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Virtual Dáil Chamber</h1>
          <p className="text-gray-600">Experience parliamentary debates in an interactive {view3D ? '3D' : '2D'} chamber simulation</p>
        </div>
        <button
          onClick={() => setView3D(!view3D)}
          className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          {view3D ? <Box className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          {view3D ? 'Switch to 2D' : 'Switch to 3D'}
        </button>
      </div>

      {/* Debate Selector and Controls Bar */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Debate Selector */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Debate:</label>
            <select
              value={selectedDebate}
              onChange={(e) => {
                setSelectedDebate(e.target.value);
                handleReset();
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {debateTopics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name} ({topic.date})
                </option>
              ))}
            </select>
          </div>

          {/* Playback Controls */}
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>
            
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Reset
            </button>
            
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
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
      </div>

      {view3D ? (
        /* 3D View - CSS-based Animation */
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
                {/* CSS 3D Animated TD */}
                <div 
                  className="relative"
                  style={{ 
                    transform: 'rotateY(0deg)',
                    transformStyle: 'preserve-3d',
                    animation: 'rotate3d 20s infinite linear'
                  }}
                >
                  {/* Body */}
                  <div 
                    className="bg-blue-600 rounded-lg shadow-2xl"
                    style={{
                      width: '120px',
                      height: '180px',
                      transform: 'translateZ(0px)',
                      transformStyle: 'preserve-3d'
                    }}
                  ></div>
                  
                  {/* Head with Photo */}
                  <div 
                    className="absolute -top-20 left-1/2 transform -translate-x-1/2"
                    style={{
                      width: '140px',
                      height: '140px',
                      transformStyle: 'preserve-3d',
                      animation: isPlaying ? 'bobHead 2s ease-in-out infinite' : 'none'
                    }}
                  >
                    {/* Head sphere with photo */}
                    <div 
                      className="w-full h-full rounded-full overflow-hidden shadow-2xl border-4 border-blue-300"
                      style={{
                        background: selectedMember?.photoUrl 
                          ? `url(${selectedMember.photoUrl}) center/cover`
                          : '#FFE4C4',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.5)'
                      }}
                    >
                      {!selectedMember?.photoUrl && (
                        <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-600">
                          👤
                        </div>
                      )}
                    </div>
                    
                    {/* Eyes */}
                    <div className="absolute top-12 left-8 w-6 h-6 bg-black rounded-full shadow-lg"></div>
                    <div className="absolute top-12 right-8 w-6 h-6 bg-black rounded-full shadow-lg"></div>
                    
                    {/* Animated Mouth */}
                    <div 
                      className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-red-900 rounded-full shadow-lg transition-all duration-150"
                      style={{
                        width: '40px',
                        height: isPlaying ? '25px' : '15px',
                        animation: isPlaying ? 'mouthTalk 0.3s ease-in-out infinite' : 'none'
                      }}
                    ></div>
                  </div>
                  
                  {/* Speech Bubble */}
                  {isPlaying && (
                    <div 
                      className="absolute -top-40 left-1/2 transform -translate-x-1/2 bg-white rounded-3xl px-6 py-4 shadow-2xl"
                      style={{
                        animation: 'fadeInOut 2s ease-in-out infinite',
                        minWidth: '200px'
                      }}
                    >
                      <div className="text-center text-gray-800 font-medium">
                        Speaking...
                      </div>
                      <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-6 h-6 bg-white rotate-45"></div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* 3D Controls Panel */}
          <div className="absolute top-4 left-4 z-10 bg-black/70 text-white p-4 rounded-lg max-w-xs">
            <h2 className="text-xl font-bold mb-2">3D Parliament</h2>
            <p className="text-sm mb-4">Select a TD and watch their animated 3D avatar with photo!</p>
            
            {members.length > 0 && (
              <div className="mb-4">
                <label className="block text-xs text-gray-300 mb-1">Select TD:</label>
                <select
                  value={selectedMember?.memberCode || ''}
                  onChange={(e) => {
                    const member = members.find(m => m.memberCode === e.target.value);
                    setSelectedMember(member);
                  }}
                  className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-sm"
                >
                  {members.map((member) => (
                    <option key={member.memberCode} value={member.memberCode}>
                      {member.fullName} {member.currentParty ? `(${member.currentParty})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
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
        /* 2D View (Original) */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chamber View */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">Dáil Chamber - Housing Debate</h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  <span>14:30 - 15:30</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  <span>{mockMinisters.length} TDs Present</span>
                </div>
              </div>
            </div>

            {/* Chamber Layout - Curved Auditorium Style */}
            <div className="relative bg-gradient-to-b from-green-50 to-green-100 rounded-lg p-8 h-96 overflow-hidden">
              {/* Ceann Comhairle Position - Speaker's Podium */}
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2">
                <div className="text-center">
                  <div className="w-16 h-8 bg-amber-600 rounded-t-lg flex items-center justify-center mb-1 shadow-lg">
                    <span className="text-xs font-bold text-white">CEANN COMHAIRLE</span>
                  </div>
                  <div className="w-20 h-2 bg-amber-700 rounded-b-sm"></div>
                </div>
              </div>

              {/* Ministers in Curved Auditorium */}
              {mockMinisters.map((minister) => {
                const isCurrentSpeaker = speakingMinister === minister.name;
                
                return (
                  <div
                    key={minister.id}
                    className={`absolute transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300 ${
                      isCurrentSpeaker ? 'scale-125 z-20' : 'scale-100 z-10'
                    }`}
                    style={{
                      left: `${minister.seatPosition.x}%`,
                      top: `${minister.seatPosition.y}%`
                    }}
                  >
                    {/* Speaking indicator */}
                    {isCurrentSpeaker && (
                      <div className="absolute -top-4 -left-4 w-20 h-20 border-4 border-yellow-500 rounded-full animate-pulse bg-yellow-100 opacity-50"></div>
                    )}
                    
                    {/* Seat Background */}
                    <div className={`absolute -bottom-2 -left-3 w-10 h-6 rounded-t-lg opacity-70 ${
                      minister.seatPosition.section === 'government' 
                        ? 'bg-blue-300' 
                        : minister.seatPosition.section === 'opposition'
                        ? 'bg-red-300'
                        : 'bg-green-300'
                    }`}></div>
                    
                    {/* Minister representation */}
                    <div className="text-center relative">
                      {/* Minister Photo */}
                      <div className={`w-12 h-12 rounded-full mb-1 border-3 overflow-hidden shadow-lg ${
                        minister.seatPosition.section === 'government' 
                          ? 'border-blue-500' 
                          : minister.seatPosition.section === 'opposition'
                          ? 'border-red-500'
                          : 'border-green-500'
                      } ${isCurrentSpeaker ? 'ring-4 ring-yellow-400' : ''}`}>
                        <img 
                          src={minister.imageUrl} 
                          alt={minister.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        {/* Fallback initials */}
                        <div className="hidden w-full h-full bg-gray-200 items-center justify-center text-xs font-bold text-gray-600">
                          {minister.name.split(' ').map(n => n[0]).join('')}
                        </div>
                      </div>
                      
                      {/* Name label */}
                      <div className={`text-xs font-medium px-2 py-1 rounded shadow-sm transition-all ${
                        isCurrentSpeaker 
                          ? 'bg-yellow-400 text-gray-900 font-bold' 
                          : 'bg-white text-gray-700'
                      }`}>
                        {minister.name.split(' ')[0]}
                      </div>
                      
                      {/* Party badge */}
                      <div className={`text-xs mt-1 px-1 py-0.5 rounded text-white ${
                        minister.seatPosition.section === 'government' 
                          ? 'bg-blue-600' 
                          : minister.seatPosition.section === 'opposition'
                          ? 'bg-red-600'
                          : 'bg-green-600'
                      }`}>
                        {minister.party === 'Fine Gael' ? 'FG' :
                         minister.party === 'Fianna Fáil' ? 'FF' :
                         minister.party === 'Sinn Féin' ? 'SF' :
                         minister.party === 'Labour' ? 'LAB' :
                         minister.party === 'Green Party' ? 'GP' :
                         minister.party === 'Social Democrats' ? 'SD' :
                         minister.party === 'People Before Profit' ? 'PBP' :
                         'IND'}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Row Labels */}
              <div className="absolute bottom-2 left-4 text-xs text-gray-600 space-y-1">
                <div className="font-semibold mb-2">Chamber Layout:</div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Government</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Opposition</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>Independent</span>
                </div>
              </div>

              {/* Row Numbers */}
              <div className="absolute bottom-2 right-4 text-xs text-gray-500">
                <div className="text-right space-y-1">
                  <div>Row 1: Front Bench</div>
                  <div>Row 2: Ministers/Shadows</div>
                  <div>Row 3: Backbenchers</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controls and Transcript Panel */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            {/* Navigation Controls */}
            <div className="mb-6 bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-center gap-2 mb-4">
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
          </div>
        </div>

        {/* Debate Transcript */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold">Live Transcript</h3>
          </div>
          
          {/* Current speaking segment */}
          {currentSegment && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-gray-900">{currentSegment.speaker}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpeechTypeColor(currentSegment.type)}`}>
                  {currentSegment.type}
                </span>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{currentSegment.content}</p>
              <div className="mt-2 text-xs text-gray-500">
                {currentSegment.timestamp} • {currentSegment.party}
              </div>
            </div>
          )}

          {/* Previous segments */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {mockDebate.slice(0, currentSegmentIndex).map((segment) => (
              <div key={segment.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-gray-900">{segment.speaker}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSpeechTypeColor(segment.type)}`}>
                    {segment.type}
                  </span>
                </div>
                <p className="text-gray-600 text-xs leading-relaxed">{segment.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Feature Info */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Virtual Dáil - Feature Evaluation</h3>
        <p className="text-gray-700 mb-4">
          This prototype demonstrates a 3D-style parliamentary chamber simulation where you can watch debates unfold 
          with visual representations of ministers. Each minister is shown with their actual photo attached to a 
          stick figure body, positioned according to their party affiliation.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Current Features:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Visual chamber layout with party seating</li>
              <li>• Animated debates with speaking indicators</li>
              <li>• Real-time transcript with speech types</li>
              <li>• Interactive playback controls</li>
              <li>• Minister photo integration</li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Potential Enhancements:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• 3D chamber perspective views</li>
              <li>• Audio narration with TTS</li>
              <li>• Interactive minister information</li>
              <li>• Vote visualization</li>
              <li>• Historical debate replay</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}