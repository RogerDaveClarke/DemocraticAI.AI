import { useState } from 'react';
import { User, CheckCircle, ArrowRight, ArrowLeft, RotateCcw, Share2, Trophy } from 'lucide-react';
import { API_URL } from '@/config/runtime';

interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    traits: {
      political: 'left' | 'centre-left' | 'centre' | 'centre-right' | 'right';
      economic: 'progressive' | 'moderate' | 'conservative';
      social: 'liberal' | 'moderate' | 'traditional';
      style: 'direct' | 'diplomatic' | 'passionate' | 'technical' | 'charismatic' | 'analytical';
      approach: 'collaborative' | 'decisive' | 'analytical' | 'pragmatic';
    };
  }[];
}

interface MinisterProfile {
  id: string;
  name: string;
  party: string;
  position: string;
  imageUrl: string;
  traits: {
    political: 'left' | 'centre-left' | 'centre' | 'centre-right' | 'right';
    economic: 'progressive' | 'moderate' | 'conservative';
    social: 'liberal' | 'moderate' | 'traditional';
    style: 'direct' | 'diplomatic' | 'passionate' | 'technical' | 'charismatic' | 'analytical';
    approach: 'collaborative' | 'decisive' | 'analytical' | 'pragmatic';
  };
  description: string;
  keyPolicies: string[];
  quote: string;
  matchPercentage?: number;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 'economic-priority',
    question: 'What should be Ireland\'s top economic priority?',
    options: [
      {
        id: 'jobs',
        text: 'Creating jobs and reducing unemployment',
        traits: { political: 'centre-left', economic: 'progressive', social: 'moderate', style: 'passionate', approach: 'collaborative' }
      },
      {
        id: 'growth',
        text: 'Supporting business growth and innovation',
        traits: { political: 'centre-right', economic: 'moderate', social: 'moderate', style: 'technical', approach: 'decisive' }
      },
      {
        id: 'equality',
        text: 'Reducing income inequality and supporting welfare',
        traits: { political: 'left', economic: 'progressive', social: 'liberal', style: 'passionate', approach: 'collaborative' }
      },
      {
        id: 'stability',
        text: 'Maintaining fiscal responsibility and balanced budgets',
        traits: { political: 'centre', economic: 'conservative', social: 'moderate', style: 'analytical', approach: 'pragmatic' }
      }
    ]
  },
  {
    id: 'healthcare-approach',
    question: 'How should Ireland improve its healthcare system?',
    options: [
      {
        id: 'universal',
        text: 'Implement universal healthcare with significant public investment',
        traits: { political: 'left', economic: 'progressive', social: 'liberal', style: 'passionate', approach: 'collaborative' }
      },
      {
        id: 'reform',
        text: 'Reform current system with gradual improvements and efficiency gains',
        traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'diplomatic', approach: 'analytical' }
      },
      {
        id: 'technology',
        text: 'Focus on digital health solutions and preventive care',
        traits: { political: 'centre-right', economic: 'moderate', social: 'moderate', style: 'technical', approach: 'decisive' }
      },
      {
        id: 'private',
        text: 'Encourage private healthcare options alongside public system',
        traits: { political: 'right', economic: 'conservative', social: 'traditional', style: 'direct', approach: 'pragmatic' }
      }
    ]
  },
  {
    id: 'climate-action',
    question: 'What\'s the best approach to climate action in Ireland?',
    options: [
      {
        id: 'ambitious',
        text: 'Aggressive targets with major government investment in green transition',
        traits: { political: 'left', economic: 'progressive', social: 'liberal', style: 'passionate', approach: 'decisive' }
      },
      {
        id: 'balanced',
        text: 'Balanced approach considering environmental and economic impacts',
        traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'diplomatic', approach: 'analytical' }
      },
      {
        id: 'innovation',
        text: 'Focus on technological innovation and market-based solutions',
        traits: { political: 'centre-right', economic: 'moderate', social: 'moderate', style: 'technical', approach: 'pragmatic' }
      },
      {
        id: 'gradual',
        text: 'Gradual transition that protects jobs and traditional industries',
        traits: { political: 'centre-right', economic: 'conservative', social: 'traditional', style: 'direct', approach: 'collaborative' }
      }
    ]
  },
  {
    id: 'housing-crisis',
    question: 'How should Ireland address the housing crisis?',
    options: [
      {
        id: 'social',
        text: 'Massive public housing program with rent controls',
        traits: { political: 'left', economic: 'progressive', social: 'liberal', style: 'passionate', approach: 'decisive' }
      },
      {
        id: 'supply',
        text: 'Focus on increasing overall housing supply through planning reform',
        traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'technical', approach: 'analytical' }
      },
      {
        id: 'support',
        text: 'Support first-time buyers with grants and affordable schemes',
        traits: { political: 'centre-right', economic: 'moderate', social: 'moderate', style: 'diplomatic', approach: 'collaborative' }
      },
      {
        id: 'market',
        text: 'Let market forces work with minimal government interference',
        traits: { political: 'right', economic: 'conservative', social: 'traditional', style: 'direct', approach: 'pragmatic' }
      }
    ]
  },
  {
    id: 'eu-relations',
    question: 'What should Ireland\'s relationship with the EU be?',
    options: [
      {
        id: 'integration',
        text: 'Deeper European integration and stronger EU institutions',
        traits: { political: 'centre-left', economic: 'progressive', social: 'liberal', style: 'diplomatic', approach: 'collaborative' }
      },
      {
        id: 'pragmatic',
        text: 'Pragmatic engagement focused on Irish interests',
        traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'analytical', approach: 'pragmatic' }
      },
      {
        id: 'sovereignty',
        text: 'Maintain Irish sovereignty while cooperating on key issues',
        traits: { political: 'centre-right', economic: 'conservative', social: 'traditional', style: 'direct', approach: 'decisive' }
      },
      {
        id: 'reform',
        text: 'Push for EU reform to make it more democratic and accountable',
        traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'passionate', approach: 'analytical' }
      }
    ]
  },
  {
    id: 'communication-style',
    question: 'How do you prefer to communicate difficult messages?',
    options: [
      {
        id: 'direct',
        text: 'Be direct and straightforward, even if it\'s uncomfortable',
        traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'direct', approach: 'decisive' }
      },
      {
        id: 'diplomatic',
        text: 'Use careful diplomatic language to build consensus',
        traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'diplomatic', approach: 'collaborative' }
      },
      {
        id: 'passionate',
        text: 'Speak with passion and emotion to inspire action',
        traits: { political: 'left', economic: 'progressive', social: 'liberal', style: 'passionate', approach: 'collaborative' }
      },
      {
        id: 'technical',
        text: 'Present detailed facts and analysis to convince others',
        traits: { political: 'centre-right', economic: 'moderate', social: 'moderate', style: 'technical', approach: 'analytical' }
      }
    ]
  },
  {
    id: 'decision-making',
    question: 'How do you approach making important decisions?',
    options: [
      {
        id: 'consultative',
        text: 'Consult widely with stakeholders and build consensus',
        traits: { political: 'centre-left', economic: 'moderate', social: 'liberal', style: 'diplomatic', approach: 'collaborative' }
      },
      {
        id: 'analytical',
        text: 'Thoroughly analyze all data and evidence before deciding',
        traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'technical', approach: 'analytical' }
      },
      {
        id: 'decisive',
        text: 'Make quick decisions based on experience and instinct',
        traits: { political: 'centre-right', economic: 'conservative', social: 'moderate', style: 'direct', approach: 'decisive' }
      },
      {
        id: 'pragmatic',
        text: 'Focus on what\'s practical and achievable in current circumstances',
        traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'diplomatic', approach: 'pragmatic' }
      }
    ]
  }
];

