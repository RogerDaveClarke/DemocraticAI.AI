import React, { useState } from 'react';
import { 
  Gamepad2, Crown, MessageSquare, Users, Zap, Trophy, Brain, Target, 
  Dice6, BarChart3, MapPin, Calculator, User, Hash, Bookmark, 
  Coffee, TrendingUp, Palette, Mic, AlertCircle, Clock,
  Star, Gift, Sparkles, Lightbulb, Heart, Gavel, FileText
} from 'lucide-react';
import WhichMinisterQuiz from '../quizzes/WhichMinisterQuiz';
import CreateYourOwnBill from '../features/fun/CreateYourOwnBill';

import { PageShell } from '@/components/patterns/PageShell';

interface FunFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: 'simulation' | 'gamification' | 'learning' | 'entertainment' | 'ai' | 'community';
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: string;
  status: 'available' | 'coming-soon' | 'beta';
  featured?: boolean;
}

const funFeatures: FunFeature[] = [
  // Role-Playing & Simulation Features
  {
    id: 'create-own-bill',
    title: 'Create Your Own Bill',
    description: 'Draft your own legislation with guided assistance. Get real-time feedback and review your bill for quality and structure.',
    icon: FileText,
    category: 'simulation',
    difficulty: 'Medium',
    estimatedTime: '20-40 min',
    status: 'available',
    featured: true
  },
  {
    id: 'be-a-minister',
    title: 'Be a Minister for a Day',
    description: 'Step into the shoes of a government minister. Answer questions, make policy decisions, and receive feedback on your performance.',
    icon: Crown,
    category: 'simulation',
    difficulty: 'Medium',
    estimatedTime: '30-45 min',
    status: 'coming-soon',
    featured: true
  },
  {
    id: 'debate-simulator',
    title: 'Parliamentary Debate Simulator',
    description: 'Join live debates on real issues, argue with AI opponents, and get scored on persuasiveness and fact-checking.',
    icon: MessageSquare,
    category: 'simulation',
    difficulty: 'Hard',
    estimatedTime: '20-30 min',
    status: 'coming-soon',
    featured: true
  },
  {
    id: 'coalition-builder',
    title: 'Coalition Builder Challenge',
    description: 'Form a government with limited seats. Negotiate with AI party leaders and balance competing interests.',
    icon: Users,
    category: 'simulation',
    difficulty: 'Hard',
    estimatedTime: '45-60 min',
    status: 'coming-soon'
  },
  {
    id: 'crisis-cabinet',
    title: 'Crisis Cabinet Meetings',
    description: 'Handle breaking scenarios like economic crisis or pandemic. Make time-pressured decisions and see consequences.',
    icon: Zap,
    category: 'simulation',
    difficulty: 'Hard',
    estimatedTime: '15-25 min',
    status: 'coming-soon'
  },

  // Gamification & Competition
  {
    id: 'prediction-markets',
    title: 'Political Prediction Markets',
    description: 'Bet virtual currency on political outcomes. Climb leaderboards and earn rewards for accurate forecasts.',
    icon: TrendingUp,
    category: 'gamification',
    difficulty: 'Medium',
    estimatedTime: '10-15 min',
    status: 'coming-soon'
  },
  {
    id: 'minister-quiz',
    title: 'Which Minister Are You?',
    description: 'Take a personality quiz to discover which minister matches your style and policy preferences.',
    icon: User,
    category: 'gamification',
    difficulty: 'Easy',
    estimatedTime: '5-10 min',
    status: 'available',
    featured: true
  },
  {
    id: 'trivia-nights',
    title: 'Parliamentary Trivia Nights',
    description: 'Join live multiplayer quiz sessions covering history, current affairs, procedures, and political scandals.',
    icon: Trophy,
    category: 'gamification',
    difficulty: 'Medium',
    estimatedTime: '20-30 min',
    status: 'coming-soon'
  },

  // Interactive Learning Tools
  {
    id: 'policy-simulator',
    title: 'Policy Impact Simulator',
    description: 'Adjust policy sliders and see real-time impact on economy, society, and environment based on real models.',
    icon: BarChart3,
    category: 'learning',
    difficulty: 'Medium',
    estimatedTime: '15-20 min',
    status: 'coming-soon'
  },
  {
    id: 'constituency-champion',
    title: 'Constituency Champion',
    description: 'Adopt a real constituency, track your TD\'s performance, and compete for the best-represented area.',
    icon: MapPin,
    category: 'learning',
    difficulty: 'Easy',
    estimatedTime: 'Ongoing',
    status: 'coming-soon'
  },
  {
    id: 'bill-tracker-game',
    title: 'Bill Tracker Game',
    description: 'Follow real legislation through the Oireachtas, predict outcomes, and earn points for accuracy.',
    icon: Bookmark,
    category: 'learning',
    difficulty: 'Medium',
    estimatedTime: 'Ongoing',
    status: 'coming-soon'
  },

  // Entertainment & Social Features
  {
    id: 'political-bingo',
    title: 'Political Bingo',
    description: 'Play bingo during live Dáil sessions with squares for common phrases, behaviors, and political clichés.',
    icon: Hash,
    category: 'entertainment',
    difficulty: 'Easy',
    estimatedTime: 'During sessions',
    status: 'coming-soon'
  },
  {
    id: 'mood-tracker',
    title: 'Minister Mood Tracker',
    description: 'AI analyzes facial expressions and tone during speeches to create daily mood reports for ministers.',
    icon: Heart,
    category: 'entertainment',
    difficulty: 'Easy',
    estimatedTime: '5 min',
    status: 'coming-soon'
  },
  {
    id: 'fashion-police',
    title: 'Parliamentary Fashion Police',
    description: 'Rate ministers\' outfits, track fashion trends, and compete in "Best Dressed TD" competitions.',
    icon: Palette,
    category: 'entertainment',
    difficulty: 'Easy',
    estimatedTime: '5-10 min',
    status: 'coming-soon'
  },
  {
    id: 'house-boss',
    title: 'House Boss',
    description: 'Try your hand at annoying the House Boss with unparliamentary language. See how long you can last before getting expelled!',
    icon: Gavel,
    category: 'entertainment',
    difficulty: 'Medium',
    estimatedTime: '10-15 min',
    status: 'beta',
    featured: true
  },

  // AI-Powered Interactive Features
  {
    id: 'ask-minister-ai',
    title: 'Ask Any Minister AI',
    description: 'Chat with AI versions of current and historical ministers trained on their speeches and policy positions.',
    icon: Brain,
    category: 'ai',
    difficulty: 'Easy',
    estimatedTime: '10-20 min',
    status: 'coming-soon',
    featured: true
  },
  {
    id: 'speech-generator',
    title: 'Political Speech Generator',
    description: 'Input policy positions and AI generates speeches in the style of your chosen minister.',
    icon: Mic,
    category: 'ai',
    difficulty: 'Medium',
    estimatedTime: '10-15 min',
    status: 'coming-soon'
  },
  {
    id: 'scandal-predictor',
    title: 'Scandal Predictor',
    description: 'AI predicts likelihood of future controversies based on minister behavior patterns and ethics.',
    icon: AlertCircle,
    category: 'ai',
    difficulty: 'Medium',
    estimatedTime: '5-10 min',
    status: 'coming-soon'
  },

  // Educational Mini-Games
  {
    id: 'constituency-tetris',
    title: 'Constituency Tetris',
    description: 'Redraw electoral boundaries while balancing population, geography, and political fairness.',
    icon: Dice6,
    category: 'learning',
    difficulty: 'Hard',
    estimatedTime: '20-30 min',
    status: 'coming-soon'
  },
  {
    id: 'budget-balancer',
    title: 'Budget Balancer',
    description: 'Allocate fixed revenue across spending priorities and watch approval ratings change in real-time.',
    icon: Calculator,
    category: 'learning',
    difficulty: 'Medium',
    estimatedTime: '15-25 min',
    status: 'coming-soon'
  },
  {
    id: 'whip-counter',
    title: 'Whip Counter',
    description: 'Predict TD voting patterns on contentious issues factoring in party loyalty and constituency pressure.',
    icon: Target,
    category: 'learning',
    difficulty: 'Hard',
    estimatedTime: '10-15 min',
    status: 'coming-soon'
  },

  // Community & Social Features
  {
    id: 'book-club',
    title: 'Political Book Club',
    description: 'Join monthly discussions of political memoirs with author Q&As and reading challenges.',
    icon: Bookmark,
    category: 'community',
    difficulty: 'Easy',
    estimatedTime: 'Ongoing',
    status: 'coming-soon'
  },
  {
    id: 'democracy-cafe',
    title: 'Democracy Café',
    description: 'Virtual coffee chats with other users to discuss current events and policy in moderated sessions.',
    icon: Coffee,
    category: 'community',
    difficulty: 'Easy',
    estimatedTime: '30-60 min',
    status: 'coming-soon'
  }
];

const categoryColors = {
  simulation: 'bg-purple-100 text-purple-800 border-purple-200',
  gamification: 'bg-orange-100 text-orange-800 border-orange-200',
  learning: 'bg-blue-100 text-blue-800 border-blue-200',
  entertainment: 'bg-pink-100 text-pink-800 border-pink-200',
  ai: 'bg-green-100 text-green-800 border-green-200',
  community: 'bg-yellow-100 text-yellow-800 border-yellow-200'
};

const statusColors = {
  available: 'bg-green-100 text-green-800',
  'coming-soon': 'bg-gray-100 text-gray-800',
  beta: 'bg-blue-100 text-blue-800'
};

const difficultyColors = {
  Easy: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  Hard: 'bg-red-100 text-red-800'
};

export default function Fun() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMinisterQuiz, setShowMinisterQuiz] = useState(false);
  const [showCreateBill, setShowCreateBill] = useState(false);

  const categories = [
    { id: 'all', label: 'All Features', count: funFeatures.length },
    { id: 'simulation', label: 'Simulation', count: funFeatures.filter(f => f.category === 'simulation').length },
    { id: 'gamification', label: 'Games', count: funFeatures.filter(f => f.category === 'gamification').length },
    { id: 'learning', label: 'Learning', count: funFeatures.filter(f => f.category === 'learning').length },
    { id: 'entertainment', label: 'Entertainment', count: funFeatures.filter(f => f.category === 'entertainment').length },
    { id: 'ai', label: 'AI-Powered', count: funFeatures.filter(f => f.category === 'ai').length },
    { id: 'community', label: 'Community', count: funFeatures.filter(f => f.category === 'community').length },
  ];

  const filteredFeatures = funFeatures.filter(feature => {
    const matchesCategory = selectedCategory === 'all' || feature.category === selectedCategory;
    const matchesSearch = feature.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feature.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredFeatures = funFeatures.filter(f => f.featured);

  const handleFeatureClick = (feature: FunFeature) => {
    if (feature.id === 'minister-quiz') {
      setShowMinisterQuiz(true);
    } else if (feature.id === 'create-own-bill') {
      setShowCreateBill(true);
    } else if (feature.status === 'coming-soon') {
      alert(`${feature.title} is coming soon! We're working hard to bring you this exciting feature.`);
    } else if (feature.status === 'beta') {
      alert(`${feature.title} is in beta! Some features may still be in development.`);
    } else {
      // Navigate to feature
      console.log(`Launching ${feature.title}`);
    }
  };

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Gamepad2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Fun Zone</h1>
            <p className="text-gray-600">Interactive games, simulations, and engaging parliamentary experiences</p>
          </div>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-700">{funFeatures.length}</div>
            <div className="text-sm text-purple-600">Total Features</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-700">{funFeatures.filter(f => f.status === 'available').length}</div>
            <div className="text-sm text-green-600">Available Now</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-700">{funFeatures.filter(f => f.status === 'beta').length}</div>
            <div className="text-sm text-blue-600">In Beta</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="text-2xl font-bold text-orange-700">{funFeatures.filter(f => f.status === 'coming-soon').length}</div>
            <div className="text-sm text-orange-600">Coming Soon</div>
          </div>
        </div>
      </div>

      {/* Featured Features */}
      {featuredFeatures.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500" />
            Featured Experiences
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredFeatures.map((feature) => {
              const Icon = feature.icon as React.ComponentType<{ className?: string }>;
              return (
                <div
                  key={feature.id}
                  onClick={() => handleFeatureClick(feature)}
                  className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[feature.status]}`}>
                        {feature.status === 'coming-soon' ? 'Coming Soon' : feature.status === 'beta' ? 'Beta' : 'Available'}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[feature.difficulty]}`}>
                        {feature.difficulty}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-600 mb-4">{feature.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {feature.estimatedTime}
                    </span>
                    <span className={`px-2 py-1 rounded-full border ${categoryColors[feature.category]}`}>
                      {feature.category}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search features..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.label} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredFeatures.map((feature) => {
          const Icon = feature.icon as React.ComponentType<{ className?: string }>;
          return (
            <div
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              className="bg-white border border-gray-200 rounded-xl p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:border-purple-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-gray-600" />
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[feature.status]}`}>
                    {feature.status === 'coming-soon' ? 'Coming Soon' : feature.status === 'beta' ? 'Beta' : 'Available'}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${difficultyColors[feature.difficulty]}`}>
                    {feature.difficulty}
                  </span>
                </div>
              </div>
              
              <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-sm text-gray-600 mb-4 line-clamp-3">{feature.description}</p>
              
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {feature.estimatedTime}
                </span>
                <span className={`px-2 py-1 rounded-full border ${categoryColors[feature.category]}`}>
                  {feature.category}
                </span>
              </div>

              {feature.status === 'coming-soon' && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Gift className="w-3 h-3" />
                    <span>Get notified when available</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredFeatures.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
          <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Coming Soon Banner */}
      <div className="mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-8 text-white text-center">
        <Lightbulb className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Have an Idea?</h2>
        <p className="text-purple-100 mb-4">
          We're always looking for new ways to make parliamentary data engaging and fun. 
          What interactive features would you like to see?
        </p>
        <button className="bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-purple-50 transition-colors">
          Submit Your Idea
        </button>
      </div>

      {/* Feature Modals */}
      {showMinisterQuiz && (
        <WhichMinisterQuiz onClose={() => setShowMinisterQuiz(false)} />
      )}
      
      {showCreateBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
          <div className="min-h-screen">
            <button
              onClick={() => setShowCreateBill(false)}
              className="fixed top-4 right-4 z-50 bg-white text-gray-700 px-4 py-2 rounded-lg shadow-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              ← Back to Fun Zone
            </button>
            <CreateYourOwnBill />
          </div>
        </div>
      )}
      </div>
    </PageShell>
  );
}