const ministerProfiles: MinisterProfile[] = [
  {
    id: 'micheal-martin',
    name: 'Micheál Martin',
    party: 'Fianna Fáil',
    position: 'Taoiseach',
    imageUrl: `${API_URL}/photos/Micheal-Martin.D.1989-06-15.jpg`,
    traits: { political: 'centre', economic: 'moderate', social: 'moderate', style: 'diplomatic', approach: 'collaborative' },
    description: 'A seasoned politician known for his diplomatic approach and consensus-building skills.',
    keyPolicies: ['Coalition Government', 'EU Relations', 'Healthcare Reform', 'Economic Recovery'],
    quote: 'Ireland\'s future depends on our ability to work together across party lines.'
  },
  {
    id: 'simon-harris',
    name: 'Simon Harris',
    party: 'Fine Gael',
    position: 'Tánaiste',
    imageUrl: `${API_URL}/photos/Simon-Harris.D.2011-03-09.jpg`,
    traits: { political: 'centre-right', economic: 'moderate', social: 'moderate', style: 'technical', approach: 'decisive' },
    description: 'A tech-savvy politician focused on innovation, healthcare modernization, and efficient governance.',
    keyPolicies: ['Digital Health', 'Healthcare Innovation', 'Government Efficiency', 'Technology Policy'],
    quote: 'We must embrace innovation to build a better Ireland for all.'
  },
  {
    id: 'paschal-donohoe',
    name: 'Paschal Donohoe',
    party: 'Fine Gael',
    position: 'Minister for Public Expenditure',
    imageUrl: `${API_URL}/photos/Paschal-Donohoe.D.2011-03-09.jpg`,
    traits: { political: 'centre-right', economic: 'conservative', social: 'moderate', style: 'analytical', approach: 'pragmatic' },
    description: 'An economics-focused minister known for fiscal responsibility and detailed policy analysis.',
    keyPolicies: ['Fiscal Responsibility', 'Tax Policy', 'Economic Planning', 'Public Finance'],
    quote: 'Sound public finances are the foundation of a fair society.'
  },
  {
    id: 'helen-mcentee',
    name: 'Helen McEntee',
    party: 'Fine Gael',
    position: 'Minister for Justice',
    imageUrl: `${API_URL}/photos/Helen-McEntee.D.2013-05-24.jpg`,
    traits: { political: 'centre-right', economic: 'moderate', social: 'liberal', style: 'direct', approach: 'decisive' },
    description: 'A direct communicator focused on justice reform, women\'s rights, and social progress.',
    keyPolicies: ['Justice Reform', 'Gender Equality', 'Criminal Justice', 'Human Rights'],
    quote: 'Justice must be both swift and fair for all citizens.'
  },
  {
    id: 'eamon-ryan',
    name: 'Eamon Ryan',
    party: 'Green Party',
    position: 'Minister for Climate Action',
    imageUrl: `${API_URL}/photos/Eamon-Ryan.D.2002-05-17.jpg`,
    traits: { political: 'left', economic: 'progressive', social: 'liberal', style: 'passionate', approach: 'decisive' },
    description: 'An environmental champion with passionate advocacy for climate action and sustainable development.',
    keyPolicies: ['Climate Action', 'Renewable Energy', 'Sustainable Transport', 'Green Economy'],
    quote: 'The climate crisis demands bold action and immediate change.'
  },
  {
    id: 'heather-humphreys',
    name: 'Heather Humphreys',
    party: 'Fine Gael',
    position: 'Minister for Rural Development',
    imageUrl: `${API_URL}/photos/Heather-Humphreys.D.2011-03-09.jpg`,
    traits: { political: 'centre-right', economic: 'moderate', social: 'traditional', style: 'direct', approach: 'collaborative' },
    description: 'A champion of rural communities with a practical approach to regional development.',
    keyPolicies: ['Rural Development', 'Community Support', 'Arts & Culture', 'Regional Economy'],
    quote: 'Every part of Ireland deserves opportunity and investment.'
  }
];

interface WhichMinisterQuizProps {
  onClose: () => void;
}

export default function WhichMinisterQuiz({ onClose }: WhichMinisterQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<{ [questionId: string]: string }>({});
  const [result, setResult] = useState<MinisterProfile | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [userTraits, setUserTraits] = useState<any>(null);

  type TraitScores = {
    political: Record<'left' | 'centre-left' | 'centre' | 'centre-right' | 'right', number>;
    economic: Record<'progressive' | 'moderate' | 'conservative', number>;
    social: Record<'liberal' | 'moderate' | 'traditional', number>;
    style: Record<'direct' | 'diplomatic' | 'passionate' | 'technical' | 'charismatic', number>;
    approach: Record<'collaborative' | 'decisive' | 'analytical' | 'pragmatic', number>;
  };

  const handleAnswer = (questionId: string, optionId: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
  };

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    } else {
      calculateResult();
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const calculateResult = () => {
    // Calculate user's trait scores
    const traitScores: TraitScores = {
      political: { left: 0, 'centre-left': 0, centre: 0, 'centre-right': 0, right: 0 },
      economic: { progressive: 0, moderate: 0, conservative: 0 },
      social: { liberal: 0, moderate: 0, traditional: 0 },
      style: { direct: 0, diplomatic: 0, passionate: 0, technical: 0, charismatic: 0 },
      approach: { collaborative: 0, decisive: 0, analytical: 0, pragmatic: 0 }
    };

    // Tally scores from answers
    Object.entries(answers).forEach(([questionId, optionId]) => {
      const question = quizQuestions.find(q => q.id === questionId);
      const option = question?.options.find(o => o.id === optionId);
      if (option) {
        Object.entries(option.traits).forEach(([traitType, traitValue]) => {
          const bucket = traitScores[traitType as keyof TraitScores];
          if (bucket && traitValue in bucket) {
            bucket[traitValue as keyof typeof bucket]++;
          }
        });
      }
    });

    // Find dominant traits
    const dominantTraits = {
      political: Object.entries(traitScores.political).reduce((a, b) => a[1] > b[1] ? a : b)[0],
      economic: Object.entries(traitScores.economic).reduce((a, b) => a[1] > b[1] ? a : b)[0],
      social: Object.entries(traitScores.social).reduce((a, b) => a[1] > b[1] ? a : b)[0],
      style: Object.entries(traitScores.style).reduce((a, b) => a[1] > b[1] ? a : b)[0],
      approach: Object.entries(traitScores.approach).reduce((a, b) => a[1] > b[1] ? a : b)[0]
    };

    setUserTraits(dominantTraits);

    // Calculate match percentages for each minister
    const ministersWithScores = ministerProfiles.map(minister => {
      let matchCount = 0;
      let totalTraits = 0;

      Object.entries(dominantTraits).forEach(([traitType, userValue]) => {
        const ministerValue = minister.traits[traitType as keyof typeof minister.traits];
        totalTraits++;
        if (userValue === ministerValue) {
          matchCount++;
        }
      });

      const matchPercentage = Math.round((matchCount / totalTraits) * 100);
      return { ...minister, matchPercentage };
    });

    // Find best match
    const bestMatch = ministersWithScores.reduce((best, current) => 
      current.matchPercentage! > best.matchPercentage! ? current : best
    );

    setResult(bestMatch);
    setShowResult(true);
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setAnswers({});
    setResult(null);
    setShowResult(false);
    setUserTraits(null);
  };

  const shareResult = () => {
    if (result) {
      const text = `I just took the "Which Minister Are You?" quiz and got ${result.name}! Try it yourself at the Irish Parliament Explorer.`;
      if (navigator.share) {
        navigator.share({
          title: 'Which Minister Are You? Quiz Result',
          text: text,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(text);
        alert('Result copied to clipboard!');
      }
    }
  };

  if (showResult && result) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <h2 className="text-2xl font-bold text-gray-900">Your Result</h2>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                <img 
                  src={result.imageUrl} 
                  alt={result.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const initials = result.name.split(' ').map((n: string) => n[0]).join('');
                    const fallback = document.createElement('div');
                    fallback.className = 'w-full h-full flex items-center justify-center text-2xl font-bold text-blue-700';
                    fallback.textContent = initials;
                    target.parentElement!.appendChild(fallback);
                  }}
                />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{result.name}</h3>
              <p className="text-xl text-blue-600 mb-2">{result.position}</p>
              <p className="text-lg text-gray-600">{result.party}</p>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">{result.matchPercentage}% Match</p>
                <p className="text-sm text-green-600">Personality compatibility score</p>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">About Your Match</h4>
              <p className="text-gray-700 mb-4">{result.description}</p>
              <blockquote className="italic text-gray-600 border-l-4 border-blue-500 pl-4 mb-4">
                "{result.quote}"
              </blockquote>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3">Key Policy Areas</h4>
              <div className="flex flex-wrap gap-2">
                {result.keyPolicies.map((policy, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {policy}
                  </span>
                ))}
              </div>
            </div>

            {userTraits && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3">Your Political Profile</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Political Position:</span>
                    <span className="ml-2 capitalize">{userTraits.political.replace('-', ' ')}</span>
                  </div>
                  <div>
                    <span className="font-medium">Economic View:</span>
                    <span className="ml-2 capitalize">{userTraits.economic}</span>
                  </div>
                  <div>
                    <span className="font-medium">Social Issues:</span>
                    <span className="ml-2 capitalize">{userTraits.social}</span>
                  </div>
                  <div>
                    <span className="font-medium">Communication Style:</span>
                    <span className="ml-2 capitalize">{userTraits.style}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={shareResult}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share Result
              </button>
              <button
                onClick={restartQuiz}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Take Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = quizQuestions[currentQuestion];
  const currentAnswer = answers[currentQ.id];
  const progress = ((currentQuestion + 1) / quizQuestions.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">Which Minister Are You?</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentQuestion + 1} of {quizQuestions.length}</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Question */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {currentQ.question}
            </h3>

            <div className="space-y-3">
              {currentQ.options.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleAnswer(currentQ.id, option.id)}
                  className={`w-full p-4 text-left rounded-lg border transition-all duration-200 ${
                    currentAnswer === option.id
                      ? 'border-blue-500 bg-blue-50 text-blue-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{option.text}</span>
                    {currentAnswer === option.id && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={prevQuestion}
              disabled={currentQuestion === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                currentQuestion === 0
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <ArrowLeft className="w-4 h-4" />
              Previous
            </button>

            <button
              onClick={nextQuestion}
              disabled={!currentAnswer}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors ${
                !currentAnswer
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {currentQuestion === quizQuestions.length - 1 ? 'Get Result' : 'Next'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}