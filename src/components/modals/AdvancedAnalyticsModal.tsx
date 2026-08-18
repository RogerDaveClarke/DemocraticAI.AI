import { useState, useEffect } from 'react';
import { X, Sparkles, MessageSquare, Layers, Target, Heart, ThumbsUp, Scale, BarChart, TrendingUp, ChevronDown, ChevronUp, User, Calendar, FileText, HelpCircle, AlertTriangle } from 'lucide-react';
import WordCloudModal from './WordCloudModal';
import DebateContextModal from './DebateContextModal';

interface AnalyticsFeature {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  metrics: { label: string; value: string; trend?: string }[];
  insights: string[];
  status: 'active' | 'processing' | 'planned';
}

interface AdvancedAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  featureId?: string;
  embedded?: boolean;
}

export default function AdvancedAnalyticsModal({ isOpen, onClose, featureId, embedded = false }: AdvancedAnalyticsModalProps) {
  const [loading, setLoading] = useState(true);
  const [selectedFeature, setSelectedFeature] = useState<string>(featureId || 'unparliamentary');
  const [features, setFeatures] = useState<AnalyticsFeature[]>([]);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [expandedDetailViews, setExpandedDetailViews] = useState<Set<string>>(new Set());
  const [expandedMemberIncidents, setExpandedMemberIncidents] = useState<Set<string>>(new Set());
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [wordCloudModal, setWordCloudModal] = useState<{
    isOpen: boolean;
    memberName: string;
    debateTopic: string;
    date: string;
    emotionType: string;
    intensity: number;
  }>({
    isOpen: false,
    memberName: '',
    debateTopic: '',
    date: '',
    emotionType: '',
    intensity: 0
  });

  const [debateContextModal, setDebateContextModal] = useState<{
    isOpen: boolean;
    memberName: string;
    debateTitle: string;
    date: string;
    term: string;
    context: string;
    voteId?: string;
  }>({
    isOpen: false,
    memberName: '',
    debateTitle: '',
    date: '',
    term: '',
    context: '',
    voteId: ''
  });

  // House Boss Graph Filter States
  const [selectedBillFilter, setSelectedBillFilter] = useState('all');
  const [selectedVoteFilter, setSelectedVoteFilter] = useState('all');
  const [selectedMemberFilter, setSelectedMemberFilter] = useState('all');
  const [selectedDateFrom, setSelectedDateFrom] = useState('2024-01-01');
  const [selectedDateTo, setSelectedDateTo] = useState('2024-03-31');

  useEffect(() => {
    if (embedded || isOpen) {
      fetchAdvancedAnalytics();
    }
  }, [embedded, isOpen]);

  useEffect(() => {
    if (featureId) {
      setSelectedFeature(featureId);
    }
  }, [featureId]);

  const fetchAdvancedAnalytics = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockFeatures = generateMockFeatures();
      setFeatures(mockFeatures);
      setLoading(false);
    }, 1000);
  };

  const generateMockFeatures = (): AnalyticsFeature[] => {
    return [
      {
        id: 'question-patterns',
        name: 'Question Patterns',
        icon: <Sparkles className="w-6 h-6 text-teal-600" />,
        description: 'AI analysis of parliamentary question patterns and recurring themes across different time periods and members.',
        metrics: [
          { label: 'Total Questions Analyzed', value: '2,847', trend: '+12.3%' },
          { label: 'Pattern Categories', value: '47', trend: '+8.5%' },
          { label: 'Common Themes', value: '156', trend: '+15.2%' },
          { label: 'Member Participation', value: '89%', trend: '+3.1%' }
        ],
        insights: [
          'Housing-related questions increased by 34% in the last quarter',
          'Healthcare questions peak on Wednesdays during committee sessions',
          'Opposition members ask 2.3x more questions than government TDs',
          'Rural constituencies show 18% higher question frequency on transport issues'
        ],
        status: 'active'
      },
      {
        id: 'semantic-analysis',
        name: 'Semantic Analysis',
        icon: <MessageSquare className="w-6 h-6 text-cyan-600" />,
        description: 'Deep linguistic analysis extracting literal meaning from parliamentary speech and identifying semantic relationships.',
        metrics: [
          { label: 'Documents Processed', value: '12,439', trend: '+7.8%' },
          { label: 'Semantic Concepts', value: '3,247', trend: '+22.1%' },
          { label: 'Language Complexity', value: '7.2/10', trend: '+0.3%' },
          { label: 'Processing Accuracy', value: '94.7%', trend: '+1.2%' }
        ],
        insights: [
          'Technical language usage increased 15% during budget discussions',
          'Emotional intensity correlates with debate length (+67% correlation)',
          'Irish language usage peaks during cultural policy debates',
          'Parliamentary jargon complexity varies by 23% between chambers'
        ],
        status: 'active'
      },
      {
        id: 'discourse-integration',
        name: 'Discourse Integration',
        icon: <Layers className="w-6 h-6 text-indigo-600" />,
        description: 'Contextual analysis that understands meaning from surrounding sentences and broader parliamentary discourse.',
        metrics: [
          { label: 'Context Windows', value: '8,932', trend: '+19.4%' },
          { label: 'Reference Links', value: '4,567', trend: '+31.2%' },
          { label: 'Discourse Threads', value: '1,234', trend: '+8.7%' },
          { label: 'Context Accuracy', value: '91.3%', trend: '+2.8%' }
        ],
        insights: [
          'Cross-reference citations increased 28% during legislative reviews',
          'Contextual misunderstandings drop by 45% with discourse integration',
          'Thematic continuity spans average of 3.7 parliamentary sessions',
          'Committee discussions show 67% higher contextual complexity'
        ],
        status: 'processing'
      },
      {
        id: 'pragmatic-analysis',
        name: 'Pragmatic Analysis',
        icon: <Target className="w-6 h-6 text-amber-600" />,
        description: 'Understanding the underlying intentions and real meaning behind parliamentary statements and political rhetoric.',
        metrics: [
          { label: 'Intent Classifications', value: '5,678', trend: '+14.6%' },
          { label: 'Rhetoric Patterns', value: '234', trend: '+6.9%' },
          { label: 'Subtext Detection', value: '78.4%', trend: '+11.1%' },
          { label: 'Political Signals', value: '892', trend: '+25.3%' }
        ],
        insights: [
          'Indirect criticism techniques vary 34% between government and opposition',
          'Policy announcement timing correlates with upcoming elections (+78%)',
          'Diplomatic language increases 45% during international crisis periods',
          'Member voting intentions predicted with 84% accuracy from speech patterns'
        ],
        status: 'processing'
      },
      {
        id: 'emotion-detection',
        name: 'Emotion Detection',
        icon: <Heart className="w-6 h-6 text-pink-600" />,
        description: 'Advanced AI emotion recognition analyzing the emotional content and intensity in parliamentary speeches.',
        metrics: [
          { label: 'Emotional Markers', value: '15,672', trend: '+18.9%' },
          { label: 'Emotion Categories', value: '12', trend: 'stable' },
          { label: 'Intensity Levels', value: '6.8/10', trend: '+12.4%' },
          { label: 'Detection Accuracy', value: '87.2%', trend: '+4.7%' }
        ],
        insights: [
          'Anger peaks during budget debates with 67% higher intensity',
          'Passion levels correlate with public gallery attendance (+42%)',
          'Frustration indicators increase 23% before parliamentary recesses',
          'Empathy expressions double during social welfare discussions'
        ],
        status: 'planned'
      },
      {
        id: 'opinion-mining',
        name: 'Opinion Mining',
        icon: <ThumbsUp className="w-6 h-6 text-emerald-600" />,
        description: 'Systematic extraction and analysis of opinions, attitudes, and evaluations from parliamentary discourse.',
        metrics: [
          { label: 'Opinion Statements', value: '9,234', trend: '+16.7%' },
          { label: 'Stance Classifications', value: '4,567', trend: '+9.8%' },
          { label: 'Consensus Levels', value: '34.2%', trend: '-2.1%' },
          { label: 'Opinion Diversity', value: '7.9/10', trend: '+1.8%' }
        ],
        insights: [
          'Healthcare opinions show 56% polarization across party lines',
          'Environmental consensus increased 12% over the past year',
          'Economic policy opinions correlate 89% with constituency demographics',
          'Social issues show highest opinion diversity (8.7/10 complexity)'
        ],
        status: 'planned'
      },
      {
        id: 'bias-detection',
        name: 'Bias Detection',
        icon: <Scale className="w-6 h-6 text-slate-600" />,
        description: 'AI-powered identification of linguistic bias, framing effects, and argumentation patterns in parliamentary discourse.',
        metrics: [
          { label: 'Bias Indicators', value: '3,456', trend: '+7.3%' },
          { label: 'Framing Patterns', value: '789', trend: '+13.8%' },
          { label: 'Neutrality Score', value: '6.4/10', trend: '+0.9%' },
          { label: 'Detection Confidence', value: '83.7%', trend: '+5.2%' }
        ],
        insights: [
          'Gender bias decreased 18% in committee questioning patterns',
          'Regional bias peaks during infrastructure funding debates',
          'Media framing influences parliamentary language by average 23%',
          'Partisan bias detection accuracy improved to 91.3% with new algorithms'
        ],
        status: 'planned'
      },
      {
        id: 'unparliamentary',
        name: 'Unparliamentary Language',
        icon: <MessageSquare className="w-6 h-6 text-red-600" />,
        description: 'AI detection and analysis of unparliamentary language, including profanity, colloquialisms, and inappropriate expressions used in parliamentary discourse.',
        metrics: [
          { label: 'Unparliamentary Instances', value: '1,234', trend: '-8.3%' },
          { label: 'Severity Categories', value: '5', trend: 'stable' },
          { label: 'Most Common Terms', value: '23', trend: '+2.1%' },
          { label: 'Detection Accuracy', value: '92.4%', trend: '+3.7%' }
        ],
        insights: [
          'Usage decreased 8.3% overall following new parliamentary standards',
          'Most instances occur during heated budget and housing debates',
          'Irish colloquialisms account for 67% of detected instances',
          'Opposition members show 2.1x higher usage than government TDs'
        ],
        status: 'active'
      },
      {
        id: 'minister-efficiency',
        name: 'Minister Efficiency',
        icon: <BarChart className="w-6 h-6 text-blue-600" />,
        description: 'AI analysis of ministerial response patterns, question volumes, and response times to evaluate parliamentary efficiency and accountability.',
        metrics: [
          { label: 'Avg Questions per Debate', value: '18.7', trend: '+5.2%' },
          { label: 'Avg Response Time', value: '3.2 mins', trend: '-12.8%' },
          { label: 'Response Rate', value: '87.4%', trend: '+7.1%' },
          { label: 'Follow-up Questions', value: '4.3', trend: '+15.6%' }
        ],
        insights: [
          'Health Minister receives 34% more questions than other portfolios',
          'Response times improved significantly during remote sessions',
          'Tuesday Question Time shows highest ministerial participation',
          'Complex policy questions take 2.4x longer to answer on average'
        ],
        status: 'active'
      },
      {
        id: 'house-boss',
        name: 'House Boss (Ceann Comhairle)',
        icon: <Scale className="w-6 h-6 text-yellow-600" />,
        description: 'Analysis of the Ceann Comhairle\'s parliamentary management activities, including member reprimands, interventions, and order maintenance.',
        metrics: [
          { label: 'Total Interventions', value: '156', trend: '+18.3%' },
          { label: 'Member Reprimands', value: '47', trend: '+12.7%' },
          { label: 'Order Calls', value: '89', trend: '+8.9%' },
          { label: 'Session Control Rate', value: '94.2%', trend: '+2.1%' }
        ],
        insights: [
          'Housing debates require 3x more interventions than other topics',
          'Opposition members receive 62% of total reprimands',
          'Wednesday sessions show highest intervention frequency',
          'Unparliamentary language incidents increased 23% this quarter'
        ],
        status: 'active'
      }
    ];
  };

  const selectedFeatureData = features.find(f => f.id === selectedFeature);

  const questionPatternTrend = [74, 68, 80, 102, 141, 79, 91, 112, 96, 84, 126, 178, 88, 109, 123, 101, 186, 118, 151];
  const questionThemeData = [
    { name: 'Housing & Planning', value: 24, color: '#7c3aed' },
    { name: 'Health', value: 18, color: '#2563eb' },
    { name: 'Transport', value: 14, color: '#16a34a' },
    { name: 'Finance', value: 12, color: '#f59e0b' },
    { name: 'Environment', value: 8, color: '#ec4899' },
    { name: 'Education', value: 7, color: '#38bdf8' },
    { name: 'Other', value: 17, color: '#cbd5e1' },
  ];
  const topActiveMembers = [
    { name: 'Mary Clarke', questions: 128, initials: 'MC' },
    { name: 'John Power', questions: 112, initials: 'JP' },
    { name: 'Aisling O\'Connor', questions: 98, initials: 'AO' },
    { name: 'Lucinda Burke', questions: 91, initials: 'LB' },
    { name: 'Darren Byrne', questions: 87, initials: 'DB' },
  ];

  const buildLinePath = (values: number[], width = 620, height = 230) => {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = Math.max(max - min, 1);

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = height - ((value - min) / range) * (height - 26) - 8;
        return `${index === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(' ');
  };

  const questionLinePath = buildLinePath(questionPatternTrend);
  const questionAreaPath = `${questionLinePath} L 620 230 L 0 230 Z`;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-yellow-100 text-yellow-800';
      case 'planned': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendColor = (trend?: string) => {
    if (!trend) return 'text-gray-500';
    return trend.startsWith('+') ? 'text-green-600' : trend.startsWith('-') ? 'text-red-600' : 'text-gray-600';
  };

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const toggleDetailView = (detailId: string) => {
    const newExpanded = new Set(expandedDetailViews);
    if (newExpanded.has(detailId)) {
      newExpanded.delete(detailId);
    } else {
      newExpanded.add(detailId);
    }
    setExpandedDetailViews(newExpanded);
  };

  const openWordCloudModal = (memberName: string, debateTopic: string, date: string, emotionType: string, intensity: number) => {
    setWordCloudModal({
      isOpen: true,
      memberName,
      debateTopic,
      date,
      emotionType,
      intensity
    });
  };

  const closeWordCloudModal = () => {
    setWordCloudModal(prev => ({ ...prev, isOpen: false }));
  };

  const openDebateContextModal = (memberName: string, debateTitle: string, date: string, term: string, context: string, voteId?: string) => {
    setDebateContextModal({
      isOpen: true,
      memberName,
      debateTitle,
      date,
      term,
      context,
      voteId
    });
  };

  const closeDebateContextModal = () => {
    setDebateContextModal(prev => ({ ...prev, isOpen: false }));
  };

  // Mock data for emotional markers
  const getEmotionalMarkersData = () => {
    return {
      markers: [
        {
          id: 'anger',
          name: 'Anger',
          intensity: 8.4,
          frequency: 156,
          trend: '+23.5%',
          color: 'bg-red-500',
          description: 'High-intensity anger markers detected in parliamentary speeches',
          examples: [
            { member: 'John McCarthy TD', debate: 'Housing Crisis Response', date: '2024-03-15', intensity: 9.2 },
            { member: 'Sarah O\'Brien TD', debate: 'Healthcare Budget Cuts', date: '2024-03-12', intensity: 8.7 },
            { member: 'Michael Walsh TD', debate: 'Climate Action Delays', date: '2024-03-10', intensity: 8.9 }
          ]
        },
        {
          id: 'frustration',
          name: 'Frustration',
          intensity: 7.2,
          frequency: 203,
          trend: '+18.9%',
          color: 'bg-orange-500',
          description: 'Elevated frustration levels in parliamentary discourse',
          examples: [
            { member: 'Emma Collins TD', debate: 'Transport Infrastructure', date: '2024-03-14', intensity: 7.8 },
            { member: 'David Ryan TD', debate: 'Public Service Reforms', date: '2024-03-11', intensity: 7.1 },
            { member: 'Lisa Murphy TD', debate: 'Digital Services Act', date: '2024-03-09', intensity: 7.5 }
          ]
        },
        {
          id: 'passion',
          name: 'Passion',
          intensity: 8.9,
          frequency: 189,
          trend: '+31.2%',
          color: 'bg-purple-500',
          description: 'Strong passionate expressions during debates',
          examples: [
            { member: 'Patrick Sullivan TD', debate: 'Education Funding', date: '2024-03-13', intensity: 9.4 },
            { member: 'Rachel Green TD', debate: 'Social Welfare Reform', date: '2024-03-08', intensity: 8.6 },
            { member: 'James Foster TD', debate: 'Rural Development', date: '2024-03-07', intensity: 8.8 }
          ]
        },
        {
          id: 'empathy',
          name: 'Empathy',
          intensity: 6.8,
          frequency: 142,
          trend: '+42.1%',
          color: 'bg-blue-500',
          description: 'Expressions of understanding and compassion',
          examples: [
            { member: 'Grace Kelly TD', debate: 'Mental Health Services', date: '2024-03-06', intensity: 7.3 },
            { member: 'Thomas Brown TD', debate: 'Disability Rights', date: '2024-03-05', intensity: 6.9 },
            { member: 'Anna Walsh TD', debate: 'Elder Care Crisis', date: '2024-03-04', intensity: 7.1 }
          ]
        }
      ]
    };
  };

  // Mock data for emotion categories
  const getEmotionCategoriesData = () => {
    return [
      {
        id: 'primary-anger',
        name: 'Primary Anger',
        occurrences: 1247,
        color: 'bg-red-500',
        description: 'Direct expressions of anger, outrage, and indignation in parliamentary discourse.',
        examples: [
          { 
            member: 'John McCarthy TD', 
            debate: 'Housing Crisis Response', 
            date: '2024-03-15', 
            intensity: 9.2,
            voteId: '2024-HC-001'
          },
          { 
            member: 'Sarah O\'Brien TD', 
            debate: 'Healthcare Budget Cuts', 
            date: '2024-03-12', 
            intensity: 8.7,
            voteId: '2024-HB-003'
          }
        ]
      },
      {
        id: 'constructive-criticism',
        name: 'Constructive Criticism',
        occurrences: 2156,
        color: 'bg-orange-500',
        description: 'Reasoned criticism and analytical opposition to policies and proposals.',
        examples: [
          { 
            member: 'Emma Collins TD', 
            debate: 'Transport Infrastructure', 
            date: '2024-03-14', 
            intensity: 6.8,
            voteId: '2024-TI-002'
          },
          { 
            member: 'David Ryan TD', 
            debate: 'Public Service Reforms', 
            date: '2024-03-11', 
            intensity: 7.1,
            voteId: '2024-PS-005'
          }
        ]
      },
      {
        id: 'passionate-advocacy',
        name: 'Passionate Advocacy',
        occurrences: 1823,
        color: 'bg-purple-500',
        description: 'Strong emotional support and advocacy for specific causes or policies.',
        examples: [
          { 
            member: 'Patrick Sullivan TD', 
            debate: 'Education Funding', 
            date: '2024-03-13', 
            intensity: 9.4,
            voteId: '2024-EF-001'
          },
          { 
            member: 'Rachel Green TD', 
            debate: 'Social Welfare Reform', 
            date: '2024-03-08', 
            intensity: 8.6,
            voteId: '2024-SW-004'
          }
        ]
      },
      {
        id: 'empathetic-concern',
        name: 'Empathetic Concern',
        occurrences: 1456,
        color: 'bg-blue-500',
        description: 'Expressions of genuine concern and understanding for citizens and communities.',
        examples: [
          { 
            member: 'Grace Kelly TD', 
            debate: 'Mental Health Services', 
            date: '2024-03-06', 
            intensity: 7.3,
            voteId: '2024-MH-002'
          },
          { 
            member: 'Thomas Brown TD', 
            debate: 'Disability Rights', 
            date: '2024-03-05', 
            intensity: 6.9,
            voteId: '2024-DR-001'
          }
        ]
      },
      {
        id: 'diplomatic-disagreement',
        name: 'Diplomatic Disagreement',
        occurrences: 982,
        color: 'bg-green-500',
        description: 'Polite but firm disagreement with opposing viewpoints and policies.',
        examples: [
          { 
            member: 'Anna Walsh TD', 
            debate: 'Trade Agreement Review', 
            date: '2024-03-04', 
            intensity: 5.2,
            voteId: '2024-TA-003'
          },
          { 
            member: 'Michael Chen TD', 
            debate: 'Immigration Policy', 
            date: '2024-03-03', 
            intensity: 5.8,
            voteId: '2024-IP-001'
          }
        ]
      },
      {
        id: 'celebratory-pride',
        name: 'Celebratory Pride',
        occurrences: 743,
        color: 'bg-yellow-500',
        description: 'Expressions of pride, celebration, and positive achievement recognition.',
        examples: [
          { 
            member: 'Jennifer Walsh TD', 
            debate: 'Economic Growth Report', 
            date: '2024-03-02', 
            intensity: 8.1,
            voteId: '2024-EG-001'
          },
          { 
            member: 'Robert Quinn TD', 
            debate: 'Scientific Innovation Fund', 
            date: '2024-03-01', 
            intensity: 7.7,
            voteId: '2024-SI-002'
          }
        ]
      }
    ];
  };

  // Mock data for intensity levels
  const getIntensityLevelsData = () => {
    return {
      distribution: [
        { range: '9.0-10.0', percentage: 8, count: 234, color: 'bg-red-600' },
        { range: '8.0-8.9', percentage: 15, count: 442, color: 'bg-red-500' },
        { range: '7.0-7.9', percentage: 23, count: 678, color: 'bg-orange-500' },
        { range: '6.0-6.9', percentage: 28, count: 825, color: 'bg-yellow-500' },
        { range: '5.0-5.9', percentage: 18, count: 531, color: 'bg-green-500' },
        { range: '4.0-4.9', percentage: 6, count: 177, color: 'bg-blue-500' },
        { range: '1.0-3.9', percentage: 2, count: 59, color: 'bg-gray-400' }
      ],
      topExamples: [
        {
          intensity: 9.8,
          member: 'John McCarthy TD',
          debate: 'Housing Crisis Emergency Session',
          date: '2024-03-15',
          voteId: '2024-HC-001',
          excerpt: 'This is an absolute disgrace! Families are sleeping in cars while we debate semantics!',
          emotions: ['Outrage', 'Moral Indignation', 'Urgency']
        },
        {
          intensity: 9.6,
          member: 'Patrick Sullivan TD',
          debate: 'Education Funding Cut Reversal',
          date: '2024-03-13',
          voteId: '2024-EF-001',
          excerpt: 'We cannot and will not stand by while our children\'s future is sacrificed for political expediency!',
          emotions: ['Passionate Advocacy', 'Protective Instinct', 'Determination']
        },
        {
          intensity: 9.4,
          member: 'Sarah O\'Brien TD',
          debate: 'Healthcare Staff Crisis',
          date: '2024-03-12',
          voteId: '2024-HB-003',
          excerpt: 'Nurses are leaving in droves because we have failed them. This ends now!',
          emotions: ['Frustration', 'Accountability', 'Resolve']
        },
        {
          intensity: 9.2,
          member: 'Rachel Green TD',
          debate: 'Social Welfare Reform Opposition',
          date: '2024-03-08',
          voteId: '2024-SW-004',
          excerpt: 'These cuts will devastate the most vulnerable in our society. I will not be complicit in this cruelty!',
          emotions: ['Moral Outrage', 'Protective Advocacy', 'Defiance']
        }
      ]
    };
  };

  // Mock data for unparliamentary language detection
  const getUnparliamentaryData = () => {
    return {
      categories: [
        {
          id: 'mild-profanity',
          name: 'Mild Profanity',
          occurrences: 423,
          severity: 'Low',
          color: 'bg-yellow-500',
          description: 'Mild swear words and colloquial expressions that breach parliamentary decorum.',
          examples: [
            { 
              member: 'John Murphy TD', 
              debate: 'Housing Crisis Response', 
              date: '2024-03-15', 
              term: 'feck',
              context: 'This fecking housing crisis is a national disgrace',
              voteId: '2024-HC-001'
            },
            { 
              member: 'Sarah Kelly TD', 
              debate: 'Transport Infrastructure', 
              date: '2024-03-12', 
              term: 'eejit',
              context: 'Any eejit can see this policy is flawed',
              voteId: '2024-TI-003'
            }
          ]
        },
        {
          id: 'strong-profanity',
          name: 'Strong Profanity',
          occurrences: 78,
          severity: 'High',
          color: 'bg-red-500',
          description: 'Serious profanity and inappropriate language requiring immediate intervention.',
          examples: [
            { 
              member: 'Michael O\'Brien TD', 
              debate: 'Budget Crisis Discussion', 
              date: '2024-03-10', 
              term: 'bollocks',
              context: 'This is complete bollocks and everyone knows it',
              voteId: '2024-BC-002'
            },
            { 
              member: 'Patricia Walsh TD', 
              debate: 'Healthcare Reforms', 
              date: '2024-03-08', 
              term: 'shag',
              context: 'I don\'t give a shag what the minister thinks',
              voteId: '2024-HR-001'
            }
          ]
        },
        {
          id: 'irish-colloquialisms',
          name: 'Irish Colloquialisms',
          occurrences: 567,
          severity: 'Medium',
          color: 'bg-orange-500',
          description: 'Irish slang and colloquial expressions inappropriate for formal parliamentary discourse.',
          examples: [
            { 
              member: 'David Ryan TD', 
              debate: 'Rural Development', 
              date: '2024-03-14', 
              term: 'gobshite',
              context: 'Don\'t be such a gobshite about rural issues',
              voteId: '2024-RD-003'
            },
            { 
              member: 'Emma Collins TD', 
              debate: 'Education Policy', 
              date: '2024-03-11', 
              term: 'thick',
              context: 'You\'d have to be thick to support this',
              voteId: '2024-EP-002'
            }
          ]
        },
        {
          id: 'derogatory-terms',
          name: 'Derogatory Terms',
          occurrences: 234,
          severity: 'High',
          color: 'bg-red-600',
          description: 'Offensive terms and personal attacks that violate parliamentary conduct.',
          examples: [
            { 
              member: 'James Foster TD', 
              debate: 'Social Welfare Reform', 
              date: '2024-03-09', 
              term: 'hoor',
              context: 'That minister is nothing but a political hoor',
              voteId: '2024-SW-005'
            },
            { 
              member: 'Rachel Green TD', 
              debate: 'Tax Policy Changes', 
              date: '2024-03-07', 
              term: 'langer',
              context: 'What kind of langer came up with this tax plan',
              voteId: '2024-TP-004'
            }
          ]
        },
        {
          id: 'inappropriate-expressions',
          name: 'Inappropriate Expressions',
          occurrences: 156,
          severity: 'Medium',
          color: 'bg-purple-500',
          description: 'Colorful expressions and inappropriate metaphors unsuitable for parliamentary proceedings.',
          examples: [
            { 
              member: 'Grace Murphy TD', 
              debate: 'Climate Action Plan', 
              date: '2024-03-06', 
              term: 'Acting the maggot',
              context: 'Stop acting the maggot and address climate change seriously',
              voteId: '2024-CA-005'
            },
            { 
              member: 'Thomas Brown TD', 
              debate: 'Immigration Policy', 
              date: '2024-03-04', 
              term: 'Face like a smacked arse',
              context: 'The minister has a face like a smacked arse when questioned',
              voteId: '2024-IP-003'
            }
          ]
        }
      ],
      trends: {
        weeklyAverage: 23.4,
        monthlyChange: '-8.3%',
        peakDays: ['Wednesday', 'Thursday'],
        commonDebates: ['Housing', 'Budget', 'Healthcare']
      },
      topOffenders: [
        { member: 'John Murphy TD', count: 47, trend: '+12%' },
        { member: 'Sarah Kelly TD', count: 39, trend: '-5%' },
        { member: 'Michael O\'Brien TD', count: 34, trend: '+8%' },
        { member: 'Patricia Walsh TD', count: 31, trend: '-15%' },
        { member: 'David Ryan TD', count: 28, trend: '+3%' }
      ]
    };
  };

  const getMinisterEfficiencyData = () => {
    return {
      ministers: [
        {
          id: 'health',
          name: 'Minister for Health',
          currentHolder: 'Stephen Donnelly TD',
          portfolio: 'Health',
          color: 'bg-blue-500',
          avgQuestionsPerDebate: 24.3,
          avgResponseTime: 4.2, // minutes
          responseRate: 89.2, // percentage
          followUpQuestions: 6.1,
          efficiency: 8.4, // out of 10
          trend: '+12.5%',
          questionCategories: [
            { category: 'Hospital Waiting Lists', count: 187, percentage: 28.3 },
            { category: 'Mental Health Services', count: 142, percentage: 21.5 },
            { category: 'Healthcare Funding', count: 129, percentage: 19.5 },
            { category: 'Primary Care Access', count: 98, percentage: 14.8 },
            { category: 'Drug Policy', count: 105, percentage: 15.9 }
          ],
          responseTimes: {
            simple: 2.1, // minutes
            complex: 5.8, // minutes
            policy: 7.2, // minutes
            statistical: 4.9 // minutes
          },
          recentQuestions: [
            {
              date: '2024-03-15',
              member: 'Louise O\'Reilly TD',
              question: 'What is the current status of the National Treatment Purchase Fund?',
              responseTime: 3.4,
              followUps: 2,
              complexity: 'complex',
              qualityScore: 8.2,
              responseLength: 342,
              substantiveAnswer: true,
              dataProvided: true,
              actionCommitment: 'partial'
            },
            {
              date: '2024-03-14',
              member: 'David Cullinane TD',
              question: 'How many people are currently on hospital waiting lists?',
              responseTime: 2.8,
              followUps: 4,
              complexity: 'statistical',
              qualityScore: 6.8,
              responseLength: 156,
              substantiveAnswer: false,
              dataProvided: true,
              actionCommitment: 'none'
            }
          ],
          qualityMetrics: {
            overallQualityScore: 7.4,
            responseCompleteness: 76.8, // percentage
            dataTransparency: 82.3, // percentage
            actionCommitments: 45.2, // percentage
            followUpSatisfaction: 68.9, // percentage
            averageResponseLength: 289, // words
            substantiveAnswerRate: 71.4, // percentage
            deflectionRate: 23.6, // percentage
            qualityTrends: {
              lastMonth: '+5.2%',
              lastQuarter: '+12.8%',
              yearOverYear: '+18.5%'
            },
            qualityBreakdown: {
              'excellent': { count: 89, percentage: 32.1 },
              'good': { count: 117, percentage: 42.2 },
              'adequate': { count: 52, percentage: 18.8 },
              'poor': { count: 19, percentage: 6.9 }
            },
            responseTypes: {
              'direct_answer': { count: 167, qualityAvg: 8.3 },
              'partial_answer': { count: 78, qualityAvg: 6.4 },
              'deflection': { count: 32, qualityAvg: 3.2 },
              'commitment_to_respond': { count: 23, qualityAvg: 5.8 }
            }
          }
        },
        {
          id: 'housing',
          name: 'Minister for Housing',
          currentHolder: 'Darragh O\'Brien TD',
          portfolio: 'Housing',
          color: 'bg-green-500',
          avgQuestionsPerDebate: 22.7,
          avgResponseTime: 3.8,
          responseRate: 91.5,
          followUpQuestions: 5.4,
          efficiency: 8.8,
          trend: '+8.2%',
          questionCategories: [
            { category: 'Social Housing', count: 156, percentage: 32.1 },
            { category: 'Rental Market', count: 134, percentage: 27.6 },
            { category: 'Planning Permission', count: 87, percentage: 17.9 },
            { category: 'Homelessness', count: 76, percentage: 15.6 },
            { category: 'Housing Costs', count: 33, percentage: 6.8 }
          ],
          responseTimes: {
            simple: 1.9,
            complex: 4.2,
            policy: 6.1,
            statistical: 3.7
          },
          recentQuestions: [
            {
              date: '2024-03-15',
              member: 'Eoin Ó Broin TD',
              question: 'What progress has been made on the Housing for All plan?',
              responseTime: 4.1,
              followUps: 3,
              complexity: 'policy',
              qualityScore: 8.7,
              responseLength: 425,
              substantiveAnswer: true,
              dataProvided: true,
              actionCommitment: 'full'
            },
            {
              date: '2024-03-13',
              member: 'Ivana Bacik TD',
              question: 'How many families are in emergency accommodation?',
              responseTime: 2.2,
              followUps: 1,
              complexity: 'statistical',
              qualityScore: 9.1,
              responseLength: 187,
              substantiveAnswer: true,
              dataProvided: true,
              actionCommitment: 'partial'
            }
          ],
          qualityMetrics: {
            overallQualityScore: 8.3,
            responseCompleteness: 85.4,
            dataTransparency: 89.1,
            actionCommitments: 67.3,
            followUpSatisfaction: 79.2,
            averageResponseLength: 312,
            substantiveAnswerRate: 84.7,
            deflectionRate: 11.2,
            qualityTrends: {
              lastMonth: '+8.1%',
              lastQuarter: '+15.3%',
              yearOverYear: '+22.4%'
            },
            qualityBreakdown: {
              'excellent': { count: 134, percentage: 42.6 },
              'good': { count: 126, percentage: 40.1 },
              'adequate': { count: 38, percentage: 12.1 },
              'poor': { count: 16, percentage: 5.1 }
            },
            responseTypes: {
              'direct_answer': { count: 198, qualityAvg: 8.8 },
              'partial_answer': { count: 89, qualityAvg: 7.2 },
              'deflection': { count: 18, qualityAvg: 4.1 },
              'commitment_to_respond': { count: 9, qualityAvg: 6.9 }
            }
          }
        },
        {
          id: 'education',
          name: 'Minister for Education',
          currentHolder: 'Norma Foley TD',
          portfolio: 'Education',
          color: 'bg-purple-500',
          avgQuestionsPerDebate: 18.9,
          avgResponseTime: 3.1,
          responseRate: 93.8,
          followUpQuestions: 4.2,
          efficiency: 9.1,
          trend: '+15.3%',
          questionCategories: [
            { category: 'School Infrastructure', count: 98, percentage: 26.4 },
            { category: 'Teacher Shortages', count: 89, percentage: 24.0 },
            { category: 'Special Needs Education', count: 76, percentage: 20.5 },
            { category: 'Higher Education', count: 65, percentage: 17.5 },
            { category: 'School Transport', count: 43, percentage: 11.6 }
          ],
          responseTimes: {
            simple: 1.7,
            complex: 3.9,
            policy: 5.2,
            statistical: 3.3
          },
          recentQuestions: [
            {
              date: '2024-03-14',
              member: 'Aodhán Ó Ríordáin TD',
              question: 'What measures are being taken to address teacher shortages?',
              responseTime: 3.6,
              followUps: 2,
              complexity: 'policy',
              qualityScore: 9.2,
              responseLength: 398,
              substantiveAnswer: true,
              dataProvided: true,
              actionCommitment: 'full'
            },
            {
              date: '2024-03-12',
              member: 'Jennifer Murnane O\'Connor TD',
              question: 'How many schools require urgent infrastructure repairs?',
              responseTime: 2.9,
              followUps: 3,
              complexity: 'statistical',
              qualityScore: 8.9,
              responseLength: 234,
              substantiveAnswer: true,
              dataProvided: true,
              actionCommitment: 'partial'
            }
          ],
          qualityMetrics: {
            overallQualityScore: 8.9,
            responseCompleteness: 91.2,
            dataTransparency: 93.6,
            actionCommitments: 78.4,
            followUpSatisfaction: 85.7,
            averageResponseLength: 342,
            substantiveAnswerRate: 91.8,
            deflectionRate: 6.2,
            qualityTrends: {
              lastMonth: '+11.4%',
              lastQuarter: '+19.7%',
              yearOverYear: '+28.3%'
            },
            qualityBreakdown: {
              'excellent': { count: 156, percentage: 48.9 },
              'good': { count: 132, percentage: 41.4 },
              'adequate': { count: 24, percentage: 7.5 },
              'poor': { count: 7, percentage: 2.2 }
            },
            responseTypes: {
              'direct_answer': { count: 234, qualityAvg: 9.1 },
              'partial_answer': { count: 67, qualityAvg: 7.8 },
              'deflection': { count: 12, qualityAvg: 4.8 },
              'commitment_to_respond': { count: 6, qualityAvg: 7.2 }
            }
          }
        },
        {
          id: 'finance',
          name: 'Minister for Finance',
          currentHolder: 'Paschal Donohoe TD',
          portfolio: 'Finance',
          color: 'bg-yellow-500',
          avgQuestionsPerDebate: 16.2,
          avgResponseTime: 2.9,
          responseRate: 87.3,
          followUpQuestions: 3.8,
          efficiency: 8.7,
          trend: '+5.8%',
          questionCategories: [
            { category: 'Taxation Policy', count: 112, percentage: 31.5 },
            { category: 'Government Spending', count: 89, percentage: 25.0 },
            { category: 'Economic Forecasts', count: 67, percentage: 18.8 },
            { category: 'Banking Regulation', count: 54, percentage: 15.2 },
            { category: 'EU Financial Policy', count: 33, percentage: 9.3 }
          ],
          responseTimes: {
            simple: 1.5,
            complex: 3.2,
            policy: 4.8,
            statistical: 2.7
          },
          recentQuestions: [
            {
              date: '2024-03-15',
              member: 'Pearse Doherty TD',
              question: 'What is the current status of the banking levy?',
              responseTime: 2.3,
              followUps: 4,
              complexity: 'policy',
              qualityScore: 7.8,
              responseLength: 278,
              substantiveAnswer: true,
              dataProvided: false,
              actionCommitment: 'partial'
            },
            {
              date: '2024-03-13',
              member: 'Michael McGrath TD',
              question: 'What are the latest tax revenue figures?',
              responseTime: 1.8,
              followUps: 1,
              complexity: 'statistical',
              qualityScore: 8.6,
              responseLength: 145,
              substantiveAnswer: true,
              dataProvided: true,
              actionCommitment: 'none'
            }
          ],
          qualityMetrics: {
            overallQualityScore: 8.1,
            responseCompleteness: 79.3,
            dataTransparency: 85.7,
            actionCommitments: 52.8,
            followUpSatisfaction: 74.6,
            averageResponseLength: 267,
            substantiveAnswerRate: 78.9,
            deflectionRate: 16.4,
            qualityTrends: {
              lastMonth: '+6.7%',
              lastQuarter: '+13.2%',
              yearOverYear: '+19.8%'
            },
            qualityBreakdown: {
              'excellent': { count: 98, percentage: 35.4 },
              'good': { count: 124, percentage: 44.8 },
              'adequate': { count: 43, percentage: 15.5 },
              'poor': { count: 12, percentage: 4.3 }
            },
            responseTypes: {
              'direct_answer': { count: 156, qualityAvg: 8.7 },
              'partial_answer': { count: 89, qualityAvg: 7.1 },
              'deflection': { count: 32, qualityAvg: 3.9 },
              'commitment_to_respond': { count: 17, qualityAvg: 6.2 }
            }
          }
        }
      ],
      trends: {
        overallEfficiency: 8.75,
        monthlyChange: '+10.2%',
        mostActiveDay: 'Wednesday',
        peakQuestionTime: '14:30-16:00',
        sessionTypes: {
          'Question Time': { questions: 1247, avgResponse: 2.8 },
          'Committee Sessions': { questions: 892, avgResponse: 4.1 },
          'Emergency Debates': { questions: 234, avgResponse: 3.9 },
          'Private Members': { questions: 156, avgResponse: 5.2 }
        }
      },
      qualityAnalytics: {
        overallQualityScore: 8.2,
        qualityTrendMonthly: '+8.8%',
        bestQualityPortfolio: 'Education',
        mostImprovedQuality: 'Housing',
        avgResponseLength: 302,
        substantiveAnswerRate: 81.7,
        dataTransparencyRate: 87.7,
        actionCommitmentRate: 60.9,
        deflectionRate: 14.4,
        qualityMetrics: {
          responseCompleteness: {
            health: 76.8,
            housing: 85.4,
            education: 91.2,
            finance: 79.3,
            average: 83.2
          },
          dataTransparency: {
            health: 82.3,
            housing: 89.1,
            education: 93.6,
            finance: 85.7,
            average: 87.7
          },
          actionCommitments: {
            health: 45.2,
            housing: 67.3,
            education: 78.4,
            finance: 52.8,
            average: 60.9
          }
        },
        qualityTrends: {
          excellent: { current: 39.2, trend: '+15.3%' },
          good: { current: 42.1, trend: '+8.7%' },
          adequate: { current: 13.5, trend: '-12.4%' },
          poor: { current: 5.2, trend: '-18.9%' }
        },
        questionComplexityQuality: {
          simple: { avgQuality: 8.7, satisfaction: 92.3 },
          complex: { avgQuality: 7.8, satisfaction: 76.4 },
          policy: { avgQuality: 8.1, satisfaction: 79.8 },
          statistical: { avgQuality: 8.4, satisfaction: 88.1 }
        }
      },
      comparativeAnalysis: {
        bestPerformer: 'Education',
        mostImproved: 'Health',
        highestVolume: 'Health',
        fastestResponse: 'Finance'
      }
    };
  };

  // Generate filtered graph data based on selected filters
  const getFilteredGraphData = () => {
    // Base data points for different time periods
    const baseData = {
      months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
      totalInterventions: [15, 18, 22, 16, 14, 19, 17],
      memberReprimands: [8, 11, 14, 9, 7, 12, 10],
      orderCalls: [4, 5, 6, 4, 3, 5, 4],
      sessionControl: [94, 92, 89, 95, 96, 91, 93]
    };

    // Apply filters to modify data
    let filteredData = { ...baseData };

    // Bill filter adjustments
    if (selectedBillFilter === 'housing') {
      filteredData.totalInterventions = [8, 12, 15, 9, 6, 11, 8];
      filteredData.memberReprimands = [5, 8, 10, 6, 4, 7, 5];
    } else if (selectedBillFilter === 'health') {
      filteredData.totalInterventions = [6, 9, 11, 7, 5, 8, 6];
      filteredData.memberReprimands = [3, 5, 7, 4, 3, 5, 3];
    } else if (selectedBillFilter === 'climate') {
      filteredData.totalInterventions = [4, 6, 8, 5, 3, 6, 4];
      filteredData.memberReprimands = [2, 3, 5, 3, 2, 4, 2];
    }

    // Vote filter adjustments
    if (selectedVoteFilter === 'budget') {
      filteredData.totalInterventions = filteredData.totalInterventions.map(val => Math.round(val * 1.3));
      filteredData.memberReprimands = filteredData.memberReprimands.map(val => Math.round(val * 1.2));
    } else if (selectedVoteFilter === 'motion') {
      filteredData.totalInterventions = filteredData.totalInterventions.map(val => Math.round(val * 0.8));
      filteredData.memberReprimands = filteredData.memberReprimands.map(val => Math.round(val * 0.9));
    }

    // Member filter adjustments
    if (selectedMemberFilter === 'opposition') {
      filteredData.totalInterventions = filteredData.totalInterventions.map(val => Math.round(val * 1.4));
      filteredData.memberReprimands = filteredData.memberReprimands.map(val => Math.round(val * 1.5));
    } else if (selectedMemberFilter === 'government') {
      filteredData.totalInterventions = filteredData.totalInterventions.map(val => Math.round(val * 0.7));
      filteredData.memberReprimands = filteredData.memberReprimands.map(val => Math.round(val * 0.6));
    } else if (selectedMemberFilter === 'independent') {
      filteredData.totalInterventions = filteredData.totalInterventions.map(val => Math.round(val * 0.3));
      filteredData.memberReprimands = filteredData.memberReprimands.map(val => Math.round(val * 0.4));
    }

    // Generate SVG path points
    const generatePoints = (data: number[], maxHeight = 180, minHeight = 20) => {
      const maxVal = Math.max(...data);
      const minVal = Math.min(...data);
      const range = maxVal - minVal || 1;
      
      return data.map((val, idx) => {
        const x = 100 + (idx * 100);
        const y = maxHeight - ((val - minVal) / range) * (maxHeight - minHeight);
        return `${x},${y}`;
      }).join(' ');
    };

    return {
      ...filteredData,
      totalInterventionsPoints: generatePoints(filteredData.totalInterventions),
      memberReprimandsPoints: generatePoints(filteredData.memberReprimands),
      orderCallsPoints: generatePoints(filteredData.orderCalls),
      sessionControlPoints: generatePoints(filteredData.sessionControl, 180, 20)
    };
  };

  // Ceann Comhairle (House Boss) Activity Data
  const getHouseBossData = () => {
    return {
      currentSpeaker: {
        name: 'Seán Ó Fearghaíl TD',
        constituency: 'Kildare South',
        termStart: '2016-03-10',
        yearsServing: 8.7,
        efficiency: 9.2,
        approval: 87.4
      },
      interventionSummary: {
        totalInterventions: 156,
        memberReprimands: 47,
        orderCalls: 89,
        warningsIssued: 34,
        sessionsSuspended: 3,
        membersEjected: 2,
        controlRate: 94.2
      },
      interventionsByType: [
        {
          type: 'Unparliamentary Language',
          count: 28,
          percentage: 59.6,
          trend: '+23.1%',
          severity: 'moderate',
          examples: [
            {
              date: '2024-03-15',
              member: 'Michael Collins TD',
              debate: 'Housing Crisis Response',
              incident: 'Called minister "a complete eejit" during heated exchange',
              action: 'Reprimand and request to withdraw',
              debateId: '2024-HC-001'
            },
            {
              date: '2024-03-12',
              member: 'Pearse Doherty TD',
              debate: 'Banking Inquiry Follow-up',
              incident: 'Used term "economic vandals" to describe government policy',
              action: 'Warning about inflammatory language',
              debateId: '2024-BI-003'
            }
          ]
        },
        {
          type: 'Disorderly Conduct',
          count: 12,
          percentage: 25.5,
          trend: '+8.7%',
          severity: 'high',
          examples: [
            {
              date: '2024-03-14',
              member: 'Richard Boyd Barrett TD',
              debate: 'Climate Emergency Debate',
              incident: 'Refused to resume seat after multiple requests',
              action: 'Formal reprimand and 5-minute suspension',
              debateId: '2024-CE-002'
            },
            {
              date: '2024-03-08',
              member: 'Danny Healy-Rae TD',
              debate: 'Rural Transport Fund',
              incident: 'Interrupted speaker continuously despite warnings',
              action: 'Asked to leave chamber for remainder of session',
              debateId: '2024-RT-001'
            }
          ]
        },
        {
          type: 'Procedural Violations',
          count: 7,
          percentage: 14.9,
          trend: '-5.4%',
          severity: 'low',
          examples: [
            {
              date: '2024-03-11',
              member: 'Catherine Murphy TD',
              debate: 'Social Protection Amendment',
              incident: 'Spoke without being called by the Chair',
              action: 'Gentle reminder about speaking order',
              debateId: '2024-SP-004'
            }
          ]
        }
      ],
      interventionsByMember: [
        {
          member: 'Michael Collins TD',
          party: 'Independent',
          constituency: 'Cork South-West',
          totalIncidents: 8,
          types: ['Unparliamentary Language', 'Disorderly Conduct'],
          lastIncident: '2024-03-15',
          severity: 'High',
          pattern: 'Housing and rural issues trigger most incidents'
        },
        {
          member: 'Pearse Doherty TD',
          party: 'Sinn Féin',
          constituency: 'Donegal',
          totalIncidents: 6,
          types: ['Unparliamentary Language', 'Procedural Violations'],
          lastIncident: '2024-03-12',
          severity: 'Moderate',
          pattern: 'Financial and economic debates primary trigger'
        },
        {
          member: 'Richard Boyd Barrett TD',
          party: 'People Before Profit',
          constituency: 'Dún Laoghaire',
          totalIncidents: 5,
          types: ['Disorderly Conduct'],
          lastIncident: '2024-03-14',
          severity: 'High',
          pattern: 'Climate and social justice debates'
        },
        {
          member: 'Danny Healy-Rae TD',
          party: 'Independent',
          constituency: 'Kerry',
          totalIncidents: 4,
          types: ['Disorderly Conduct', 'Procedural Violations'],
          lastIncident: '2024-03-08',
          severity: 'Moderate',
          pattern: 'Rural and transport infrastructure issues'
        }
      ],
      interventionsByTopic: [
        {
          topic: 'Housing Crisis',
          incidents: 18,
          percentage: 38.3,
          avgSeverity: 7.8,
          commonIssues: ['Heated exchanges', 'Personal attacks on ministers', 'Unparliamentary language'],
          recentDebate: 'Housing for All Implementation Review - 2024-03-15'
        },
        {
          topic: 'Healthcare Reform',
          incidents: 12,
          percentage: 25.5,
          avgSeverity: 6.9,
          commonIssues: ['Interruptions during ministerial responses', 'Emotional outbursts'],
          recentDebate: 'Mental Health Services Review - 2024-03-13'
        },
        {
          topic: 'Economic Policy',
          incidents: 9,
          percentage: 19.1,
          avgSeverity: 6.2,
          commonIssues: ['Accusations of economic mismanagement', 'Inflammatory language'],
          recentDebate: 'Budget 2024 Implementation - 2024-03-10'
        },
        {
          topic: 'Climate Action',
          incidents: 8,
          percentage: 17.0,
          avgSeverity: 8.1,
          commonIssues: ['Disorderly conduct', 'Refusal to follow Chair directions'],
          recentDebate: 'Climate Emergency Declaration - 2024-03-14'
        }
      ],
      monthlyTrends: {
        january: { interventions: 42, reprimands: 13, trend: 'stable' },
        february: { interventions: 38, reprimands: 11, trend: 'decreasing' },
        march: { interventions: 76, reprimands: 23, trend: 'increasing' }
      },
      effectivenessMetrics: {
        immediateCompliance: 89.4, // percentage
        repeatOffenders: 12.8, // percentage
        sessionControlMaintained: 94.2, // percentage
        averageInterventionTime: 1.8, // minutes
        debateFlowRestored: 91.7 // percentage
      },
      recentHighlights: [
        {
          date: '2024-03-15',
          session: 'Dáil Question Time',
          summary: 'Multiple interventions during housing debate - 3 reprimands issued',
          impact: 'Session extended by 15 minutes due to disruptions',
          outcome: 'Order successfully restored, productive debate resumed'
        },
        {
          date: '2024-03-14',
          session: 'Climate Emergency Debate',
          summary: 'One member ejected for continued disorderly conduct',
          impact: 'First ejection in 8 months - sent strong message about decorum',
          outcome: 'Immediate improvement in chamber behavior observed'
        },
        {
          date: '2024-03-12',
          session: 'Banking Inquiry Follow-up',
          summary: 'Economic debate required constant moderation',
          impact: '5 warnings issued, 2 formal reprimands',
          outcome: 'Debate concluded successfully despite tensions'
        }
      ]
    };
  };

  // Generate detailed incident data for specific members
  const getDetailedIncidentsForMember = (memberName: string) => {
    const incidentDatabase: { [key: string]: any[] } = {
      'Michael Collins TD': [
        {
          date: '2024-03-15',
          type: 'Unparliamentary Language',
          debate: 'Housing Crisis Emergency Response',
          severity: 'High',
          spokenText: "The minister is a complete eejit if he thinks this housing policy will work! This government has turned housing into a complete shambles!",
          action: 'Formal reprimand, required to withdraw statement',
          context: 'During heated exchange about Housing for All implementation delays',
          debateId: '2024-HC-001',
          fullContext: 'Debate context about Housing for All implementation and government response to housing crisis'
        },
        {
          date: '2024-03-10',
          type: 'Disorderly Conduct',
          debate: 'Rural Infrastructure Investment',
          severity: 'Moderate',
          spokenText: "You\'ve abandoned rural Ireland completely! This is a disgrace to every farmer and rural family!",
          action: 'Warning about tone and language',
          context: 'Frustrated response to cuts in rural development funding',
          debateId: '2024-RI-002',
          fullContext: 'Discussion on rural infrastructure investment and government commitment to rural development'
        },
        {
          date: '2024-03-05',
          type: 'Interruption',
          debate: 'Cork Regional Development Plan',
          severity: 'Moderate',
          spokenText: "That\'s absolute nonsense and you know it! Cork has been left behind for decades!",
          action: 'Asked to wait for proper speaking time',
          context: 'Interrupted minister during response about Cork development priorities',
          debateId: '2024-CD-001',
          fullContext: 'Regional development planning discussion focused on Cork infrastructure and investment priorities'
        }
      ],
      'Pearse Doherty TD': [
        {
          date: '2024-03-12',
          type: 'Unparliamentary Language',
          debate: 'Banking Sector Oversight Review',
          severity: 'Moderate',
          spokenText: "This government are nothing but economic vandals destroying the financial security of working families!",
          action: 'Warning about inflammatory language',
          context: 'Criticism of government economic policy during banking inquiry follow-up',
          debateId: '2024-BI-003',
          fullContext: 'Banking sector oversight review examining government financial policies and their impact on families'
        },
        {
          date: '2024-03-08',
          type: 'Procedural Violation',
          debate: 'Budget Implementation Review',
          severity: 'Low',
          spokenText: "The minister refuses to answer because he knows these figures are cooked!",
          action: 'Gentle reminder about speaking procedures',
          context: 'Spoke without being recognized during budget questions',
          debateId: '2024-BR-001',
          fullContext: 'Review of budget implementation progress and financial accountability measures'
        },
        {
          date: '2024-02-28',
          type: 'Persistent Questioning',
          debate: 'Tax Policy Reform Discussion',
          severity: 'Moderate',
          spokenText: "You cannot dodge this question forever! The people deserve straight answers about their tax burden!",
          action: 'Reminded about question time limits',
          context: 'Continued questioning beyond allocated time on tax reform',
          debateId: '2024-TP-004',
          fullContext: 'Tax policy reform discussion examining proposed changes to income tax and corporate tax rates'
        }
      ],
      'Richard Boyd Barrett TD': [
        {
          date: '2024-03-14',
          type: 'Disorderly Conduct',
          debate: 'Climate Emergency Declaration Review',
          severity: 'High',
          spokenText: "This is climate vandalism! You\'re destroying our children\'s future while corporations profit!",
          action: 'Formal reprimand and 5-minute suspension',
          context: 'Refused to resume seat after multiple requests during climate debate',
          debateId: '2024-CE-002',
          fullContext: 'Review of climate emergency declaration and government progress on climate action commitments'
        },
        {
          date: '2024-03-09',
          type: 'Interruption',
          debate: 'Social Justice Housing Initiative',
          severity: 'Moderate',
          spokenText: "Housing is a human right, not a commodity for your developer friends!",
          action: 'Asked to wait for proper speaking opportunity',
          context: 'Interrupted during ministerial response about housing policy',
          debateId: '2024-SH-001',
          fullContext: 'Discussion on social justice housing initiative and affordable housing development strategies'
        },
        {
          date: '2024-03-01',
          type: 'Passionate Outburst',
          debate: 'Environmental Protection Funding',
          severity: 'Moderate',
          spokenText: "Every day of delay is another step toward environmental catastrophe! Action is needed now!",
          action: 'Reminded about speaking time and decorum',
          context: 'Emotional response to environmental funding cuts',
          debateId: '2024-EP-003',
          fullContext: 'Environmental protection funding debate examining budget allocations for climate and conservation programs'
        }
      ],
      'Danny Healy-Rae TD': [
        {
          date: '2024-03-08',
          type: 'Disorderly Conduct',
          debate: 'Rural Transport Infrastructure Review',
          severity: 'High',
          spokenText: "Ye have no idea what rural Ireland needs! This government is destroying rural communities!",
          action: 'Asked to leave chamber for remainder of session',
          context: 'Interrupted speaker continuously despite warnings about rural transport',
          debateId: '2024-RT-001',
          fullContext: 'Rural transport infrastructure review examining public transport accessibility in rural areas'
        },
        {
          date: '2024-02-25',
          type: 'Procedural Violation',
          debate: 'Kerry Tourism Development Fund',
          severity: 'Moderate',
          spokenText: "Kerry tourism is being strangled by bureaucratic red tape and government neglect!",
          action: 'Reminded about proper speaking procedures',
          context: 'Spoke out of turn during tourism development discussion',
          debateId: '2024-KT-002',
          fullContext: 'Kerry tourism development fund discussion examining regional tourism investment and development priorities'
        },
        {
          date: '2024-02-20',
          type: 'Emotional Appeal',
          debate: 'Rural Broadband Expansion',
          severity: 'Low',
          spokenText: "Rural families are being left in the digital dark ages while Dublin gets everything!",
          action: 'No action required - within bounds',
          context: 'Passionate appeal for rural broadband investment',
          debateId: '2024-RB-005',
          fullContext: 'Rural broadband expansion debate examining digital infrastructure development in rural Ireland'
        }
      ]
    };

    return incidentDatabase[memberName] || [
      {
        date: '2024-03-01',
        type: 'General Incident',
        debate: 'Parliamentary Procedures',
        severity: 'Low',
        spokenText: 'Standard parliamentary exchange requiring speaker guidance.',
        action: 'Standard procedural reminder',
        context: 'Routine parliamentary procedure matter',
        debateId: '2024-PP-001',
        fullContext: 'General parliamentary procedures and standing orders discussion'
      }
    ];
  };

  // Unparliamentary Language Analysis Data
  const getUnparliamentaryLanguageData = () => {
    return {
      summary: {
        totalIncidents: 134,
        uniqueTerms: 48,
        averagePerWeek: 8.7,
        mostActiveMonth: 'March 2024',
        interventionRate: 92.3,
        withdrawalRate: 76.1
      },
      termCategories: [
        {
          category: 'Personal Attacks',
          count: 42,
          percentage: 31.3,
          trend: '+15.2%',
          severity: 'high',
          examples: [
            {
              term: 'eejit',
              frequency: 8,
              lastUsed: '2024-03-15',
              context: 'Directed at ministers during policy debates',
              member: 'Michael Collins TD',
              debate: 'Housing Crisis Response'
            },
            {
              term: 'incompetent fool',
              frequency: 5,
              lastUsed: '2024-03-12',
              context: 'During economic policy discussion',
              member: 'Various TDs',
              debate: 'Budget Implementation Review'
            }
          ]
        },
        {
          category: 'Inflammatory Language',
          count: 38,
          percentage: 28.4,
          trend: '+8.7%',
          severity: 'moderate',
          examples: [
            {
              term: 'economic vandals',
              frequency: 6,
              lastUsed: '2024-03-12',
              context: 'Criticism of government economic policy',
              member: 'Pearse Doherty TD',
              debate: 'Banking Sector Oversight'
            },
            {
              term: 'complete shambles',
              frequency: 9,
              lastUsed: '2024-03-10',
              context: 'Housing and infrastructure debates',
              member: 'Multiple TDs',
              debate: 'Various housing debates'
            }
          ]
        },
        {
          category: 'Disrespectful Terms',
          count: 29,
          percentage: 21.6,
          trend: '+12.1%',
          severity: 'moderate',
          examples: [
            {
              term: 'disgrace',
              frequency: 12,
              lastUsed: '2024-03-14',
              context: 'Rural and regional development issues',
              member: 'Danny Healy-Rae TD',
              debate: 'Rural Transport Infrastructure'
            },
            {
              term: 'absolute nonsense',
              frequency: 7,
              lastUsed: '2024-03-11',
              context: 'Policy disagreements and rebuttals',
              member: 'Various TDs',
              debate: 'Multiple policy debates'
            }
          ]
        },
        {
          category: 'Unparliamentary Accusations',
          count: 25,
          percentage: 18.7,
          trend: '+5.3%',
          severity: 'high',
          examples: [
            {
              term: 'liar',
              frequency: 4,
              lastUsed: '2024-02-28',
              context: 'Disputes over factual accuracy',
              member: 'Opposition TDs',
              debate: 'Government accountability sessions'
            },
            {
              term: 'corrupt',
              frequency: 3,
              lastUsed: '2024-03-01',
              context: 'Allegations during investigations',
              member: 'Various opposition members',
              debate: 'Ethics and transparency debates'
            }
          ]
        }
      ],
      memberStatistics: [
        {
          member: 'Michael Collins TD',
          party: 'Independent',
          constituency: 'Cork South-West',
          totalInstances: 18,
          uniqueTerms: 8,
          mostUsedTerm: 'eejit',
          primaryContext: 'Housing and rural issues',
          interventionResponse: 'Generally complies with Speaker requests'
        },
        {
          member: 'Pearse Doherty TD',
          party: 'Sinn Féin',
          constituency: 'Donegal',
          totalInstances: 14,
          uniqueTerms: 6,
          mostUsedTerm: 'economic vandals',
          primaryContext: 'Economic and financial policy',
          interventionResponse: 'Usually withdraws statements when requested'
        },
        {
          member: 'Richard Boyd Barrett TD',
          party: 'People Before Profit',
          constituency: 'Dún Laoghaire',
          totalInstances: 12,
          uniqueTerms: 7,
          mostUsedTerm: 'climate vandalism',
          primaryContext: 'Environmental and social justice',
          interventionResponse: 'Sometimes resistant to withdrawal requests'
        },
        {
          member: 'Danny Healy-Rae TD',
          party: 'Independent',
          constituency: 'Kerry',
          totalInstances: 11,
          uniqueTerms: 5,
          mostUsedTerm: 'disgrace',
          primaryContext: 'Rural development and transport',
          interventionResponse: 'Mixed compliance with Speaker directions'
        }
      ],
      topicAnalysis: [
        {
          topic: 'Housing Policy',
          incidents: 34,
          percentage: 25.4,
          commonTerms: ['shambles', 'disaster', 'crisis', 'eejit'],
          emotionalIntensity: 8.2,
          speakerInterventions: 31
        },
        {
          topic: 'Economic Policy',
          incidents: 28,
          percentage: 20.9,
          commonTerms: ['vandals', 'incompetent', 'disaster', 'nonsense'],
          emotionalIntensity: 7.8,
          speakerInterventions: 26
        },
        {
          topic: 'Healthcare',
          incidents: 22,
          percentage: 16.4,
          commonTerms: ['disgrace', 'shambles', 'failure'],
          emotionalIntensity: 7.5,
          speakerInterventions: 20
        },
        {
          topic: 'Climate Action',
          incidents: 18,
          percentage: 13.4,
          commonTerms: ['vandalism', 'catastrophe', 'destruction'],
          emotionalIntensity: 8.7,
          speakerInterventions: 17
        }
      ],
      monthlyTrends: {
        january: { incidents: 38, withdrawals: 29, newTerms: 3 },
        february: { incidents: 42, withdrawals: 31, newTerms: 5 },
        march: { incidents: 54, withdrawals: 41, newTerms: 7 }
      },
      speakerActions: {
        totalInterventions: 124,
        withdrawalRequests: 89,
        complianceRate: 76.1,
        formalReprimands: 23,
        suspensions: 3,
        averageResponseTime: '45 seconds'
      },
      contextualExamples: [
        {
          date: '2024-03-15',
          member: 'Michael Collins TD',
          term: 'complete eejit',
          context: 'Housing Crisis Emergency Response debate',
          fullQuote: 'The minister is a complete eejit if he thinks this housing policy will work!',
          speakerAction: 'Required immediate withdrawal and apology',
          outcome: 'Statement withdrawn, debate continued',
          debateId: '2024-HC-001'
        },
        {
          date: '2024-03-12',
          member: 'Pearse Doherty TD',
          term: 'economic vandals',
          context: 'Banking Sector Oversight Review',
          fullQuote: 'This government are nothing but economic vandals destroying working families!',
          speakerAction: 'Warning about inflammatory language',
          outcome: 'Member continued with modified language',
          debateId: '2024-BI-003'
        },
        {
          date: '2024-03-14',
          member: 'Richard Boyd Barrett TD',
          term: 'climate vandalism',
          context: 'Climate Emergency Declaration Review',
          fullQuote: 'This is climate vandalism! You\'re destroying our children\'s future!',
          speakerAction: 'Formal reprimand for inflammatory language',
          outcome: 'Member temporarily suspended from speaking',
          debateId: '2024-CE-002'
        }
      ]
    };
  };

  // Generate comprehensive marker data for detailed views
  const getAllEmotionalMarkers = (markerId: string) => {
    const baseMarkers: { [key: string]: any[] } = {
      'anger': [
        { member: 'John McCarthy TD', debate: 'Housing Crisis Response', date: '2024-03-15', intensity: 9.2, voteId: '2024-HC-001' },
        { member: 'Sarah O\'Brien TD', debate: 'Healthcare Budget Cuts', date: '2024-03-12', intensity: 8.7, voteId: '2024-HB-003' },
        { member: 'Michael Walsh TD', debate: 'Climate Action Delays', date: '2024-03-10', intensity: 8.9, voteId: '2024-CA-002' },
        { member: 'Patricia Ryan TD', debate: 'Education Funding Crisis', date: '2024-03-08', intensity: 8.3, voteId: '2024-EF-005' },
        { member: 'David Collins TD', debate: 'Transport Infrastructure', date: '2024-03-06', intensity: 7.8, voteId: '2024-TI-003' },
        { member: 'Emma Kelly TD', debate: 'Rural Broadband Delays', date: '2024-03-04', intensity: 8.1, voteId: '2024-RB-001' },
        { member: 'Thomas Murphy TD', debate: 'Public Service Cuts', date: '2024-03-02', intensity: 7.9, voteId: '2024-PS-006' },
        { member: 'Lisa Brown TD', debate: 'Mental Health Services', date: '2024-02-28', intensity: 8.4, voteId: '2024-MH-004' }
      ],
      'frustration': [
        { member: 'Emma Collins TD', debate: 'Transport Infrastructure', date: '2024-03-14', intensity: 7.8, voteId: '2024-TI-002' },
        { member: 'David Ryan TD', debate: 'Public Service Reforms', date: '2024-03-11', intensity: 7.1, voteId: '2024-PS-005' },
        { member: 'Lisa Murphy TD', debate: 'Digital Services Act', date: '2024-03-09', intensity: 7.5, voteId: '2024-DS-001' },
        { member: 'Patrick O\'Connor TD', debate: 'Planning Permission Delays', date: '2024-03-07', intensity: 7.3, voteId: '2024-PP-002' },
        { member: 'Rachel Walsh TD', debate: 'Childcare Support Fund', date: '2024-03-05', intensity: 6.9, voteId: '2024-CS-003' },
        { member: 'James Foster TD', debate: 'Agricultural Subsidies', date: '2024-03-03', intensity: 7.2, voteId: '2024-AS-001' },
        { member: 'Grace O\'Sullivan TD', debate: 'University Funding', date: '2024-03-01', intensity: 7.0, voteId: '2024-UF-002' }
      ],
      'passion': [
        { member: 'Patrick Sullivan TD', debate: 'Education Funding', date: '2024-03-13', intensity: 9.4, voteId: '2024-EF-001' },
        { member: 'Rachel Green TD', debate: 'Social Welfare Reform', date: '2024-03-08', intensity: 8.6, voteId: '2024-SW-004' },
        { member: 'James Foster TD', debate: 'Rural Development', date: '2024-03-07', intensity: 8.8, voteId: '2024-RD-001' },
        { member: 'Anna McCarthy TD', debate: 'Climate Action Plan', date: '2024-03-05', intensity: 9.1, voteId: '2024-CA-003' },
        { member: 'Michael O\'Brien TD', debate: 'Youth Employment', date: '2024-03-03', intensity: 8.5, voteId: '2024-YE-001' },
        { member: 'Jennifer Collins TD', debate: 'Arts and Culture Fund', date: '2024-03-01', intensity: 8.7, voteId: '2024-AC-002' }
      ],
      'empathy': [
        { member: 'Grace Kelly TD', debate: 'Mental Health Services', date: '2024-03-06', intensity: 7.3, voteId: '2024-MH-002' },
        { member: 'Thomas Brown TD', debate: 'Disability Rights', date: '2024-03-05', intensity: 6.9, voteId: '2024-DR-001' },
        { member: 'Anna Walsh TD', debate: 'Elder Care Crisis', date: '2024-03-04', intensity: 7.1, voteId: '2024-EC-001' },
        { member: 'Robert Quinn TD', debate: 'Homelessness Initiative', date: '2024-03-02', intensity: 7.5, voteId: '2024-HI-001' },
        { member: 'Mary O\'Sullivan TD', debate: 'Domestic Violence Support', date: '2024-02-29', intensity: 7.8, voteId: '2024-DV-001' },
        { member: 'Daniel Murphy TD', debate: 'Refugee Integration', date: '2024-02-27', intensity: 7.2, voteId: '2024-RI-002' }
      ]
    };
    return baseMarkers[markerId] || [];
  };

  const getAllCategoryInstances = (categoryId: string) => {
    const baseCategories: { [key: string]: any[] } = {
      'primary-anger': [
        { member: 'John McCarthy TD', debate: 'Housing Crisis Response', date: '2024-03-15', intensity: 9.2, voteId: '2024-HC-001' },
        { member: 'Sarah O\'Brien TD', debate: 'Healthcare Budget Cuts', date: '2024-03-12', intensity: 8.7, voteId: '2024-HB-003' },
        { member: 'Michael Walsh TD', debate: 'Climate Action Delays', date: '2024-03-10', intensity: 8.9, voteId: '2024-CA-002' },
        { member: 'Patricia Ryan TD', debate: 'Education Funding Crisis', date: '2024-03-08', intensity: 8.3, voteId: '2024-EF-005' },
        { member: 'David Collins TD', debate: 'Transport Infrastructure', date: '2024-03-06', intensity: 7.8, voteId: '2024-TI-003' }
      ],
      'constructive-criticism': [
        { member: 'Emma Collins TD', debate: 'Transport Infrastructure', date: '2024-03-14', intensity: 6.8, voteId: '2024-TI-002' },
        { member: 'David Ryan TD', debate: 'Public Service Reforms', date: '2024-03-11', intensity: 7.1, voteId: '2024-PS-005' },
        { member: 'Lisa Murphy TD', debate: 'Digital Services Act', date: '2024-03-09', intensity: 6.5, voteId: '2024-DS-001' },
        { member: 'Patrick O\'Connor TD', debate: 'Planning Permission Reform', date: '2024-03-07', intensity: 6.9, voteId: '2024-PP-002' },
        { member: 'Rachel Walsh TD', debate: 'Taxation Policy Review', date: '2024-03-05', intensity: 7.0, voteId: '2024-TP-001' }
      ],
      'passionate-advocacy': [
        { member: 'Patrick Sullivan TD', debate: 'Education Funding', date: '2024-03-13', intensity: 9.4, voteId: '2024-EF-001' },
        { member: 'Rachel Green TD', debate: 'Social Welfare Reform', date: '2024-03-08', intensity: 8.6, voteId: '2024-SW-004' },
        { member: 'James Foster TD', debate: 'Rural Development', date: '2024-03-07', intensity: 8.8, voteId: '2024-RD-001' },
        { member: 'Anna McCarthy TD', debate: 'Climate Action Plan', date: '2024-03-05', intensity: 9.1, voteId: '2024-CA-003' },
        { member: 'Michael O\'Brien TD', debate: 'Youth Employment', date: '2024-03-03', intensity: 8.5, voteId: '2024-YE-001' }
      ],
      'empathetic-concern': [
        { member: 'Grace Kelly TD', debate: 'Mental Health Services', date: '2024-03-06', intensity: 7.3, voteId: '2024-MH-002' },
        { member: 'Thomas Brown TD', debate: 'Disability Rights', date: '2024-03-05', intensity: 6.9, voteId: '2024-DR-001' },
        { member: 'Anna Walsh TD', debate: 'Elder Care Crisis', date: '2024-03-04', intensity: 7.1, voteId: '2024-EC-001' },
        { member: 'Robert Quinn TD', debate: 'Homelessness Initiative', date: '2024-03-02', intensity: 7.5, voteId: '2024-HI-001' },
        { member: 'Mary O\'Sullivan TD', debate: 'Domestic Violence Support', date: '2024-02-29', intensity: 7.8, voteId: '2024-DV-001' }
      ],
      'diplomatic-disagreement': [
        { member: 'Anna Walsh TD', debate: 'Trade Agreement Review', date: '2024-03-04', intensity: 5.2, voteId: '2024-TA-003' },
        { member: 'Michael Chen TD', debate: 'Immigration Policy', date: '2024-03-03', intensity: 5.8, voteId: '2024-IP-001' },
        { member: 'Jennifer Murphy TD', debate: 'EU Relations Framework', date: '2024-03-01', intensity: 5.5, voteId: '2024-EU-002' },
        { member: 'Daniel O\'Connor TD', debate: 'Foreign Aid Budget', date: '2024-02-28', intensity: 5.3, voteId: '2024-FA-001' },
        { member: 'Patricia Collins TD', debate: 'International Trade', date: '2024-02-26', intensity: 5.7, voteId: '2024-IT-003' }
      ],
      'celebratory-pride': [
        { member: 'Jennifer Walsh TD', debate: 'Economic Growth Report', date: '2024-03-02', intensity: 8.1, voteId: '2024-EG-001' },
        { member: 'Robert Quinn TD', debate: 'Scientific Innovation Fund', date: '2024-03-01', intensity: 7.7, voteId: '2024-SI-002' },
        { member: 'Sarah Murphy TD', debate: 'Tourism Recovery Success', date: '2024-02-28', intensity: 7.9, voteId: '2024-TR-001' },
        { member: 'James O\'Brien TD', debate: 'Green Energy Achievements', date: '2024-02-26', intensity: 8.3, voteId: '2024-GE-002' },
        { member: 'Lisa Collins TD', debate: 'Cultural Heritage Project', date: '2024-02-24', intensity: 7.8, voteId: '2024-CH-001' }
      ]
    };
    return baseCategories[categoryId] || [];
  };

  const getAllUnparliamentaryMarkers = (categoryId: string) => {
    const baseUnparliamentary: { [key: string]: any[] } = {
      'mild-profanity': [
        { member: 'John Murphy TD', debate: 'Housing Crisis Response', date: '2024-03-15', term: 'feck', context: 'This fecking housing crisis is a national disgrace', voteId: '2024-HC-001' },
        { member: 'Sarah Kelly TD', debate: 'Transport Infrastructure', date: '2024-03-12', term: 'eejit', context: 'Any eejit can see this policy is flawed', voteId: '2024-TI-003' },
        { member: 'David Walsh TD', debate: 'Rural Development', date: '2024-03-10', term: 'jaysus', context: 'Jaysus, this is taking forever to implement', voteId: '2024-RD-002' },
        { member: 'Emma O\'Brien TD', debate: 'Education Funding', date: '2024-03-08', term: 'gob', context: 'Keep your gob shut and listen for once', voteId: '2024-EF-004' },
        { member: 'Michael Collins TD', debate: 'Healthcare Reform', date: '2024-03-06', term: 'arse', context: 'Get off your arse and do something about it', voteId: '2024-HR-005' },
        { member: 'Patricia Ryan TD', debate: 'Climate Action', date: '2024-03-04', term: 'dose', context: 'This minister is such a dose', voteId: '2024-CA-003' },
        { member: 'Thomas Brown TD', debate: 'Social Welfare', date: '2024-03-02', term: 'divil', context: 'The divil knows what they\'re thinking', voteId: '2024-SW-002' }
      ],
      'strong-profanity': [
        { member: 'Michael O\'Brien TD', debate: 'Budget Crisis Discussion', date: '2024-03-10', term: 'bollocks', context: 'This is complete bollocks and everyone knows it', voteId: '2024-BC-002' },
        { member: 'Patricia Walsh TD', debate: 'Healthcare Reforms', date: '2024-03-08', term: 'shag', context: 'I don\'t give a shag what the minister thinks', voteId: '2024-HR-001' },
        { member: 'James Foster TD', debate: 'Tax Policy', date: '2024-03-06', term: 'fuck', context: 'This is absolutely fuck all use to anyone', voteId: '2024-TP-003' },
        { member: 'Rachel Green TD', debate: 'Transport Crisis', date: '2024-03-04', term: 'bollix', context: 'What a load of bollix from the minister', voteId: '2024-TC-001' },
        { member: 'Daniel Murphy TD', debate: 'Rural Broadband', date: '2024-03-02', term: 'twat', context: 'Don\'t be such a twat about broadband funding', voteId: '2024-RB-004' }
      ],
      'irish-colloquialisms': [
        { member: 'David Ryan TD', debate: 'Rural Development', date: '2024-03-14', term: 'gobshite', context: 'Don\'t be such a gobshite about rural issues', voteId: '2024-RD-003' },
        { member: 'Emma Collins TD', debate: 'Education Policy', date: '2024-03-11', term: 'thick', context: 'You\'d have to be thick to support this', voteId: '2024-EP-002' },
        { member: 'Lisa Murphy TD', debate: 'Immigration Policy', date: '2024-03-09', term: 'culchie', context: 'Every culchie in the country knows this is wrong', voteId: '2024-IP-002' },
        { member: 'Robert Quinn TD', debate: 'Urban Planning', date: '2024-03-07', term: 'townie', context: 'Typical townie response to rural problems', voteId: '2024-UP-001' },
        { member: 'Grace Kelly TD', debate: 'Social Housing', date: '2024-03-05', term: 'yoke', context: 'This whole yoke is a disaster waiting to happen', voteId: '2024-SH-003' },
        { member: 'Anna Walsh TD', debate: 'Public Transport', date: '2024-03-03', term: 'ride', context: 'This policy is a right ride', voteId: '2024-PT-002' },
        { member: 'Patrick Sullivan TD', debate: 'Energy Policy', date: '2024-03-01', term: 'gobdaw', context: 'What gobdaw thought this would work', voteId: '2024-EN-001' }
      ],
      'derogatory-terms': [
        { member: 'James Foster TD', debate: 'Social Welfare Reform', date: '2024-03-09', term: 'hoor', context: 'That minister is nothing but a political hoor', voteId: '2024-SW-005' },
        { member: 'Rachel Green TD', debate: 'Tax Policy Changes', date: '2024-03-07', term: 'langer', context: 'What kind of langer came up with this tax plan', voteId: '2024-TP-004' },
        { member: 'Mary O\'Sullivan TD', debate: 'Healthcare Budget', date: '2024-03-05', term: 'wagon', context: 'The minister is acting like a right wagon', voteId: '2024-HB-002' },
        { member: 'Daniel Collins TD', debate: 'Education Cuts', date: '2024-03-03', term: 'skanger', context: 'Only a skanger would cut education funding', voteId: '2024-EC-004' },
        { member: 'Jennifer Murphy TD', debate: 'Environmental Policy', date: '2024-03-01', term: 'sleeveen', context: 'This sleeveen approach to climate action won\'t work', voteId: '2024-EP-005' }
      ],
      'inappropriate-expressions': [
        { member: 'Grace Murphy TD', debate: 'Climate Action Plan', date: '2024-03-06', term: 'Acting the maggot', context: 'Stop acting the maggot and address climate change seriously', voteId: '2024-CA-005' },
        { member: 'Thomas Brown TD', debate: 'Immigration Policy', date: '2024-03-04', term: 'Face like a smacked arse', context: 'The minister has a face like a smacked arse when questioned', voteId: '2024-IP-003' },
        { member: 'Sarah Murphy TD', debate: 'Housing Policy', date: '2024-03-02', term: 'Dry Shite', context: 'This proposal is drier than dry shite', voteId: '2024-HP-001' },
        { member: 'Robert Walsh TD', debate: 'Transport Funding', date: '2024-02-29', term: 'Tool', context: 'What kind of tool approved this transport plan', voteId: '2024-TF-002' },
        { member: 'Lisa O\'Brien TD', debate: 'Public Services', date: '2024-02-27', term: 'Muppet', context: 'The minister is a complete muppet on public service reform', voteId: '2024-PS-003' }
      ]
    };
    return baseUnparliamentary[categoryId] || [];
  };

  const getAllBiasIndicators = (indicatorId: string) => {
    const baseBiasIndicators: { [key: string]: any[] } = {
      'gender-bias': [
        { member: 'Patrick O\'Sullivan TD', debate: 'Committee Hearing - Education', date: '2024-03-15', severity: 6.1, pattern: 'Interrupting female speakers 3x more frequently', voteId: 'CH-ED-001' },
        { member: 'John McCarthy TD', debate: 'Health Committee Session', date: '2024-03-12', severity: 5.8, pattern: 'Using diminutive language when addressing women ministers', voteId: 'HC-MIN-003' },
        { member: 'David Collins TD', debate: 'Budget Committee Review', date: '2024-03-10', severity: 5.4, pattern: 'Questioning competence based on gender stereotypes', voteId: 'BC-REV-002' },
        { member: 'Thomas Murphy TD', debate: 'Transport Infrastructure Committee', date: '2024-03-08', severity: 6.3, pattern: 'Dismissive tone when female TDs raise technical issues', voteId: 'TIC-TECH-001' },
        { member: 'Robert Walsh TD', debate: 'Finance Committee Session', date: '2024-03-06', severity: 5.9, pattern: 'Assuming financial inexperience based on gender', voteId: 'FC-FIN-004' }
      ],
      'partisan-bias': [
        { member: 'Sarah Kelly TD', debate: 'Opposition Response Session', date: '2024-03-14', severity: 8.9, pattern: 'Systematic dismissal of government proposals regardless of merit', voteId: 'ORS-GOV-001' },
        { member: 'Michael Walsh TD', debate: 'Policy Implementation Review', date: '2024-03-11', severity: 8.2, pattern: 'Cherry-picking statistics to support party position', voteId: 'PIR-STAT-002' },
        { member: 'Emma Collins TD', debate: 'Economic Measures Debate', date: '2024-03-09', severity: 7.6, pattern: 'Using loaded language to describe opposition policies', voteId: 'EMD-POL-003' },
        { member: 'James Foster TD', debate: 'Social Policy Review', date: '2024-03-07', severity: 8.5, pattern: 'Attacking messenger rather than addressing policy merits', voteId: 'SPR-MES-001' },
        { member: 'Rachel Green TD', debate: 'Environmental Policy Session', date: '2024-03-05', severity: 7.9, pattern: 'Predetermined opposition regardless of environmental evidence', voteId: 'EPS-ENV-002' }
      ],
      'regional-bias': [
        { member: 'James Foster TD', debate: 'Infrastructure Funding Allocation', date: '2024-03-13', severity: 7.1, pattern: 'Dismissing rural concerns as "special interests"', voteId: 'IFA-RUR-001' },
        { member: 'Patricia Walsh TD', debate: 'Transport Policy Review', date: '2024-03-08', severity: 6.3, pattern: 'Prioritizing urban solutions without rural consideration', voteId: 'TPR-URB-002' },
        { member: 'Rachel Green TD', debate: 'Broadband Infrastructure', date: '2024-03-06', severity: 5.8, pattern: 'Using Dublin-centric examples for national policies', voteId: 'BI-DUB-003' },
        { member: 'Anna Murphy TD', debate: 'Agricultural Support Schemes', date: '2024-03-04', severity: 6.7, pattern: 'Urban bias in rural economic policy discussions', voteId: 'ASS-ECO-001' },
        { member: 'Daniel O\'Connor TD', debate: 'Regional Development Fund', date: '2024-03-02', severity: 6.2, pattern: 'Coastal bias in inland development planning', voteId: 'RDF-INL-002' }
      ],
      'socioeconomic-bias': [
        { member: 'Thomas Brown TD', debate: 'Social Welfare Reform', date: '2024-03-07', severity: 7.8, pattern: 'Assuming moral failings behind economic hardship', voteId: 'SWR-MOR-001' },
        { member: 'Grace Murphy TD', debate: 'Housing Crisis Response', date: '2024-03-05', severity: 6.9, pattern: 'Victim-blaming language regarding homelessness', voteId: 'HCR-HOM-002' },
        { member: 'Anna Walsh TD', debate: 'Education Access Debate', date: '2024-03-03', severity: 6.2, pattern: 'Merit-based arguments ignoring systemic barriers', voteId: 'EAD-MER-003' },
        { member: 'Robert Quinn TD', debate: 'Healthcare Accessibility', date: '2024-03-01', severity: 7.1, pattern: 'Class assumptions about healthcare utilization', voteId: 'HA-CLA-001' },
        { member: 'Lisa O\'Brien TD', debate: 'Youth Employment Programs', date: '2024-02-28', severity: 6.5, pattern: 'Stereotyping based on socioeconomic background', voteId: 'YEP-STE-002' }
      ],
      'confirmation-bias': [
        { member: 'Robert Quinn TD', debate: 'Climate Action Effectiveness', date: '2024-03-04', severity: 6.5, pattern: 'Ignoring contradictory environmental data', voteId: 'CAE-ENV-001' },
        { member: 'Lisa Murphy TD', debate: 'Healthcare Outcomes Review', date: '2024-03-02', severity: 5.9, pattern: 'Citing only supportive statistics while omitting context', voteId: 'HOR-STA-002' },
        { member: 'Daniel O\'Brien TD', debate: 'Economic Recovery Analysis', date: '2024-02-29', severity: 5.1, pattern: 'Selective interpretation of employment figures', voteId: 'ERA-EMP-003' },
        { member: 'Jennifer Collins TD', debate: 'Education Policy Assessment', date: '2024-02-27', severity: 6.3, pattern: 'Cherry-picking research that supports predetermined position', voteId: 'EPA-RES-001' },
        { member: 'Mary Walsh TD', debate: 'Immigration Impact Study', date: '2024-02-25', severity: 5.7, pattern: 'Dismissing studies that contradict personal beliefs', voteId: 'IIS-STU-002' }
      ]
    };
    return baseBiasIndicators[indicatorId] || [];
  };

  const getAllFramingPatterns = (patternId: string) => {
    const baseFramingPatterns: { [key: string]: any[] } = {
      'crisis-framing': [
        { member: 'John McCarthy TD', debate: 'Housing Emergency Session', date: '2024-03-15', context: 'Framing housing issues as "national emergency" to bypass normal procedures', effectiveness: 9.1, voteId: 'HES-EME-001' },
        { member: 'Sarah O\'Brien TD', debate: 'Healthcare Crisis Response', date: '2024-03-12', context: 'Using "crisis" terminology to justify increased spending', effectiveness: 8.7, voteId: 'HCR-CRI-002' },
        { member: 'Michael Walsh TD', debate: 'Climate Emergency Declaration', date: '2024-03-10', context: 'Emergency framing to accelerate environmental legislation', effectiveness: 8.9, voteId: 'CED-EME-003' },
        { member: 'Patricia Ryan TD', debate: 'Education Crisis Summit', date: '2024-03-08', context: 'Crisis language to justify teacher recruitment measures', effectiveness: 8.3, voteId: 'ECS-TEA-001' },
        { member: 'David Collins TD', debate: 'Transport Crisis Forum', date: '2024-03-06', context: 'Emergency framing for public transport funding', effectiveness: 7.9, voteId: 'TCF-PUB-002' }
      ],
      'economic-necessity': [
        { member: 'Emma Collins TD', debate: 'Tax Policy Reform', date: '2024-03-14', context: 'Presenting tax increases as "economic necessity" rather than policy choice', effectiveness: 8.2, voteId: 'TPR-TAX-001' },
        { member: 'David Ryan TD', debate: 'Public Service Restructuring', date: '2024-03-11', context: 'Framing cuts as "fiscal responsibility" to gain support', effectiveness: 7.8, voteId: 'PSR-FIS-002' },
        { member: 'Lisa Brown TD', debate: 'International Trade Agreement', date: '2024-03-09', context: 'Presenting trade deals as "no alternative" scenarios', effectiveness: 7.1, voteId: 'ITA-TRA-003' },
        { member: 'James Foster TD', debate: 'Pension Reform Discussion', date: '2024-03-07', context: 'Economic inevitability framing for pension changes', effectiveness: 7.6, voteId: 'PRD-PEN-001' },
        { member: 'Grace Kelly TD', debate: 'Infrastructure Investment', date: '2024-03-05', context: 'Economic necessity framing for borrowing decisions', effectiveness: 8.0, voteId: 'II-BOR-002' }
      ],
      'moral-imperative': [
        { member: 'Grace Kelly TD', debate: 'Mental Health Services', date: '2024-03-13', context: 'Framing mental health funding as "moral duty" to citizens', effectiveness: 9.3, voteId: 'MHS-MOR-001' },
        { member: 'Patrick Sullivan TD', debate: 'Child Protection Laws', date: '2024-03-08', context: 'Using moral language to overcome opposition to surveillance measures', effectiveness: 9.1, voteId: 'CPL-SUR-002' },
        { member: 'Rachel Green TD', debate: 'Social Welfare Expansion', date: '2024-03-06', context: 'Moral framing of welfare as "basic human dignity"', effectiveness: 8.4, voteId: 'SWE-DIG-003' },
        { member: 'Thomas Brown TD', debate: 'Healthcare Access Rights', date: '2024-03-04', context: 'Moral imperative framing for universal healthcare', effectiveness: 8.8, voteId: 'HAR-UNI-001' },
        { member: 'Anna Walsh TD', debate: 'Disability Support Services', date: '2024-03-02', context: 'Moral duty framing for increased disability funding', effectiveness: 9.0, voteId: 'DSS-DIS-002' }
      ],
      'security-concern': [
        { member: 'James Foster TD', debate: 'Digital Privacy Legislation', date: '2024-03-07', context: 'Framing surveillance as "national security necessity"', effectiveness: 7.8, voteId: 'DPL-SEC-001' },
        { member: 'Anna Murphy TD', debate: 'Immigration Policy Changes', date: '2024-03-05', context: 'Security framing to justify stricter border controls', effectiveness: 7.1, voteId: 'IPC-BOR-002' },
        { member: 'Thomas Collins TD', debate: 'Public Order Laws', date: '2024-03-03', context: 'Safety concerns used to limit protest rights', effectiveness: 6.7, voteId: 'POL-PRO-003' },
        { member: 'Robert O\'Sullivan TD', debate: 'Cybersecurity Measures', date: '2024-03-01', context: 'Security framing for internet monitoring powers', effectiveness: 7.5, voteId: 'CM-INT-001' },
        { member: 'Mary Kelly TD', debate: 'Counter-Terrorism Legislation', date: '2024-02-28', context: 'Security necessity framing for expanded police powers', effectiveness: 7.3, voteId: 'CTL-POL-002' }
      ],
      'generational-responsibility': [
        { member: 'Jennifer Walsh TD', debate: 'Climate Action Plan', date: '2024-03-04', context: 'Framing environmental policies as "duty to our children"', effectiveness: 8.9, voteId: 'CAP-CHI-001' },
        { member: 'Robert O\'Sullivan TD', debate: 'Education Investment', date: '2024-03-02', context: 'Using future generation arguments for increased education spending', effectiveness: 8.2, voteId: 'EI-EDU-002' },
        { member: 'Mary Kelly TD', debate: 'Pension Reform', date: '2024-02-29', context: 'Framing pension changes as "securing retirement for the young"', effectiveness: 7.3, voteId: 'PR-RET-003' },
        { member: 'Daniel Murphy TD', debate: 'National Debt Discussion', date: '2024-02-27', context: 'Generational responsibility for fiscal management', effectiveness: 7.8, voteId: 'NDD-FIS-001' },
        { member: 'Lisa Collins TD', debate: 'Infrastructure Legacy Planning', date: '2024-02-25', context: 'Future generations framing for infrastructure investment', effectiveness: 8.1, voteId: 'ILP-INF-002' }
      ]
    };
    return baseFramingPatterns[patternId] || [];
  };

  // Generate member usage statistics for unparliamentary language
  const getMemberUsageStatistics = () => {
    return [
      { 
        member: 'John Murphy TD', 
        totalUsage: 47, 
        trend: '+12%', 
        party: 'Fianna Fáil',
        constituency: 'Dublin South-Central',
        breakdown: {
          'mild-profanity': 18,
          'strong-profanity': 3,
          'irish-colloquialisms': 15,
          'derogatory-terms': 7,
          'inappropriate-expressions': 4
        },
        recentTerms: ['feck', 'eejit', 'gobshite', 'bollocks', 'acting the maggot'],
        lastIncident: '2024-03-15'
      },
      { 
        member: 'Sarah Kelly TD', 
        totalUsage: 39, 
        trend: '-5%', 
        party: 'Fine Gael',
        constituency: 'Cork North-Central',
        breakdown: {
          'mild-profanity': 16,
          'strong-profanity': 2,
          'irish-colloquialisms': 12,
          'derogatory-terms': 5,
          'inappropriate-expressions': 4
        },
        recentTerms: ['jaysus', 'thick', 'dose', 'twat', 'face like a smacked arse'],
        lastIncident: '2024-03-12'
      },
      { 
        member: 'Michael O\'Brien TD', 
        totalUsage: 34, 
        trend: '+8%', 
        party: 'Sinn Féin',
        constituency: 'Galway West',
        breakdown: {
          'mild-profanity': 12,
          'strong-profanity': 5,
          'irish-colloquialisms': 9,
          'derogatory-terms': 4,
          'inappropriate-expressions': 4
        },
        recentTerms: ['bollocks', 'shag', 'gobdaw', 'tool', 'dry shite'],
        lastIncident: '2024-03-10'
      },
      { 
        member: 'Patricia Walsh TD', 
        totalUsage: 31, 
        trend: '-15%', 
        party: 'Labour',
        constituency: 'Limerick City',
        breakdown: {
          'mild-profanity': 14,
          'strong-profanity': 1,
          'irish-colloquialisms': 11,
          'derogatory-terms': 3,
          'inappropriate-expressions': 2
        },
        recentTerms: ['arse', 'culchie', 'wagon', 'muppet', 'take the piss'],
        lastIncident: '2024-03-08'
      },
      { 
        member: 'David Ryan TD', 
        totalUsage: 28, 
        trend: '+3%', 
        party: 'Green Party',
        constituency: 'Dublin Bay North',
        breakdown: {
          'mild-profanity': 10,
          'strong-profanity': 2,
          'irish-colloquialisms': 8,
          'derogatory-terms': 4,
          'inappropriate-expressions': 4
        },
        recentTerms: ['gobshite', 'feck', 'yoke', 'tosser', 'holy show'],
        lastIncident: '2024-03-14'
      },
      { 
        member: 'Emma Collins TD', 
        totalUsage: 26, 
        trend: '-2%', 
        party: 'Social Democrats',
        constituency: 'Wicklow',
        breakdown: {
          'mild-profanity': 11,
          'strong-profanity': 1,
          'irish-colloquialisms': 9,
          'derogatory-terms': 3,
          'inappropriate-expressions': 2
        },
        recentTerms: ['thick', 'gas', 'savage', 'gowl', 'cop on'],
        lastIncident: '2024-03-11'
      },
      { 
        member: 'James Foster TD', 
        totalUsage: 24, 
        trend: '+7%', 
        party: 'Independent',
        constituency: 'Kerry North',
        breakdown: {
          'mild-profanity': 8,
          'strong-profanity': 3,
          'irish-colloquialisms': 7,
          'derogatory-terms': 4,
          'inappropriate-expressions': 2
        },
        recentTerms: ['hoor', 'langer', 'gombeen', 'poxy', 'arseways'],
        lastIncident: '2024-03-09'
      },
      { 
        member: 'Rachel Green TD', 
        totalUsage: 22, 
        trend: '-8%', 
        party: 'Fianna Fáil',
        constituency: 'Mayo',
        breakdown: {
          'mild-profanity': 9,
          'strong-profanity': 2,
          'irish-colloquialisms': 6,
          'derogatory-terms': 3,
          'inappropriate-expressions': 2
        },
        recentTerms: ['langer', 'townie', 'mucker', 'geebag', 'steamin'],
        lastIncident: '2024-03-07'
      },
      { 
        member: 'Grace Murphy TD', 
        totalUsage: 19, 
        trend: '+1%', 
        party: 'Fine Gael',
        constituency: 'Waterford',
        breakdown: {
          'mild-profanity': 8,
          'strong-profanity': 1,
          'irish-colloquialisms': 6,
          'derogatory-terms': 2,
          'inappropriate-expressions': 2
        },
        recentTerms: ['acting the maggot', 'janey mack', 'boyo', 'quare', 'brutal'],
        lastIncident: '2024-03-06'
      },
      { 
        member: 'Thomas Brown TD', 
        totalUsage: 17, 
        trend: '-12%', 
        party: 'Sinn Féin',
        constituency: 'Donegal',
        breakdown: {
          'mild-profanity': 7,
          'strong-profanity': 1,
          'irish-colloquialisms': 5,
          'derogatory-terms': 2,
          'inappropriate-expressions': 2
        },
        recentTerms: ['face like a smacked arse', 'oul fella', 'deadly', 'manky', 'scarlet'],
        lastIncident: '2024-03-04'
      },
      { 
        member: 'Anna Walsh TD', 
        totalUsage: 15, 
        trend: '-6%', 
        party: 'Labour',
        constituency: 'Clare',
        breakdown: {
          'mild-profanity': 6,
          'strong-profanity': 0,
          'irish-colloquialisms': 5,
          'derogatory-terms': 2,
          'inappropriate-expressions': 2
        },
        recentTerms: ['yer man', 'craic', 'grand', 'fair play', 'soft day'],
        lastIncident: '2024-03-03'
      },
      { 
        member: 'Daniel Murphy TD', 
        totalUsage: 13, 
        trend: '+4%', 
        party: 'Green Party',
        constituency: 'Carlow-Kilkenny',
        breakdown: {
          'mild-profanity': 5,
          'strong-profanity': 1,
          'irish-colloquialisms': 4,
          'derogatory-terms': 2,
          'inappropriate-expressions': 1
        },
        recentTerms: ['bog roll', 'jackeen', 'fluthered', 'bagsy', 'up to 90'],
        lastIncident: '2024-03-02'
      }
    ].sort((a, b) => b.totalUsage - a.totalUsage);
  };

  // Mock data for bias indicators
  const getBiasIndicatorsData = () => {
    return {
      indicators: [
        {
          id: 'gender-bias',
          name: 'Gender Bias',
          severity: 4.2,
          frequency: 127,
          trend: '-18.3%',
          color: 'bg-purple-500',
          description: 'Detected patterns of gender-based language bias in questioning and addressing members.',
          examples: [
            { member: 'Patrick O\'Sullivan TD', debate: 'Committee Hearing - Education', date: '2024-03-15', severity: 6.1, pattern: 'Interrupting female speakers 3x more frequently', voteId: 'CH-ED-001' },
            { member: 'John McCarthy TD', debate: 'Health Committee Session', date: '2024-03-12', severity: 5.8, pattern: 'Using diminutive language when addressing women ministers', voteId: 'HC-MIN-003' },
            { member: 'David Collins TD', debate: 'Budget Committee Review', date: '2024-03-10', severity: 5.4, pattern: 'Questioning competence based on gender stereotypes', voteId: 'BC-REV-002' }
          ]
        },
        {
          id: 'partisan-bias',
          name: 'Partisan Bias',
          severity: 7.8,
          frequency: 892,
          trend: '+12.7%',
          color: 'bg-red-500',
          description: 'Strong political party-based language patterns and selective argumentation.',
          examples: [
            { member: 'Sarah Kelly TD', debate: 'Opposition Response Session', date: '2024-03-14', severity: 8.9, pattern: 'Systematic dismissal of government proposals regardless of merit', voteId: 'ORS-GOV-001' },
            { member: 'Michael Walsh TD', debate: 'Policy Implementation Review', date: '2024-03-11', severity: 8.2, pattern: 'Cherry-picking statistics to support party position', voteId: 'PIR-STAT-002' },
            { member: 'Emma Collins TD', debate: 'Economic Measures Debate', date: '2024-03-09', severity: 7.6, pattern: 'Using loaded language to describe opposition policies', voteId: 'EMD-POL-003' }
          ]
        },
        {
          id: 'regional-bias',
          name: 'Regional Bias',
          severity: 5.9,
          frequency: 234,
          trend: '+8.1%',
          color: 'bg-orange-500',
          description: 'Geographic and urban/rural bias in policy discussions and resource allocation debates.',
          examples: [
            { member: 'James Foster TD', debate: 'Infrastructure Funding Allocation', date: '2024-03-13', severity: 7.1, pattern: 'Dismissing rural concerns as "special interests"', voteId: 'IFA-RUR-001' },
            { member: 'Patricia Walsh TD', debate: 'Transport Policy Review', date: '2024-03-08', severity: 6.3, pattern: 'Prioritizing urban solutions without rural consideration', voteId: 'TPR-URB-002' },
            { member: 'Rachel Green TD', debate: 'Broadband Infrastructure', date: '2024-03-06', severity: 5.8, pattern: 'Using Dublin-centric examples for national policies', voteId: 'BI-DUB-003' }
          ]
        },
        {
          id: 'socioeconomic-bias',
          name: 'Socioeconomic Bias',
          severity: 6.7,
          frequency: 156,
          trend: '+5.4%',
          color: 'bg-yellow-500',
          description: 'Class-based assumptions and economic status bias in social policy discussions.',
          examples: [
            { member: 'Thomas Brown TD', debate: 'Social Welfare Reform', date: '2024-03-07', severity: 7.8, pattern: 'Assuming moral failings behind economic hardship', voteId: 'SWR-MOR-001' },
            { member: 'Grace Murphy TD', debate: 'Housing Crisis Response', date: '2024-03-05', severity: 6.9, pattern: 'Victim-blaming language regarding homelessness', voteId: 'HCR-HOM-002' },
            { member: 'Anna Walsh TD', debate: 'Education Access Debate', date: '2024-03-03', severity: 6.2, pattern: 'Merit-based arguments ignoring systemic barriers', voteId: 'EAD-MER-003' }
          ]
        },
        {
          id: 'confirmation-bias',
          name: 'Confirmation Bias',
          severity: 5.3,
          frequency: 198,
          trend: '-3.2%',
          color: 'bg-blue-500',
          description: 'Selective evidence presentation and dismissal of contradictory information.',
          examples: [
            { member: 'Robert Quinn TD', debate: 'Climate Action Effectiveness', date: '2024-03-04', severity: 6.5, pattern: 'Ignoring contradictory environmental data', voteId: 'CAE-ENV-001' },
            { member: 'Lisa Murphy TD', debate: 'Healthcare Outcomes Review', date: '2024-03-02', severity: 5.9, pattern: 'Citing only supportive statistics while omitting context', voteId: 'HOR-STA-002' },
            { member: 'Daniel O\'Brien TD', debate: 'Economic Recovery Analysis', date: '2024-02-29', severity: 5.1, pattern: 'Selective interpretation of employment figures', voteId: 'ERA-EMP-003' }
          ]
        }
      ]
    };
  };

  // Mock data for framing patterns
  const getFramingPatternsData = () => {
    return {
      patterns: [
        {
          id: 'crisis-framing',
          name: 'Crisis Framing',
          usage: 167,
          effectiveness: 8.4,
          trend: '+31.2%',
          color: 'bg-red-500',
          description: 'Using crisis language to create urgency and justify rapid policy changes.',
          examples: [
            { member: 'John McCarthy TD', debate: 'Housing Emergency Session', date: '2024-03-15', context: 'Framing housing issues as "national emergency" to bypass normal procedures', effectiveness: 9.1, voteId: 'HES-EME-001' },
            { member: 'Sarah O\'Brien TD', debate: 'Healthcare Crisis Response', date: '2024-03-12', context: 'Using "crisis" terminology to justify increased spending', effectiveness: 8.7, voteId: 'HCR-CRI-002' },
            { member: 'Michael Walsh TD', debate: 'Climate Emergency Declaration', date: '2024-03-10', context: 'Emergency framing to accelerate environmental legislation', effectiveness: 8.9, voteId: 'CED-EME-003' }
          ]
        },
        {
          id: 'economic-necessity',
          name: 'Economic Necessity',
          usage: 234,
          effectiveness: 7.6,
          trend: '+19.8%',
          color: 'bg-green-500',
          description: 'Framing policies as economically essential or inevitable market responses.',
          examples: [
            { member: 'Emma Collins TD', debate: 'Tax Policy Reform', date: '2024-03-14', context: 'Presenting tax increases as "economic necessity" rather than policy choice', effectiveness: 8.2, voteId: 'TPR-TAX-001' },
            { member: 'David Ryan TD', debate: 'Public Service Restructuring', date: '2024-03-11', context: 'Framing cuts as "fiscal responsibility" to gain support', effectiveness: 7.8, voteId: 'PSR-FIS-002' },
            { member: 'Lisa Brown TD', debate: 'International Trade Agreement', date: '2024-03-09', context: 'Presenting trade deals as "no alternative" scenarios', effectiveness: 7.1, voteId: 'ITA-TRA-003' }
          ]
        },
        {
          id: 'moral-imperative',
          name: 'Moral Imperative',
          usage: 198,
          effectiveness: 8.9,
          trend: '+25.4%',
          color: 'bg-blue-500',
          description: 'Positioning policies as moral obligations or ethical necessities.',
          examples: [
            { member: 'Grace Kelly TD', debate: 'Mental Health Services', date: '2024-03-13', context: 'Framing mental health funding as "moral duty" to citizens', effectiveness: 9.3, voteId: 'MHS-MOR-001' },
            { member: 'Patrick Sullivan TD', debate: 'Child Protection Laws', date: '2024-03-08', context: 'Using moral language to overcome opposition to surveillance measures', effectiveness: 9.1, voteId: 'CPL-SUR-002' },
            { member: 'Rachel Green TD', debate: 'Social Welfare Expansion', date: '2024-03-06', context: 'Moral framing of welfare as "basic human dignity"', effectiveness: 8.4, voteId: 'SWE-DIG-003' }
          ]
        },
        {
          id: 'security-concern',
          name: 'Security Concern',
          usage: 143,
          effectiveness: 7.2,
          trend: '+14.6%',
          color: 'bg-purple-500',
          description: 'Using security and safety concerns to justify controversial policies.',
          examples: [
            { member: 'James Foster TD', debate: 'Digital Privacy Legislation', date: '2024-03-07', context: 'Framing surveillance as "national security necessity"', effectiveness: 7.8, voteId: 'DPL-SEC-001' },
            { member: 'Anna Murphy TD', debate: 'Immigration Policy Changes', date: '2024-03-05', context: 'Security framing to justify stricter border controls', effectiveness: 7.1, voteId: 'IPC-BOR-002' },
            { member: 'Thomas Collins TD', debate: 'Public Order Laws', date: '2024-03-03', context: 'Safety concerns used to limit protest rights', effectiveness: 6.7, voteId: 'POL-PRO-003' }
          ]
        },
        {
          id: 'generational-responsibility',
          name: 'Generational Responsibility',
          usage: 89,
          effectiveness: 8.1,
          trend: '+22.7%',
          color: 'bg-yellow-500',
          description: 'Appealing to responsibility toward future generations or historical legacy.',
          examples: [
            { member: 'Jennifer Walsh TD', debate: 'Climate Action Plan', date: '2024-03-04', context: 'Framing environmental policies as "duty to our children"', effectiveness: 8.9, voteId: 'CAP-CHI-001' },
            { member: 'Robert O\'Sullivan TD', debate: 'Education Investment', date: '2024-03-02', context: 'Using future generation arguments for increased education spending', effectiveness: 8.2, voteId: 'EI-EDU-002' },
            { member: 'Mary Kelly TD', debate: 'Pension Reform', date: '2024-02-29', context: 'Framing pension changes as "securing retirement for the young"', effectiveness: 7.3, voteId: 'PR-RET-003' }
          ]
        }
      ]
    };
  };

  if (!embedded && !isOpen) return null;

  return (
    <div
      className={embedded ? 'relative w-full' : 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'}
      role={embedded ? undefined : 'dialog'}
      aria-modal={embedded ? undefined : true}
    >
      <div className={embedded ? 'bg-white rounded-lg border border-slate-200 w-full overflow-hidden' : 'bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden'}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                  <BarChart className="w-6 h-6 text-purple-600" />
                </div>
                Advanced AI Analytics
              </h2>
              <p className="text-gray-600 mt-1">
                Cutting-edge linguistic and behavioral analysis of parliamentary proceedings
              </p>
            </div>
            {!embedded && (
              <button
                onClick={onClose} aria-label="Close dialog"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              ><X className="w-6 h-6" />
              </button>
            )}
          </div>
        </div>

        <div className={embedded ? 'flex min-h-[calc(100vh-230px)]' : 'flex h-[calc(90vh-120px)]'}>
          {/* Sidebar */}
          <div className="w-64 bg-gray-50 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Analytics Features</h3>
              <div className="space-y-2">
                {features.map((feature) => (
                  <button
                    key={feature.id}
                    onClick={() => setSelectedFeature(feature.id)} aria-label="Perform action"
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedFeature === feature.id
                        ? 'bg-white border border-purple-200 shadow-sm'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {feature.icon}
                      <span className="font-medium text-gray-900 text-sm">{feature.name}</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(feature.status)}`}>
                      {feature.status.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="ml-3 text-gray-600">Loading analytics data...</span>
              </div>
            ) : selectedFeatureData ? (
              <div className="p-6">
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    {selectedFeatureData.icon}
                    <h3 className="text-xl font-semibold text-gray-900">{selectedFeatureData.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedFeatureData.status)}`}>
                      {selectedFeatureData.status.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600">{selectedFeatureData.description}</p>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  {selectedFeatureData.metrics.map((metric, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900 mb-1">{metric.value}</div>
                      <div className="text-sm text-gray-600 mb-2 flex items-center gap-2">
                        {metric.label}
                        {metric.label === 'Neutrality Score' && (
                          <div className="relative">
                            <HelpCircle 
                              className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-help" 
                              onMouseEnter={() => setShowTooltip('neutrality')}
                              onMouseLeave={() => setShowTooltip(null)}
                            />
                            {showTooltip === 'neutrality' && (
                              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg shadow-lg z-10 w-64">
                                <div className="font-semibold mb-1">Neutrality Score Calculation</div>
                                <div>Measures linguistic objectivity vs. bias in parliamentary language using AI analysis of word choice, framing patterns, and emotional markers. Scale: 1-10 (higher = more neutral).</div>
                                <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      {metric.trend && (
                        <div className={`text-sm font-medium flex items-center gap-1 ${getTrendColor(metric.trend)}`}>
                          <TrendingUp className="w-4 h-4" />
                          {metric.trend}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Emotional Markers Section - Only for Emotion Detection */}
                {selectedFeature === 'emotion-detection' && (
                  <div className="mb-8">
                    <button
                      onClick={() => toggleSection('emotional-markers')}
                      className="w-full flex items-center justify-between p-4 bg-pink-50 border border-pink-200 rounded-lg hover:bg-pink-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-pink-600" />
                        <span className="text-lg font-semibold text-gray-900">Emotional Markers Analysis</span>
                        <span className="px-2 py-1 bg-pink-200 text-pink-800 text-xs font-medium rounded-full">
                          15,672 markers detected
                        </span>
                      </div>
                      {expandedSections.has('emotional-markers') ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {expandedSections.has('emotional-markers') && (
                      <div className="mt-4 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Emotion Categories & Intensity</h5>
                            <p className="text-gray-600">
                              Advanced AI analysis of emotional content in parliamentary speeches, 
                              tracking intensity levels and frequency patterns across different debate topics.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {getEmotionalMarkersData().markers.map((marker) => (
                              <div key={marker.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${marker.color}`}></div>
                                    <h6 className="font-semibold text-gray-900">{marker.name}</h6>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Intensity:</span>
                                    <span className="font-bold text-gray-900">{marker.intensity}/10</span>
                                  </div>
                                </div>
                                
                                <div className="mb-3">
                                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Frequency: {marker.frequency} occurrences</span>
                                    <span className={`font-medium ${getTrendColor(marker.trend)}`}>
                                      {marker.trend}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${marker.color}`}
                                      style={{ width: `${(marker.intensity / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-4">{marker.description}</p>

                                <div>
                                  <div className="text-sm font-semibold text-gray-900 mb-2">Recent Examples:</div>
                                  <div className="space-y-2">
                                    {marker.examples.slice(0, 2).map((example, idx) => (
                                      <div key={idx} className="bg-gray-50 rounded p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-900">
                                              {example.member}
                                            </span>
                                          </div>
                                          <span className="text-sm font-bold text-pink-600">
                                            {example.intensity}/10
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                          <FileText className="w-3 h-3" />
                                          <span>{example.debate}</span>
                                          <Calendar className="w-3 h-3 ml-2" />
                                          <span>{example.date}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <button 
                                    className="mt-3 text-sm text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1"
                                    onClick={() => toggleDetailView(`marker-${marker.id}`)}
                                  >
                                    {expandedDetailViews.has(`marker-${marker.id}`) ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" />
                                        Hide detailed list
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" />
                                        View all {marker.frequency} {marker.name.toLowerCase()} markers →
                                      </>
                                    )}
                                  </button>

                                  {/* Expanded detailed list */}
                                  {expandedDetailViews.has(`marker-${marker.id}`) && (
                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                      <div className="text-sm font-semibold text-gray-900 mb-3">
                                        All {marker.name} Markers ({marker.frequency} total)
                                      </div>
                                      <div className="max-h-60 overflow-y-auto space-y-2">
                                        {getAllEmotionalMarkers(marker.id).map((item: any, idx: number) => (
                                          <div key={idx} className="bg-gray-50 rounded p-3 border-l-4" style={{borderLeftColor: marker.color.replace('bg-', '#')}}>
                                            <div className="flex items-center justify-between mb-2">
                                              <button 
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                                onClick={() => openWordCloudModal(item.member, item.debate, item.date, marker.name, item.intensity)}
                                              >
                                                <User className="w-3 h-3 inline mr-1" />
                                                {item.member}
                                              </button>
                                              <span className="text-sm font-bold text-pink-600">
                                                {item.intensity}/10
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                              <button 
                                                className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                                onClick={() => console.log(`Navigate to debate: ${item.debate}`)}
                                              >
                                                <FileText className="w-3 h-3" />
                                                {item.debate}
                                              </button>
                                              <button 
                                                className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                                onClick={() => console.log(`Navigate to vote: ${item.voteId}`)}
                                              >
                                                <Target className="w-3 h-3" />
                                                {item.voteId}
                                              </button>
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {item.date}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <BarChart className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <h6 className="font-semibold text-blue-900 mb-1">Analysis Methodology</h6>
                                <p className="text-sm text-blue-800">
                                  Our AI system analyzes speech patterns, word choice, tone, and contextual cues 
                                  to identify emotional markers with 87.2% accuracy. Data is cross-referenced with 
                                  voting patterns, debate outcomes, and member engagement metrics to provide 
                                  comprehensive emotional intelligence insights.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Emotion Categories Section - Only for Emotion Detection */}
                {selectedFeature === 'emotion-detection' && (
                  <div className="mb-8">
                    <button
                      onClick={() => toggleSection('emotion-categories')}
                      className="w-full flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-purple-600" />
                        <span className="text-lg font-semibold text-gray-900">Emotion Categories</span>
                        <span className="px-2 py-1 bg-purple-200 text-purple-800 text-xs font-medium rounded-full">
                          12 categories
                        </span>
                      </div>
                      {expandedSections.has('emotion-categories') ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {expandedSections.has('emotion-categories') && (
                      <div className="mt-4 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Emotional Classification System</h5>
                            <p className="text-gray-600">
                              Comprehensive categorization of emotional expressions detected in parliamentary discourse, 
                              organized by primary emotions and their contextual variants.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {getEmotionCategoriesData().map((category) => (
                              <div key={category.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                                    <h6 className="font-semibold text-gray-900">{category.name}</h6>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    {category.occurrences} occurrences
                                  </div>
                                </div>
                                
                                <p className="text-sm text-gray-600 mb-4">{category.description}</p>

                                <div className="space-y-2">
                                  <div className="text-sm font-medium text-gray-900">Recent Examples:</div>
                                  {category.examples.slice(0, 2).map((example, idx) => (
                                    <div key={idx} className="bg-gray-50 rounded p-3">
                                      <div className="flex items-center justify-between mb-1">
                                        <button 
                                          className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                          onClick={() => openWordCloudModal(example.member, example.debate, example.date, category.name, example.intensity)}
                                        >
                                          <User className="w-3 h-3 inline mr-1" />
                                          {example.member}
                                        </button>
                                        <span className="text-sm font-bold text-purple-600">
                                          {example.intensity}/10
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-4 text-xs text-gray-600">
                                        <button 
                                          className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                          onClick={() => console.log(`Navigate to debate: ${example.debate}`)}
                                        >
                                          <FileText className="w-3 h-3" />
                                          {example.debate}
                                        </button>
                                        <button 
                                          className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                          onClick={() => console.log(`Navigate to vote: ${example.voteId}`)}
                                        >
                                          <Target className="w-3 h-3" />
                                          Vote #{example.voteId}
                                        </button>
                                        <span className="flex items-center gap-1">
                                          <Calendar className="w-3 h-3" />
                                          {example.date}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                                
                                <button 
                                  className="mt-3 text-sm text-purple-600 hover:text-purple-700 font-medium w-full text-left flex items-center gap-1"
                                  onClick={() => toggleDetailView(`category-${category.id}`)}
                                >
                                  {expandedDetailViews.has(`category-${category.id}`) ? (
                                    <>
                                      <ChevronUp className="w-3 h-3" />
                                      Hide detailed list
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="w-3 h-3" />
                                      View all {category.occurrences} {category.name.toLowerCase()} instances →
                                    </>
                                  )}
                                </button>

                                {/* Expanded detailed list */}
                                {expandedDetailViews.has(`category-${category.id}`) && (
                                  <div className="mt-4 border-t border-gray-200 pt-4">
                                    <div className="text-sm font-semibold text-gray-900 mb-3">
                                      All {category.name} Instances ({category.occurrences} total)
                                    </div>
                                    <div className="max-h-60 overflow-y-auto space-y-2">
                                      {getAllCategoryInstances(category.id).map((item: any, idx: number) => (
                                        <div key={idx} className="bg-gray-50 rounded p-3 border-l-4" style={{borderLeftColor: category.color.replace('bg-', '#')}}>
                                          <div className="flex items-center justify-between mb-2">
                                            <button 
                                              className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                              onClick={() => openWordCloudModal(item.member, item.debate, item.date, category.name, item.intensity)}
                                            >
                                              <User className="w-3 h-3 inline mr-1" />
                                              {item.member}
                                            </button>
                                            <span className="text-sm font-bold text-purple-600">
                                              {item.intensity}/10
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-4 text-xs text-gray-600">
                                            <button 
                                              className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                              onClick={() => console.log(`Navigate to debate: ${item.debate}`)}
                                            >
                                              <FileText className="w-3 h-3" />
                                              {item.debate}
                                            </button>
                                            <button 
                                              className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                              onClick={() => console.log(`Navigate to vote: ${item.voteId}`)}
                                            >
                                              <Target className="w-3 h-3" />
                                              {item.voteId}
                                            </button>
                                            <span className="flex items-center gap-1">
                                              <Calendar className="w-3 h-3" />
                                              {item.date}
                                            </span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Unparliamentary Language Section - Only for Unparliamentary */}
                {selectedFeature === 'unparliamentary' && (
                  <div className="mb-8">
                    <button
                      onClick={() => toggleSection('unparliamentary-language')}
                      className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-red-600" />
                        <span className="text-lg font-semibold text-gray-900">Unparliamentary Language Analysis</span>
                        <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-medium rounded-full">
                          1,458 instances detected
                        </span>
                      </div>
                      {expandedSections.has('unparliamentary-language') ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {expandedSections.has('unparliamentary-language') && (
                      <div className="mt-4 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Language Violations & Severity</h5>
                            <p className="text-gray-600">
                              AI-powered detection of unparliamentary language including profanity, colloquialisms, 
                              and inappropriate expressions that breach parliamentary decorum and standards.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {getUnparliamentaryData().categories.map((category) => (
                              <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${category.color}`}></div>
                                    <h6 className="font-semibold text-gray-900">{category.name}</h6>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Severity:</span>
                                    <span className={`font-bold ${
                                      category.severity === 'High' ? 'text-red-600' : 
                                      category.severity === 'Medium' ? 'text-orange-600' : 'text-yellow-600'
                                    }`}>
                                      {category.severity}
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mb-3">
                                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Occurrences: {category.occurrences}</span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${category.color}`}
                                      style={{ width: `${Math.min((category.occurrences / 600) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-4">{category.description}</p>

                                <div>
                                  <div className="text-sm font-semibold text-gray-900 mb-2">Recent Examples:</div>
                                  <div className="space-y-2">
                                    {category.examples.slice(0, 2).map((example, idx) => (
                                      <div key={idx} className="bg-gray-50 rounded p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-gray-500" />
                                            <button 
                                              className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                              onClick={() => openWordCloudModal(example.member, example.debate, example.date, 'Unparliamentary', 7.5)}
                                            >
                                              {example.member}
                                            </button>
                                          </div>
                                          <span className="text-sm font-bold text-red-600">
                                            "{example.term}"
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mb-2 italic">
                                          "{example.context}"
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                          <button 
                                            className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                            onClick={() => openDebateContextModal(example.member, example.debate, example.date, example.term, example.context, example.voteId)}
                                          >
                                            <FileText className="w-3 h-3" />
                                            {example.debate}
                                          </button>
                                          <Calendar className="w-3 h-3 ml-2" />
                                          <span>{example.date}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <button 
                                    className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                                    onClick={() => toggleDetailView(`unparliamentary-${category.id}`)}
                                  >
                                    {expandedDetailViews.has(`unparliamentary-${category.id}`) ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" />
                                        Hide detailed list
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" />
                                        View all {category.occurrences} {category.name.toLowerCase()} instances →
                                      </>
                                    )}
                                  </button>

                                  {/* Expanded detailed list */}
                                  {expandedDetailViews.has(`unparliamentary-${category.id}`) && (
                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                      <div className="text-sm font-semibold text-gray-900 mb-3">
                                        All {category.name} Instances ({category.occurrences} total)
                                      </div>
                                      <div className="max-h-60 overflow-y-auto space-y-2">
                                        {getAllUnparliamentaryMarkers(category.id).map((item: any, idx: number) => (
                                          <div key={idx} className="bg-gray-50 rounded p-3 border-l-4" style={{borderLeftColor: category.color.replace('bg-', '#').replace('500', '').replace('600', '')}}>
                                            <div className="flex items-center justify-between mb-2">
                                              <button 
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                                onClick={() => openWordCloudModal(item.member, item.debate, item.date, 'Unparliamentary', 7.5)}
                                              >
                                                <User className="w-3 h-3 inline mr-1" />
                                                {item.member}
                                              </button>
                                              <span className="text-sm font-bold text-red-600">
                                                "{item.term}"
                                              </span>
                                            </div>
                                            <div className="text-xs text-gray-600 mb-2 italic">
                                              "{item.context}"
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                              <button 
                                                className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                                onClick={() => openDebateContextModal(item.member, item.debate, item.date, item.term, item.context, item.voteId)}
                                              >
                                                <FileText className="w-3 h-3" />
                                                {item.debate}
                                              </button>
                                              <button 
                                                className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                                onClick={() => console.log(`Navigate to vote: ${item.voteId}`)}
                                              >
                                                <Target className="w-3 h-3" />
                                                {item.voteId}
                                              </button>
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {item.date}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Member Usage Statistics */}
                          <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-lg">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <BarChart className="w-5 h-5 text-slate-600" />
                                <h6 className="text-lg font-semibold text-gray-900">Member Usage Statistics</h6>
                                <span className="px-2 py-1 bg-slate-200 text-slate-800 text-xs font-medium rounded-full">
                                  12 members tracked
                                </span>
                              </div>
                              <button 
                                className="text-sm text-slate-600 hover:text-slate-700 font-medium flex items-center gap-1"
                                onClick={() => toggleDetailView('member-usage-stats')}
                              >
                                {expandedDetailViews.has('member-usage-stats') ? (
                                  <>
                                    <ChevronUp className="w-3 h-3" />
                                    Hide full statistics
                                  </>
                                ) : (
                                  <>
                                    <ChevronDown className="w-3 h-3" />
                                    View detailed breakdown →
                                  </>
                                )}
                              </button>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-4">
                              Real-time tracking of unparliamentary language usage by individual TDs, 
                              showing frequency, trends, and category breakdowns.
                            </p>

                            {/* Top 5 Members Preview */}
                            <div className="space-y-3 mb-4">
                              {getMemberUsageStatistics().slice(0, 5).map((member, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center justify-center w-8 h-8 bg-slate-600 text-white rounded-full text-sm font-bold">
                                      {idx + 1}
                                    </div>
                                    <div>
                                      <button 
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                        onClick={() => openWordCloudModal(member.member, 'Unparliamentary Language Usage', member.lastIncident, 'Unparliamentary', 6.5)}
                                      >
                                        {member.member}
                                      </button>
                                      <div className="text-xs text-gray-500">
                                        {member.party} • {member.constituency}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-lg font-bold text-gray-900">{member.totalUsage}</div>
                                    <div className={`text-xs font-medium ${
                                      member.trend.startsWith('+') ? 'text-red-600' : 
                                      member.trend.startsWith('-') ? 'text-green-600' : 'text-gray-600'
                                    }`}>
                                      {member.trend}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Expanded detailed view */}
                            {expandedDetailViews.has('member-usage-stats') && (
                              <div className="border-t border-gray-200 pt-4">
                                <div className="text-sm font-semibold text-gray-900 mb-4">
                                  Complete Member Statistics (All 12 Members)
                                </div>
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                  {getMemberUsageStatistics().map((member, idx) => (
                                    <div key={idx} className="bg-white rounded-lg border border-gray-200 p-4">
                                      <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                          <div className="flex items-center justify-center w-8 h-8 bg-slate-600 text-white rounded-full text-sm font-bold">
                                            {idx + 1}
                                          </div>
                                          <div>
                                            <button 
                                              className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                              onClick={() => openWordCloudModal(member.member, 'Unparliamentary Language Usage', member.lastIncident, 'Unparliamentary', 6.5)}
                                            >
                                              {member.member}
                                            </button>
                                            <div className="text-xs text-gray-500">
                                              {member.party} • {member.constituency}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right">
                                          <div className="text-lg font-bold text-gray-900">{member.totalUsage} total</div>
                                          <div className={`text-xs font-medium ${
                                            member.trend.startsWith('+') ? 'text-red-600' : 
                                            member.trend.startsWith('-') ? 'text-green-600' : 'text-gray-600'
                                          }`}>
                                            {member.trend} this period
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Category breakdown */}
                                      <div className="mb-3">
                                        <div className="text-xs font-semibold text-gray-700 mb-2">Category Breakdown:</div>
                                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-2 text-xs">
                                          <div className="bg-yellow-50 px-2 py-1 rounded">
                                            <span className="font-medium">Mild:</span> {member.breakdown['mild-profanity']}
                                          </div>
                                          <div className="bg-red-50 px-2 py-1 rounded">
                                            <span className="font-medium">Strong:</span> {member.breakdown['strong-profanity']}
                                          </div>
                                          <div className="bg-orange-50 px-2 py-1 rounded">
                                            <span className="font-medium">Irish:</span> {member.breakdown['irish-colloquialisms']}
                                          </div>
                                          <div className="bg-red-100 px-2 py-1 rounded">
                                            <span className="font-medium">Derog:</span> {member.breakdown['derogatory-terms']}
                                          </div>
                                          <div className="bg-purple-50 px-2 py-1 rounded">
                                            <span className="font-medium">Expr:</span> {member.breakdown['inappropriate-expressions']}
                                          </div>
                                        </div>
                                      </div>
                                      
                                      {/* Recent terms */}
                                      <div className="mb-2">
                                        <div className="text-xs font-semibold text-gray-700 mb-1">Recent Terms:</div>
                                        <div className="flex flex-wrap gap-1">
                                          {member.recentTerms.map((term, tidx) => (
                                            <span 
                                              key={tidx}
                                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded font-mono"
                                            >
                                              "{term}"
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                      
                                      {/* Last incident */}
                                      <div className="text-xs text-gray-500">
                                        <Calendar className="w-3 h-3 inline mr-1" />
                                        Last incident: {member.lastIncident}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <Scale className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <h6 className="font-semibold text-amber-900 mb-1">Parliamentary Standards</h6>
                                <p className="text-sm text-amber-800">
                                  Detection accuracy has improved to 92.4% using context-aware AI that understands 
                                  Irish colloquialisms and parliamentary context. The system helps maintain decorum 
                                  standards while respecting cultural linguistic expressions.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Intensity Levels Section - Only for Emotion Detection */}
                {selectedFeature === 'emotion-detection' && (
                  <div className="mb-8">
                    <button
                      onClick={() => toggleSection('intensity-levels')}
                      className="w-full flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart className="w-5 h-5 text-orange-600" />
                        <span className="text-lg font-semibold text-gray-900">Intensity Levels</span>
                        <span className="px-2 py-1 bg-orange-200 text-orange-800 text-xs font-medium rounded-full">
                          6.8/10 avg
                        </span>
                      </div>
                      {expandedSections.has('intensity-levels') ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {expandedSections.has('intensity-levels') && (
                      <div className="mt-4 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Emotional Intensity Analysis</h5>
                            <p className="text-gray-600">
                              Quantified measurement of emotional intensity in parliamentary speeches, 
                              tracking patterns across different debate types, members, and time periods.
                            </p>
                          </div>

                          <div className="space-y-6">
                            {/* Intensity Distribution */}
                            <div className="border border-gray-200 rounded-lg p-4">
                              <h6 className="font-semibold text-gray-900 mb-4">Intensity Distribution</h6>
                              <div className="space-y-3">
                                {getIntensityLevelsData().distribution.map((level) => (
                                  <div key={level.range} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <span className="text-sm font-medium text-gray-700 w-20">
                                        {level.range}
                                      </span>
                                      <div className="flex-1 bg-gray-200 rounded-full h-3 w-32">
                                        <div 
                                          className={`h-3 rounded-full ${level.color}`}
                                          style={{ width: `${level.percentage}%` }}
                                        ></div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                      <span className="text-sm text-gray-600">
                                        {level.count} speeches
                                      </span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {level.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Top Intensity Examples */}
                            <div className="border border-gray-200 rounded-lg p-4">
                              <h6 className="font-semibold text-gray-900 mb-4">Highest Intensity Speeches</h6>
                              <div className="space-y-3">
                                {getIntensityLevelsData().topExamples.map((example, idx) => (
                                  <div key={idx} className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <button 
                                        className="text-lg font-bold text-red-600 hover:text-red-800 cursor-pointer"
                                        onClick={() => console.log(`Navigate to member: ${example.member}`)}
                                      >
                                        {example.intensity}/10
                                      </button>
                                      <button 
                                        className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                        onClick={() => openWordCloudModal(example.member, example.debate, example.date, 'High Intensity', example.intensity)}
                                      >
                                        <User className="w-3 h-3 inline mr-1" />
                                        {example.member}
                                      </button>
                                    </div>
                                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                                      <button 
                                        className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                        onClick={() => console.log(`Navigate to debate: ${example.debate}`)}
                                      >
                                        <FileText className="w-3 h-3" />
                                        {example.debate}
                                      </button>
                                      <button 
                                        className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                        onClick={() => console.log(`Navigate to vote: ${example.voteId}`)}
                                      >
                                        <Target className="w-3 h-3" />
                                        Vote #{example.voteId}
                                      </button>
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {example.date}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 italic">
                                      "{example.excerpt}"
                                    </p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                      {example.emotions.map((emotion, eidx) => (
                                        <span 
                                          key={eidx}
                                          className="px-2 py-1 bg-white bg-opacity-60 text-xs font-medium rounded-full"
                                        >
                                          {emotion}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-start gap-3">
                              <TrendingUp className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                              <div>
                                <h6 className="font-semibold text-orange-900 mb-1">Intensity Measurement</h6>
                                <p className="text-sm text-orange-800">
                                  Intensity levels are calculated using advanced natural language processing that analyzes 
                                  linguistic patterns, word choice, sentence structure, and contextual cues. The 1-10 scale 
                                  represents the strength of emotional expression, with 10 being the most intense.
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bias Indicators Section - Only for Bias Detection */}
                {selectedFeature === 'bias-detection' && (
                  <div className="mb-8">
                    <button
                      onClick={() => toggleSection('bias-indicators')}
                      className="w-full flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Scale className="w-5 h-5 text-slate-600" />
                        <span className="text-lg font-semibold text-gray-900">Bias Indicators Analysis</span>
                        <span className="px-2 py-1 bg-slate-200 text-slate-800 text-xs font-medium rounded-full">
                          3,456 indicators detected
                        </span>
                      </div>
                      {expandedSections.has('bias-indicators') ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {expandedSections.has('bias-indicators') && (
                      <div className="mt-4 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Bias Types & Severity Analysis</h5>
                            <p className="text-gray-600">
                              AI-powered detection of linguistic bias patterns including gender, partisan, regional, 
                              socioeconomic, and confirmation bias in parliamentary discourse and decision-making.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {getBiasIndicatorsData().indicators.map((indicator) => (
                              <div key={indicator.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${indicator.color}`}></div>
                                    <h6 className="font-semibold text-gray-900">{indicator.name}</h6>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Severity:</span>
                                    <span className={`font-bold ${
                                      indicator.severity >= 7 ? 'text-red-600' : 
                                      indicator.severity >= 5 ? 'text-orange-600' : 'text-yellow-600'
                                    }`}>
                                      {indicator.severity}/10
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mb-3">
                                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Frequency: {indicator.frequency} instances</span>
                                    <span className={`font-medium ${getTrendColor(indicator.trend)}`}>
                                      {indicator.trend}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${indicator.color}`}
                                      style={{ width: `${(indicator.severity / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-4">{indicator.description}</p>

                                <div>
                                  <div className="text-sm font-semibold text-gray-900 mb-2">Recent Examples:</div>
                                  <div className="space-y-2">
                                    {indicator.examples.slice(0, 2).map((example, idx) => (
                                      <div key={idx} className="bg-gray-50 rounded p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-gray-500" />
                                            <button 
                                              className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                              onClick={() => openWordCloudModal(example.member, example.debate, example.date, 'Bias', example.severity)}
                                            >
                                              {example.member}
                                            </button>
                                          </div>
                                          <span className="text-sm font-bold text-slate-600">
                                            {example.severity}/10
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mb-2 italic">
                                          "{example.pattern}"
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                          <button 
                                            className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                            onClick={() => openDebateContextModal(example.member, example.debate, example.date, 'bias pattern', example.pattern, example.voteId)}
                                          >
                                            <FileText className="w-3 h-3" />
                                            {example.debate}
                                          </button>
                                          <Calendar className="w-3 h-3 ml-2" />
                                          <span>{example.date}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <button 
                                    className="mt-3 text-sm text-slate-600 hover:text-slate-700 font-medium flex items-center gap-1"
                                    onClick={() => toggleDetailView(`bias-${indicator.id}`)}
                                  >
                                    {expandedDetailViews.has(`bias-${indicator.id}`) ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" />
                                        Hide detailed list
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" />
                                        View all {indicator.frequency} {indicator.name.toLowerCase()} instances →
                                      </>
                                    )}
                                  </button>

                                  {/* Expanded detailed list */}
                                  {expandedDetailViews.has(`bias-${indicator.id}`) && (
                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                      <div className="text-sm font-semibold text-gray-900 mb-3">
                                        All {indicator.name} Instances ({indicator.frequency} total)
                                      </div>
                                      <div className="max-h-60 overflow-y-auto space-y-2">
                                        {getAllBiasIndicators(indicator.id).map((item: any, idx: number) => (
                                          <div key={idx} className="bg-gray-50 rounded p-3 border-l-4" style={{borderLeftColor: indicator.color.replace('bg-', '#').replace('500', '')}}>
                                            <div className="flex items-center justify-between mb-2">
                                              <button 
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                                onClick={() => openWordCloudModal(item.member, item.debate, item.date, 'Bias', item.severity)}
                                              >
                                                <User className="w-3 h-3 inline mr-1" />
                                                {item.member}
                                              </button>
                                              <span className="text-sm font-bold text-slate-600">
                                                {item.severity}/10
                                              </span>
                                            </div>
                                            <div className="text-xs text-gray-600 mb-2 italic">
                                              "{item.pattern}"
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                              <button 
                                                className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                                onClick={() => openDebateContextModal(item.member, item.debate, item.date, 'bias pattern', item.pattern, item.voteId)}
                                              >
                                                <FileText className="w-3 h-3" />
                                                {item.debate}
                                              </button>
                                              <button 
                                                className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                                onClick={() => console.log(`Navigate to vote: ${item.voteId}`)}
                                              >
                                                <Target className="w-3 h-3" />
                                                {item.voteId}
                                              </button>
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {item.date}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Framing Patterns Section - Only for Bias Detection */}
                {selectedFeature === 'bias-detection' && (
                  <div className="mb-8">
                    <button
                      onClick={() => toggleSection('framing-patterns')}
                      className="w-full flex items-center justify-between p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Layers className="w-5 h-5 text-indigo-600" />
                        <span className="text-lg font-semibold text-gray-900">Framing Patterns Analysis</span>
                        <span className="px-2 py-1 bg-indigo-200 text-indigo-800 text-xs font-medium rounded-full">
                          789 patterns identified
                        </span>
                      </div>
                      {expandedSections.has('framing-patterns') ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {expandedSections.has('framing-patterns') && (
                      <div className="mt-4 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Rhetorical Framing & Effectiveness</h5>
                            <p className="text-gray-600">
                              Analysis of how parliamentary speakers frame arguments and policies using specific 
                              rhetorical strategies to influence public opinion and legislative outcomes.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {getFramingPatternsData().patterns.map((pattern) => (
                              <div key={pattern.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${pattern.color}`}></div>
                                    <h6 className="font-semibold text-gray-900">{pattern.name}</h6>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Effectiveness:</span>
                                    <span className={`font-bold ${
                                      pattern.effectiveness >= 8 ? 'text-green-600' : 
                                      pattern.effectiveness >= 6 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {pattern.effectiveness}/10
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="mb-3">
                                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                                    <span>Usage: {pattern.usage} instances</span>
                                    <span className={`font-medium ${getTrendColor(pattern.trend)}`}>
                                      {pattern.trend}
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div 
                                      className={`h-2 rounded-full ${pattern.color}`}
                                      style={{ width: `${(pattern.effectiveness / 10) * 100}%` }}
                                    ></div>
                                  </div>
                                </div>

                                <p className="text-sm text-gray-600 mb-4">{pattern.description}</p>

                                <div>
                                  <div className="text-sm font-semibold text-gray-900 mb-2">Recent Examples:</div>
                                  <div className="space-y-2">
                                    {pattern.examples.slice(0, 2).map((example, idx) => (
                                      <div key={idx} className="bg-gray-50 rounded p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <div className="flex items-center gap-2">
                                            <User className="w-3 h-3 text-gray-500" />
                                            <button 
                                              className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                              onClick={() => openWordCloudModal(example.member, example.debate, example.date, 'Framing', example.effectiveness)}
                                            >
                                              {example.member}
                                            </button>
                                          </div>
                                          <span className="text-sm font-bold text-indigo-600">
                                            {example.effectiveness}/10
                                          </span>
                                        </div>
                                        <div className="text-xs text-gray-600 mb-2 italic">
                                          "{example.context}"
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                          <button 
                                            className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                            onClick={() => openDebateContextModal(example.member, example.debate, example.date, 'framing pattern', example.context, example.voteId)}
                                          >
                                            <FileText className="w-3 h-3" />
                                            {example.debate}
                                          </button>
                                          <Calendar className="w-3 h-3 ml-2" />
                                          <span>{example.date}</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  
                                  <button 
                                    className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
                                    onClick={() => toggleDetailView(`framing-${pattern.id}`)}
                                  >
                                    {expandedDetailViews.has(`framing-${pattern.id}`) ? (
                                      <>
                                        <ChevronUp className="w-3 h-3" />
                                        Hide detailed list
                                      </>
                                    ) : (
                                      <>
                                        <ChevronDown className="w-3 h-3" />
                                        View all {pattern.usage} {pattern.name.toLowerCase()} instances →
                                      </>
                                    )}
                                  </button>

                                  {/* Expanded detailed list */}
                                  {expandedDetailViews.has(`framing-${pattern.id}`) && (
                                    <div className="mt-4 border-t border-gray-200 pt-4">
                                      <div className="text-sm font-semibold text-gray-900 mb-3">
                                        All {pattern.name} Instances ({pattern.usage} total)
                                      </div>
                                      <div className="max-h-60 overflow-y-auto space-y-2">
                                        {getAllFramingPatterns(pattern.id).map((item: any, idx: number) => (
                                          <div key={idx} className="bg-gray-50 rounded p-3 border-l-4" style={{borderLeftColor: pattern.color.replace('bg-', '#').replace('500', '')}}>
                                            <div className="flex items-center justify-between mb-2">
                                              <button 
                                                className="text-sm font-medium text-blue-600 hover:text-blue-800 cursor-pointer"
                                                onClick={() => openWordCloudModal(item.member, item.debate, item.date, 'Framing', item.effectiveness)}
                                              >
                                                <User className="w-3 h-3 inline mr-1" />
                                                {item.member}
                                              </button>
                                              <span className="text-sm font-bold text-indigo-600">
                                                {item.effectiveness}/10
                                              </span>
                                            </div>
                                            <div className="text-xs text-gray-600 mb-2 italic">
                                              "{item.context}"
                                            </div>
                                            <div className="flex items-center gap-4 text-xs text-gray-600">
                                              <button 
                                                className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                                onClick={() => openDebateContextModal(item.member, item.debate, item.date, 'framing pattern', item.context, item.voteId)}
                                              >
                                                <FileText className="w-3 h-3" />
                                                {item.debate}
                                              </button>
                                              <button 
                                                className="flex items-center gap-1 hover:text-blue-600 cursor-pointer"
                                                onClick={() => console.log(`Navigate to vote: ${item.voteId}`)}
                                              >
                                                <Target className="w-3 h-3" />
                                                {item.voteId}
                                              </button>
                                              <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {item.date}
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {selectedFeature === 'question-patterns' && (
                  <>
                    <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 md:p-5">
                      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-violet-600" />
                          <h4 className="text-xl font-semibold text-slate-900">Question Patterns</h4>
                          <span className="rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Active</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            <Calendar className="h-4 w-4" />
                            May 1 - May 27, 2025
                          </button>
                          <button className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                            <Layers className="h-4 w-4" />
                            Compare
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-slate-600">
                        AI analysis of parliamentary question patterns and recurring themes across different time periods and members.
                      </p>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                        <div className="mb-4 flex items-center justify-between">
                          <h5 className="text-base font-semibold text-slate-900">Questions Over Time</h5>
                          <button className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">Daily</button>
                        </div>
                        <svg viewBox="0 0 620 250" className="h-56 w-full" role="img" aria-label="Questions over time line chart">
                          <defs>
                            <linearGradient id="qpArea" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.26" />
                              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.03" />
                            </linearGradient>
                          </defs>
                          {[0, 1, 2, 3, 4].map((i) => (
                            <line key={i} x1="0" x2="620" y1={20 + i * 46} y2={20 + i * 46} stroke="#e5e7eb" strokeWidth="1" />
                          ))}
                          <path d={questionAreaPath} fill="url(#qpArea)" />
                          <path d={questionLinePath} fill="none" stroke="#7c3aed" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h5 className="mb-4 text-base font-semibold text-slate-900">Top Question Themes</h5>
                        <div className="mb-4 flex items-center justify-center">
                          <div
                            className="relative h-44 w-44 rounded-full"
                            style={{
                              background: `conic-gradient(${questionThemeData
                                .map((segment, idx) => {
                                  const start = questionThemeData.slice(0, idx).reduce((sum, item) => sum + item.value, 0) * 3.6;
                                  const end = start + segment.value * 3.6;
                                  return `${segment.color} ${start}deg ${end}deg`;
                                })
                                .join(', ')})`,
                            }}
                          >
                            <div className="absolute inset-[26px] flex flex-col items-center justify-center rounded-full bg-white">
                              <span className="text-3xl font-bold text-slate-900">156</span>
                              <span className="text-xs text-slate-500">Total Themes</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          {questionThemeData.map((theme) => (
                            <div key={theme.name} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-slate-700">
                                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: theme.color }}></span>
                                {theme.name}
                              </div>
                              <span className="font-semibold text-slate-800">{theme.value}%</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <div className="rounded-xl border border-slate-200 bg-white p-4 lg:col-span-2">
                        <div className="mb-3 flex items-center justify-between">
                          <h5 className="text-base font-semibold text-slate-900">Key AI Insights</h5>
                          <button className="rounded-md border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100">View full report</button>
                        </div>
                        <div className="space-y-2">
                          {selectedFeatureData.insights.map((insight, index) => (
                            <div key={index} className="flex items-center justify-between rounded-lg border border-violet-100 bg-violet-50/40 px-3 py-2">
                              <div className="flex items-center gap-3">
                                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">{index + 1}</div>
                                <p className="text-sm font-medium text-slate-800">{insight}</p>
                              </div>
                              <button className="text-xs font-semibold text-violet-700 hover:text-violet-900">View details</button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-white p-4">
                        <h5 className="mb-3 text-base font-semibold text-slate-900">Top Active Members</h5>
                        <div className="space-y-3">
                          {topActiveMembers.map((member, idx) => (
                            <div key={member.name}>
                              <div className="mb-1 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-100 text-[10px] font-bold text-violet-700">{member.initials}</span>
                                  {member.name}
                                </div>
                                <span className="text-xs font-semibold text-slate-600">{member.questions} questions</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-slate-100">
                                <div className="h-1.5 rounded-full bg-violet-500" style={{ width: `${Math.max(40, 100 - idx * 14)}%` }}></div>
                              </div>
                            </div>
                          ))}
                        </div>
                        <button className="mt-4 text-xs font-semibold text-violet-700 hover:text-violet-900">View all members</button>
                      </div>
                    </div>

                    <div className="mb-2 rounded-xl border border-violet-100 bg-violet-50/40 px-4 py-3 text-xs text-slate-600">
                      Analytics are generated using AI models trained on official parliamentary records. Results may have a margin of error. See our methodology and limitations.
                    </div>
                  </>
                )}

                {/* Key Insights */}
                {selectedFeature !== 'question-patterns' && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Key AI Insights</h4>
                    <div className="space-y-3">
                      {selectedFeatureData.insights.map((insight, index) => (
                        <div key={index} className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            <p className="text-blue-900 font-medium">{insight}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Notice */}
                {selectedFeatureData.status !== 'active' && (
                  <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-900">
                        {selectedFeatureData.status === 'processing' 
                          ? 'Feature Currently Processing' 
                          : 'Feature In Development'}
                      </span>
                    </div>
                    <p className="text-yellow-800 text-sm mt-1">
                      {selectedFeatureData.status === 'processing'
                        ? 'This analysis is currently running on recent parliamentary data. Full results will be available soon.'
                        : 'This advanced analytics feature is planned for future release as part of our AI enhancement roadmap.'}
                    </p>
                  </div>
                )}

                {/* Minister Efficiency Section - Only for Minister Efficiency */}
                {selectedFeature === 'minister-efficiency' && (
                  <div className="mb-8">
                    <button
                      onClick={() => toggleSection('minister-performance')}
                      className="w-full flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <BarChart className="w-5 h-5 text-blue-600" />
                        <span className="text-lg font-semibold text-gray-900">Minister Performance Analysis</span>
                        <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded-full">
                          18.7 avg questions
                        </span>
                      </div>
                      {expandedSections.has('minister-performance') ? (
                        <ChevronUp className="w-5 h-5 text-gray-600" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-600" />
                      )}
                    </button>

                    {expandedSections.has('minister-performance') && (
                      <div className="mt-4 space-y-6">
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <div className="mb-6">
                            <h5 className="text-lg font-semibold text-gray-900 mb-2">Ministerial Question Response Efficiency</h5>
                            <p className="text-gray-600">
                              AI analysis of ministerial performance in parliamentary question periods, including response times, 
                              question volumes, follow-up patterns, and comparative efficiency metrics across different portfolios.
                            </p>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {getMinisterEfficiencyData().ministers.map((minister) => (
                              <div key={minister.id} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-4 h-4 rounded-full ${minister.color}`}></div>
                                    <h6 className="font-semibold text-gray-900">{minister.portfolio}</h6>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Efficiency:</span>
                                    <span className={`font-bold ${
                                      minister.efficiency >= 9.0 ? 'text-green-600' : 
                                      minister.efficiency >= 8.0 ? 'text-blue-600' : 
                                      minister.efficiency >= 7.0 ? 'text-yellow-600' : 'text-red-600'
                                    }`}>
                                      {minister.efficiency}/10
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="text-sm text-gray-600 mb-3">
                                  <strong>{minister.currentHolder}</strong>
                                </div>

                                <div className="space-y-2 mb-4">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Avg Questions/Debate:</span>
                                    <span className="font-medium">{minister.avgQuestionsPerDebate}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Avg Response Time:</span>
                                    <span className="font-medium">{minister.avgResponseTime} mins</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Response Rate:</span>
                                    <span className="font-medium">{minister.responseRate}%</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Follow-up Questions:</span>
                                    <span className="font-medium">{minister.followUpQuestions}</span>
                                  </div>
                                </div>

                                <button
                                  onClick={() => toggleDetailView(`minister-details-${minister.id}`)}
                                  className="w-full text-center py-2 px-3 text-sm bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                  {expandedDetailViews.has(`minister-details-${minister.id}`) ? 'Hide Details' : 'Show Details'}
                                </button>

                                {expandedDetailViews.has(`minister-details-${minister.id}`) && (
                                  <div className="mt-4 space-y-4 pt-4 border-t border-gray-200">
                                    {/* Quality Overview */}
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                      <div className="text-sm font-semibold text-blue-800 mb-2">Response Quality Overview</div>
                                      <div className="grid grid-cols-2 gap-3 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-blue-700">Quality Score:</span>
                                          <span className="font-bold text-blue-800">{minister.qualityMetrics?.overallQualityScore || 'N/A'}/10</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-blue-700">Completeness:</span>
                                          <span className="font-medium">{minister.qualityMetrics?.responseCompleteness || 'N/A'}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-blue-700">Data Transparency:</span>
                                          <span className="font-medium">{minister.qualityMetrics?.dataTransparency || 'N/A'}%</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-blue-700">Action Commitments:</span>
                                          <span className="font-medium">{minister.qualityMetrics?.actionCommitments || 'N/A'}%</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="text-sm font-semibold text-gray-900 mb-2">Question Categories</div>
                                      <div className="space-y-2">
                                        {minister.questionCategories.map((cat, idx) => (
                                          <div key={idx} className="flex items-center justify-between">
                                            <span className="text-xs text-gray-600">{cat.category}</span>
                                            <div className="flex items-center gap-2">
                                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                                <div 
                                                  className="bg-blue-500 h-2 rounded-full"
                                                  style={{ width: `${cat.percentage}%` }}
                                                ></div>
                                              </div>
                                              <span className="text-xs font-medium">{cat.count}</span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <div className="text-sm font-semibold text-gray-900 mb-2">Response Times by Type</div>
                                      <div className="grid grid-cols-2 gap-2 text-xs">
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Simple:</span>
                                          <span className="font-medium">{minister.responseTimes.simple}m</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Complex:</span>
                                          <span className="font-medium">{minister.responseTimes.complex}m</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Policy:</span>
                                          <span className="font-medium">{minister.responseTimes.policy}m</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span className="text-gray-600">Statistical:</span>
                                          <span className="font-medium">{minister.responseTimes.statistical}m</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div>
                                      <div className="text-sm font-semibold text-gray-900 mb-2">Recent Questions with Quality Analysis</div>
                                      <div className="space-y-2">
                                        {minister.recentQuestions.slice(0, 2).map((q, idx) => (
                                          <div key={idx} className="bg-gray-50 rounded-lg p-3">
                                            <div className="flex items-center justify-between mb-1">
                                              <span className="text-xs font-medium text-blue-600">{q.member}</span>
                                              <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500">{q.date}</span>
                                                {q.qualityScore && (
                                                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                                    q.qualityScore >= 8.5 ? 'bg-green-100 text-green-700' :
                                                    q.qualityScore >= 7.0 ? 'bg-blue-100 text-blue-700' :
                                                    q.qualityScore >= 5.5 ? 'bg-yellow-100 text-yellow-700' :
                                                    'bg-red-100 text-red-700'
                                                  }`}>
                                                    Quality: {q.qualityScore}/10
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <p className="text-xs text-gray-700 mb-2">{q.question}</p>
                                            <div className="flex items-center justify-between text-xs mb-2">
                                              <span className="text-gray-600">Response: {q.responseTime}m</span>
                                              <span className="text-gray-600">Follow-ups: {q.followUps}</span>
                                              {q.responseLength && <span className="text-gray-600">{q.responseLength} words</span>}
                                            </div>
                                            {(q.substantiveAnswer !== undefined || q.dataProvided !== undefined || q.actionCommitment) && (
                                              <div className="flex flex-wrap gap-1 mt-2">
                                                {q.substantiveAnswer !== undefined && (
                                                  <span className={`text-xs px-2 py-1 rounded ${
                                                    q.substantiveAnswer ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                  }`}>
                                                    {q.substantiveAnswer ? 'Substantive' : 'Limited'}
                                                  </span>
                                                )}
                                                {q.dataProvided !== undefined && (
                                                  <span className={`text-xs px-2 py-1 rounded ${
                                                    q.dataProvided ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                                                  }`}>
                                                    {q.dataProvided ? 'Data Provided' : 'No Data'}
                                                  </span>
                                                )}
                                                {q.actionCommitment && q.actionCommitment !== 'none' && (
                                                  <span className={`text-xs px-2 py-1 rounded ${
                                                    q.actionCommitment === 'full' ? 'bg-purple-100 text-purple-700' : 'bg-yellow-100 text-yellow-700'
                                                  }`}>
                                                    {q.actionCommitment === 'full' ? 'Full Commitment' : 'Partial Commitment'}
                                                  </span>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Comparative Analysis */}
                          <div className="mt-6 border border-gray-200 rounded-lg p-4">
                            <h6 className="font-semibold text-gray-900 mb-4">Comparative Analysis</h6>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Best Performer</div>
                                <div className="font-semibold text-green-600">{getMinisterEfficiencyData().comparativeAnalysis.bestPerformer}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Most Improved</div>
                                <div className="font-semibold text-blue-600">{getMinisterEfficiencyData().comparativeAnalysis.mostImproved}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Highest Volume</div>
                                <div className="font-semibold text-purple-600">{getMinisterEfficiencyData().comparativeAnalysis.highestVolume}</div>
                              </div>
                              <div className="text-center">
                                <div className="text-sm text-gray-600">Fastest Response</div>
                                <div className="font-semibold text-orange-600">{getMinisterEfficiencyData().comparativeAnalysis.fastestResponse}</div>
                              </div>
                            </div>
                          </div>

                          {/* Session Type Analysis */}
                          <div className="mt-6 border border-gray-200 rounded-lg p-4">
                            <h6 className="font-semibold text-gray-900 mb-4">Question Session Analysis</h6>
                            <div className="space-y-3">
                              {Object.entries(getMinisterEfficiencyData().trends.sessionTypes).map(([sessionType, data]) => (
                                <div key={sessionType} className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">{sessionType}</span>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">{data.questions} questions</span>
                                    <span className="text-sm font-medium">{data.avgResponse}m avg</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Quality Analytics Section */}
                          <div className="mt-6 border border-gray-200 rounded-lg p-4">
                            <h6 className="font-semibold text-gray-900 mb-4">Response Quality Analysis</h6>
                            <div className="space-y-6">
                              {/* Overall Quality Metrics */}
                              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="text-center bg-blue-50 rounded-lg p-3">
                                  <div className="text-lg font-bold text-blue-600">{getMinisterEfficiencyData().qualityAnalytics.overallQualityScore}/10</div>
                                  <div className="text-xs text-gray-600">Overall Quality</div>
                                  <div className="text-xs text-green-600 font-medium">{getMinisterEfficiencyData().qualityAnalytics.qualityTrendMonthly}</div>
                                </div>
                                <div className="text-center bg-green-50 rounded-lg p-3">
                                  <div className="text-lg font-bold text-green-600">{getMinisterEfficiencyData().qualityAnalytics.substantiveAnswerRate}%</div>
                                  <div className="text-xs text-gray-600">Substantive Answers</div>
                                </div>
                                <div className="text-center bg-purple-50 rounded-lg p-3">
                                  <div className="text-lg font-bold text-purple-600">{getMinisterEfficiencyData().qualityAnalytics.dataTransparencyRate}%</div>
                                  <div className="text-xs text-gray-600">Data Transparency</div>
                                </div>
                                <div className="text-center bg-orange-50 rounded-lg p-3">
                                  <div className="text-lg font-bold text-orange-600">{getMinisterEfficiencyData().qualityAnalytics.actionCommitmentRate}%</div>
                                  <div className="text-xs text-gray-600">Action Commitments</div>
                                </div>
                              </div>

                              {/* Quality Breakdown by Portfolio */}
                              <div>
                                <div className="text-sm font-semibold text-gray-900 mb-3">Quality Metrics by Portfolio</div>
                                <div className="space-y-2">
                                  {Object.entries(getMinisterEfficiencyData().qualityAnalytics.qualityMetrics.responseCompleteness).filter(([key]) => key !== 'average').map(([portfolio, score]) => (
                                    <div key={portfolio} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <span className="text-sm font-medium capitalize">{portfolio}</span>
                                      <div className="flex items-center gap-3">
                                        <div className="text-xs text-gray-600">Completeness: {score}%</div>
                                        <div className="text-xs text-gray-600">
                                          Transparency: {(getMinisterEfficiencyData().qualityAnalytics.qualityMetrics.dataTransparency as any)[portfolio]}%
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          Commitments: {(getMinisterEfficiencyData().qualityAnalytics.qualityMetrics.actionCommitments as any)[portfolio]}%
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Quality Trends */}
                              <div>
                                <div className="text-sm font-semibold text-gray-900 mb-3">Quality Distribution Trends</div>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                  {Object.entries(getMinisterEfficiencyData().qualityAnalytics.qualityTrends).map(([category, data]) => (
                                    <div key={category} className="text-center p-2 border border-gray-200 rounded">
                                      <div className={`text-sm font-bold ${
                                        category === 'excellent' ? 'text-green-600' :
                                        category === 'good' ? 'text-blue-600' :
                                        category === 'adequate' ? 'text-yellow-600' : 'text-red-600'
                                      }`}>
                                        {data.current}%
                                      </div>
                                      <div className="text-xs text-gray-600 capitalize">{category}</div>
                                      <div className={`text-xs font-medium ${
                                        data.trend.startsWith('+') ? 'text-green-600' : 'text-red-600'
                                      }`}>
                                        {data.trend}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Quality by Question Complexity */}
                              <div>
                                <div className="text-sm font-semibold text-gray-900 mb-3">Quality by Question Complexity</div>
                                <div className="space-y-2">
                                  {Object.entries(getMinisterEfficiencyData().qualityAnalytics.questionComplexityQuality).map(([complexity, metrics]) => (
                                    <div key={complexity} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <span className="text-sm font-medium capitalize">{complexity} Questions</span>
                                      <div className="flex items-center gap-4">
                                        <span className="text-xs text-gray-600">Quality: {metrics.avgQuality}/10</span>
                                        <span className="text-xs text-gray-600">Satisfaction: {metrics.satisfaction}%</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Best Quality Indicators */}
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <div className="text-sm font-semibold text-green-800 mb-2">Quality Leaders</div>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 text-xs">
                                  <div>
                                    <span className="text-green-700">Best Quality Portfolio:</span>
                                    <span className="font-medium ml-1">{getMinisterEfficiencyData().qualityAnalytics.bestQualityPortfolio}</span>
                                  </div>
                                  <div>
                                    <span className="text-green-700">Most Improved Quality:</span>
                                    <span className="font-medium ml-1">{getMinisterEfficiencyData().qualityAnalytics.mostImprovedQuality}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}

            {/* House Boss Section - Only for House Boss */}
            {selectedFeature === 'house-boss' && (
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('house-boss-activities')}
                  className="w-full flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Scale className="w-5 h-5 text-yellow-600" />
                    <span className="text-lg font-semibold text-gray-900">Ceann Comhairle Activities</span>
                    <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs font-medium rounded-full">
                      {getHouseBossData().interventionSummary.totalInterventions} interventions
                    </span>
                  </div>
                  {expandedSections.has('house-boss-activities') ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {expandedSections.has('house-boss-activities') && (
                  <div className="mt-4 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="mb-6">
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">Parliamentary Order Management Analysis</h5>
                        <p className="text-gray-600">
                          Comprehensive analysis of the Ceann Comhairle's role in maintaining parliamentary order, 
                          including member reprimands, interventions, and debate management activities.
                        </p>
                      </div>

                      {/* Current Speaker Info */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                        <h6 className="font-semibold text-blue-900 mb-3">Current Ceann Comhairle</h6>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <div className="text-sm text-blue-700">Speaker</div>
                            <div className="font-bold text-blue-900">{getHouseBossData().currentSpeaker.name}</div>
                            <div className="text-xs text-blue-600">{getHouseBossData().currentSpeaker.constituency}</div>
                          </div>
                          <div>
                            <div className="text-sm text-blue-700">Years Serving</div>
                            <div className="font-bold text-blue-900">{getHouseBossData().currentSpeaker.yearsServing} years</div>
                            <div className="text-xs text-blue-600">Since {getHouseBossData().currentSpeaker.termStart}</div>
                          </div>
                          <div>
                            <div className="text-sm text-blue-700">Effectiveness</div>
                            <div className="font-bold text-blue-900">{getHouseBossData().currentSpeaker.efficiency}/10</div>
                            <div className="text-xs text-blue-600">{getHouseBossData().currentSpeaker.approval}% approval</div>
                          </div>
                        </div>
                      </div>

                      {/* Intervention Summary */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="text-center bg-red-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-red-600">{getHouseBossData().interventionSummary.memberReprimands}</div>
                          <div className="text-xs text-gray-600">Member Reprimands</div>
                        </div>
                        <div className="text-center bg-orange-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-orange-600">{getHouseBossData().interventionSummary.orderCalls}</div>
                          <div className="text-xs text-gray-600">Order Calls</div>
                        </div>
                        <div className="text-center bg-purple-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-purple-600">{getHouseBossData().interventionSummary.warningsIssued}</div>
                          <div className="text-xs text-gray-600">Warnings Issued</div>
                        </div>
                        <div className="text-center bg-green-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-green-600">{getHouseBossData().interventionSummary.controlRate}%</div>
                          <div className="text-xs text-gray-600">Control Rate</div>
                        </div>
                      </div>

                      {/* Interactive Interventions Graph */}
                      <div className="mb-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
                        <h6 className="font-semibold text-gray-900 mb-4">Interactive Interventions Analysis</h6>
                        
                        {/* Graph Filters */}
                        <div className="mb-4 flex flex-wrap gap-3">
                          <select 
                            value={selectedBillFilter}
                            onChange={(e) => setSelectedBillFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          >
                            <option value="all">All Bills</option>
                            <option value="housing">Housing Bills (23 interventions)</option>
                            <option value="health">Health Bills (18 interventions)</option>
                            <option value="climate">Climate Bills (15 interventions)</option>
                            <option value="justice">Justice Bills (12 interventions)</option>
                            <option value="education">Education Bills (9 interventions)</option>
                            <option value="transport">Transport Bills (7 interventions)</option>
                          </select>
                          
                          <select 
                            value={selectedVoteFilter}
                            onChange={(e) => setSelectedVoteFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          >
                            <option value="all">All Votes</option>
                            <option value="budget">Budget Votes (34 interventions)</option>
                            <option value="motion">Motion Votes (28 interventions)</option>
                            <option value="amendment">Amendment Votes (21 interventions)</option>
                            <option value="confidence">Confidence Votes (16 interventions)</option>
                            <option value="private">Private Members' Bills (8 interventions)</option>
                          </select>
                          
                          <select 
                            value={selectedMemberFilter}
                            onChange={(e) => setSelectedMemberFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                          >
                            <option value="all">All Members</option>
                            <option value="government">Government TDs (67 interventions)</option>
                            <option value="opposition">Opposition TDs (74 interventions)</option>
                            <option value="independent">Independent TDs (15 interventions)</option>
                            <option value="fianna-fail">Fianna Fáil (42 interventions)</option>
                            <option value="fine-gael">Fine Gael (25 interventions)</option>
                            <option value="sinn-fein">Sinn Féin (38 interventions)</option>
                            <option value="green">Green Party (12 interventions)</option>
                          </select>
                          
                          <input
                            type="date"
                            value={selectedDateFrom}
                            onChange={(e) => setSelectedDateFrom(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            title="From Date"
                          />
                          
                          <input
                            type="date"
                            value={selectedDateTo}
                            onChange={(e) => setSelectedDateTo(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500"
                            title="To Date"
                          />

                          {/* Filter Info Display */}
                          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                            <span className="text-yellow-700">
                              Filtered: {selectedBillFilter !== 'all' ? selectedBillFilter : 'all bills'} × 
                              {selectedVoteFilter !== 'all' ? ` ${selectedVoteFilter}` : ' all votes'} × 
                              {selectedMemberFilter !== 'all' ? ` ${selectedMemberFilter}` : ' all members'}
                            </span>
                          </div>
                        </div>

                        {/* Graph Visualization */}
                        <div className="bg-white rounded-lg p-4 border border-gray-300">
                          <div className="mb-4 flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">Interventions Over Time</h3>
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                <span>Total Interventions</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                                <span>Member Reprimands</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                                <span>Order Calls</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span>Session Control</span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Chart SVG */}
                          <div className="h-64 relative">
                            <svg className="w-full h-full" viewBox="0 0 800 200">
                              {/* Grid lines */}
                              <defs>
                                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
                                </pattern>
                              </defs>
                              <rect width="100%" height="100%" fill="url(#grid)" />
                              
                              {/* Y-axis labels */}
                              <g className="text-xs fill-gray-600">
                                <text x="20" y="20">Interventions</text>
                                <text x="30" y="40">25</text>
                                <text x="30" y="70">20</text>
                                <text x="30" y="100">15</text>
                                <text x="30" y="130">10</text>
                                <text x="30" y="160">5</text>
                                <text x="30" y="190">0</text>
                              </g>
                              
                              {/* X-axis labels */}
                              <g className="text-xs fill-gray-600">
                                {getFilteredGraphData().months.map((month, idx) => (
                                  <text key={month} x={100 + (idx * 100)} y="195">{month}</text>
                                ))}
                              </g>
                              
                              {/* Total Interventions Line */}
                              <polyline
                                fill="none"
                                stroke="#ef4444"
                                strokeWidth="3"
                                points={getFilteredGraphData().totalInterventionsPoints}
                              />
                              
                              {/* Member Reprimands Line */}
                              <polyline
                                fill="none"
                                stroke="#f97316"
                                strokeWidth="2"
                                points={getFilteredGraphData().memberReprimandsPoints}
                              />
                              
                              {/* Order Calls Line */}
                              <polyline
                                fill="none"
                                stroke="#a855f7"
                                strokeWidth="2"
                                points={getFilteredGraphData().orderCallsPoints}
                              />
                              
                              {/* Session Control Line */}
                              <polyline
                                fill="none"
                                stroke="#3b82f6"
                                strokeWidth="2"
                                points={getFilteredGraphData().sessionControlPoints}
                              />
                              
                              {/* Data points with hover titles */}
                              <g fill="#ef4444">
                                {getFilteredGraphData().totalInterventions.map((value, idx) => {
                                  const x = 100 + (idx * 100);
                                  const points = getFilteredGraphData().totalInterventionsPoints.split(' ');
                                  const y = parseInt(points[idx]?.split(',')[1] || '0');
                                  return (
                                    <circle 
                                      key={`total-${idx}`} 
                                      cx={x} 
                                      cy={y} 
                                      r="4"
                                      className="hover:r-6 cursor-pointer"
                                    >
                                      <title>{getFilteredGraphData().months[idx]}: {value} total interventions</title>
                                    </circle>
                                  );
                                })}
                              </g>
                              
                              {/* Member Reprimands data points */}
                              <g fill="#f97316">
                                {getFilteredGraphData().memberReprimands.map((value, idx) => {
                                  const x = 100 + (idx * 100);
                                  const points = getFilteredGraphData().memberReprimandsPoints.split(' ');
                                  const y = parseInt(points[idx]?.split(',')[1] || '0');
                                  return (
                                    <circle 
                                      key={`reprimands-${idx}`} 
                                      cx={x} 
                                      cy={y} 
                                      r="3"
                                      className="hover:r-5 cursor-pointer"
                                    >
                                      <title>{getFilteredGraphData().months[idx]}: {value} member reprimands</title>
                                    </circle>
                                  );
                                })}
                              </g>

                              {/* Order Calls data points */}
                              <g fill="#a855f7">
                                {getFilteredGraphData().orderCalls.map((value, idx) => {
                                  const x = 100 + (idx * 100);
                                  const points = getFilteredGraphData().orderCallsPoints.split(' ');
                                  const y = parseInt(points[idx]?.split(',')[1] || '0');
                                  return (
                                    <circle 
                                      key={`orders-${idx}`} 
                                      cx={x} 
                                      cy={y} 
                                      r="3"
                                      className="hover:r-5 cursor-pointer"
                                    >
                                      <title>{getFilteredGraphData().months[idx]}: {value} order calls</title>
                                    </circle>
                                  );
                                })}
                              </g>

                              {/* Session Control data points */}
                              <g fill="#3b82f6">
                                {getFilteredGraphData().sessionControl.map((value, idx) => {
                                  const x = 100 + (idx * 100);
                                  const points = getFilteredGraphData().sessionControlPoints.split(' ');
                                  const y = parseInt(points[idx]?.split(',')[1] || '0');
                                  return (
                                    <circle 
                                      key={`control-${idx}`} 
                                      cx={x} 
                                      cy={y} 
                                      r="3"
                                      className="hover:r-5 cursor-pointer"
                                    >
                                      <title>{getFilteredGraphData().months[idx]}: {value}% session control</title>
                                    </circle>
                                  );
                                })}
                              </g>
                            </svg>
                          </div>
                        </div>

                        {/* Graph Statistics */}
                        <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-sm text-gray-600">Peak Month</div>
                            <div className="font-bold text-gray-900">
                              {getFilteredGraphData().months[getFilteredGraphData().totalInterventions.indexOf(Math.max(...getFilteredGraphData().totalInterventions))]} 2024
                            </div>
                            <div className="text-xs text-red-600">
                              {Math.max(...getFilteredGraphData().totalInterventions)} interventions
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-sm text-gray-600">Most Active Category</div>
                            <div className="font-bold text-gray-900">
                              {selectedBillFilter !== 'all' ? selectedBillFilter.charAt(0).toUpperCase() + selectedBillFilter.slice(1) + ' Bills' : 'Housing Crisis'}
                            </div>
                            <div className="text-xs text-orange-600">
                              {getFilteredGraphData().totalInterventions.reduce((a, b) => a + b, 0)} total interventions
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-sm text-gray-600">Target Group</div>
                            <div className="font-bold text-gray-900">
                              {selectedMemberFilter !== 'all' ? 
                                selectedMemberFilter.charAt(0).toUpperCase() + selectedMemberFilter.slice(1).replace('-', ' ') + ' TDs' : 
                                'All Members'
                              }
                            </div>
                            <div className="text-xs text-purple-600">
                              {getFilteredGraphData().memberReprimands.reduce((a, b) => a + b, 0)} reprimands
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 border border-gray-200">
                            <div className="text-sm text-gray-600">Control Efficiency</div>
                            <div className="font-bold text-gray-900">
                              {Math.round(getFilteredGraphData().sessionControl.reduce((a, b) => a + b, 0) / getFilteredGraphData().sessionControl.length)}%
                            </div>
                            <div className="text-xs text-green-600">Average session control</div>
                          </div>
                        </div>

                        {/* Drill-down Options */}
                        <div className="mt-4 flex flex-wrap gap-2">
                          <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm hover:bg-blue-200 transition-colors">
                            View by Member
                          </button>
                          <button className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm hover:bg-green-200 transition-colors">
                            View by Bill Type
                          </button>
                          <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm hover:bg-purple-200 transition-colors">
                            View by Session
                          </button>
                          <button className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm hover:bg-orange-200 transition-colors">
                            Export Data
                          </button>
                        </div>
                      </div>

                      {/* Interventions by Type */}
                      <div className="mb-6">
                        <h6 className="font-semibold text-gray-900 mb-4">Interventions by Type</h6>
                        <div className="space-y-4">
                          {getHouseBossData().interventionsByType.map((type, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    type.severity === 'high' ? 'bg-red-500' :
                                    type.severity === 'moderate' ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}></div>
                                  <div className="font-semibold text-gray-900">{type.type}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600">{type.count} incidents</span>
                                  <span className={`text-sm font-medium ${
                                    type.trend.startsWith('+') ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {type.trend}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-yellow-500 h-2 rounded-full"
                                    style={{ width: `${type.percentage}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Recent Examples */}
                              <div className="space-y-2">
                                {type.examples.slice(0, 2).map((example, exIdx) => (
                                  <div key={exIdx} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-blue-600">{example.member}</span>
                                      <span className="text-xs text-gray-500">{example.date}</span>
                                    </div>
                                    <div className="text-xs text-gray-700 mb-1">
                                      <strong>Debate:</strong> 
                                      <button
                                        onClick={() => openDebateContextModal(
                                          example.member,
                                          example.debate,
                                          example.date,
                                          'Current',
                                          `Incident during ${example.debate}: ${example.incident}. Speaker action: ${example.action}`,
                                          example.debateId
                                        )}
                                        className="ml-1 text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {example.debate}
                                      </button>
                                    </div>
                                    <div className="text-xs text-gray-700 mb-1">
                                      <strong>Incident:</strong> {example.incident}
                                    </div>
                                    <div className="text-xs text-gray-700">
                                      <strong>Action:</strong> {example.action}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Repeat Offenders */}
                      <div className="mb-6">
                        <h6 className="font-semibold text-gray-900 mb-4">Members Requiring Most Interventions</h6>
                        <div className="space-y-3">
                          {getHouseBossData().interventionsByMember.map((member, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg">
                              <button
                                onClick={() => {
                                  const memberId = member.member.replace(' ', '_').toLowerCase();
                                  setExpandedMemberIncidents(prev => {
                                    const newSet = new Set(prev);
                                    if (newSet.has(memberId)) {
                                      newSet.delete(memberId);
                                    } else {
                                      newSet.add(memberId);
                                    }
                                    return newSet;
                                  });
                                }}
                                className="w-full flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                              >
                                <div className="text-left">
                                  <div className="font-medium text-gray-900">{member.member}</div>
                                  <div className="text-sm text-gray-600">{member.party} • {member.constituency}</div>
                                  <div className="text-xs text-gray-500">{member.pattern}</div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                  <div>
                                    <div className={`text-lg font-bold ${
                                      member.severity === 'High' ? 'text-red-600' :
                                      member.severity === 'Moderate' ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                      {member.totalIncidents}
                                    </div>
                                    <div className="text-xs text-gray-600">incidents</div>
                                    <div className="text-xs text-gray-500">Last: {member.lastIncident}</div>
                                  </div>
                                  {expandedMemberIncidents.has(member.member.replace(' ', '_').toLowerCase()) ? (
                                    <ChevronUp className="w-4 h-4 text-gray-600" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-600" />
                                  )}
                                </div>
                              </button>
                              
                              {expandedMemberIncidents.has(member.member.replace(' ', '_').toLowerCase()) && (
                                <div className="p-4 border-t border-gray-200 bg-white">
                                  <h6 className="font-semibold text-gray-900 mb-3">Detailed Incident History</h6>
                                  <div className="space-y-3">
                                    {/* Generate detailed incidents for this member */}
                                    {getDetailedIncidentsForMember(member.member).map((incident, incIdx) => (
                                      <div key={incIdx} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                              incident.severity === 'High' ? 'bg-red-500' :
                                              incident.severity === 'Moderate' ? 'bg-yellow-500' : 'bg-green-500'
                                            }`}></div>
                                            <span className="font-medium text-gray-900">{incident.type}</span>
                                          </div>
                                          <span className="text-xs text-gray-500">{incident.date}</span>
                                        </div>
                                        
                                        <div className="mb-2">
                                          <button
                                            onClick={() => openDebateContextModal(
                                              member.member,
                                              incident.debate,
                                              incident.date,
                                              'Current',
                                              incident.fullContext,
                                              incident.debateId
                                            )}
                                            className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                          >
                                            {incident.debate}
                                          </button>
                                        </div>
                                        
                                        <div className="text-sm text-gray-700 mb-2">
                                          <div className="font-medium text-gray-900 mb-1">What Happened:</div>
                                          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-2">
                                            <em>"{incident.spokenText}"</em>
                                          </div>
                                        </div>
                                        
                                        <div className="text-xs text-gray-600 mb-1">
                                          <strong>Speaker Action:</strong> {incident.action}
                                        </div>
                                        
                                        <div className="text-xs text-gray-600">
                                          <strong>Context:</strong> {incident.context}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Interventions by Topic */}
                      <div className="mb-6">
                        <h6 className="font-semibold text-gray-900 mb-4">Interventions by Debate Topic</h6>
                        <div className="space-y-3">
                          {getHouseBossData().interventionsByTopic.map((topic, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{topic.topic}</div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm text-gray-600">{topic.incidents} incidents</span>
                                  <span className="text-sm text-gray-500">({topic.percentage}%)</span>
                                </div>
                              </div>
                              <div className="text-sm text-gray-600 mb-2">
                                <strong>Avg Severity:</strong> {topic.avgSeverity}/10
                              </div>
                              <div className="text-xs text-gray-600 mb-2">
                                <strong>Common Issues:</strong> {topic.commonIssues.join(', ')}
                              </div>
                              <div className="text-xs text-blue-600">
                                <strong>Recent:</strong> 
                                <button
                                  onClick={() => openDebateContextModal(
                                    'Multiple Members',
                                    topic.recentDebate.split(' - ')[0],
                                    topic.recentDebate.split(' - ')[1] || '2024-03-15',
                                    'Current',
                                    `Recent debate on ${topic.topic}: ${topic.recentDebate}. Common issues include: ${topic.commonIssues.join(', ')}.`,
                                    `2024-${topic.topic.replace(/\s+/g, '').substring(0,2).toUpperCase()}-001`
                                  )}
                                  className="ml-1 text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {topic.recentDebate}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Recent Highlights */}
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <h6 className="font-semibold text-yellow-800 mb-3">Recent Notable Interventions</h6>
                        <div className="space-y-3">
                          {getHouseBossData().recentHighlights.map((highlight, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{highlight.session}</div>
                                <div className="text-sm text-gray-500">{highlight.date}</div>
                              </div>
                              <div className="text-sm text-gray-700 mb-1">{highlight.summary}</div>
                              <div className="text-xs text-gray-600 mb-1">
                                <strong>Impact:</strong> {highlight.impact}
                              </div>
                              <div className="text-xs text-green-700">
                                <strong>Outcome:</strong> {highlight.outcome}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Unparliamentary Language Section - Only for Unparliamentary Language */}
            {selectedFeature === 'unparliamentary-language' && (
              <div className="mb-8">
                <button
                  onClick={() => toggleSection('unparliamentary-language-analysis')}
                  className="w-full flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <span className="text-lg font-semibold text-gray-900">Unparliamentary Language Analysis</span>
                    <span className="px-2 py-1 bg-red-200 text-red-800 text-xs font-medium rounded-full">
                      {getUnparliamentaryLanguageData().summary.totalIncidents} incidents
                    </span>
                  </div>
                  {expandedSections.has('unparliamentary-language-analysis') ? (
                    <ChevronUp className="w-5 h-5 text-gray-600" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-600" />
                  )}
                </button>

                {expandedSections.has('unparliamentary-language-analysis') && (
                  <div className="mt-4 space-y-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <div className="mb-6">
                        <h5 className="text-lg font-semibold text-gray-900 mb-2">Parliamentary Language Standards Analysis</h5>
                        <p className="text-gray-600">
                          Comprehensive analysis of inappropriate language usage in parliamentary debates, 
                          including frequency patterns, member statistics, and Speaker intervention effectiveness.
                        </p>
                      </div>

                      {/* Summary Statistics */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="text-center bg-red-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-red-600">{getUnparliamentaryLanguageData().summary.totalIncidents}</div>
                          <div className="text-xs text-gray-600">Total Incidents</div>
                        </div>
                        <div className="text-center bg-orange-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-orange-600">{getUnparliamentaryLanguageData().summary.uniqueTerms}</div>
                          <div className="text-xs text-gray-600">Unique Terms</div>
                        </div>
                        <div className="text-center bg-purple-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-purple-600">{getUnparliamentaryLanguageData().summary.averagePerWeek}</div>
                          <div className="text-xs text-gray-600">Per Week</div>
                        </div>
                        <div className="text-center bg-green-50 rounded-lg p-3">
                          <div className="text-lg font-bold text-green-600">{getUnparliamentaryLanguageData().summary.withdrawalRate}%</div>
                          <div className="text-xs text-gray-600">Withdrawal Rate</div>
                        </div>
                      </div>

                      {/* Term Categories */}
                      <div className="mb-6">
                        <h6 className="font-semibold text-gray-900 mb-4">Language Categories</h6>
                        <div className="space-y-4">
                          {getUnparliamentaryLanguageData().termCategories.map((category, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className={`w-3 h-3 rounded-full ${
                                    category.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                                  }`}></div>
                                  <div className="font-semibold text-gray-900">{category.category}</div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600">{category.count} incidents</span>
                                  <span className={`text-sm font-medium ${
                                    category.trend.startsWith('+') ? 'text-red-600' : 'text-green-600'
                                  }`}>
                                    {category.trend}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mb-3">
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div 
                                    className="bg-red-500 h-2 rounded-full"
                                    style={{ width: `${category.percentage}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Recent Examples */}
                              <div className="space-y-2">
                                {category.examples.slice(0, 2).map((example, exIdx) => (
                                  <div key={exIdx} className="bg-gray-50 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-sm font-medium text-red-600">"{example.term}"</span>
                                      <span className="text-xs text-gray-500">Used {example.frequency} times</span>
                                    </div>
                                    <div className="text-xs text-gray-700 mb-1">
                                      <strong>Context:</strong> {example.context}
                                    </div>
                                    <div className="text-xs text-gray-700 mb-1">
                                      <strong>Last used by:</strong> {example.member}
                                    </div>
                                    <div className="text-xs text-gray-700">
                                      <strong>In debate:</strong> 
                                      <button
                                        onClick={() => openDebateContextModal(
                                          example.member,
                                          example.debate,
                                          example.lastUsed,
                                          'Current',
                                          `Unparliamentary language incident: "${example.term}" used in context of ${example.context}`,
                                          `2024-${example.debate.replace(/\s+/g, '').substring(0,2).toUpperCase()}-001`
                                        )}
                                        className="ml-1 text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {example.debate}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Top Offenders */}
                      <div className="mb-6">
                        <h6 className="font-semibold text-gray-900 mb-4">Most Frequent Users</h6>
                        <div className="space-y-3">
                          {getUnparliamentaryLanguageData().memberStatistics.map((member, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div>
                                <div className="font-medium text-gray-900">{member.member}</div>
                                <div className="text-sm text-gray-600">{member.party} • {member.constituency}</div>
                                <div className="text-xs text-gray-500">Primary context: {member.primaryContext}</div>
                                <div className="text-xs text-gray-500">Most used: "{member.mostUsedTerm}"</div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-red-600">{member.totalInstances}</div>
                                <div className="text-xs text-gray-600">incidents</div>
                                <div className="text-xs text-gray-500">{member.uniqueTerms} unique terms</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Contextual Examples */}
                      <div className="mb-6">
                        <h6 className="font-semibold text-gray-900 mb-4">Recent Examples with Context</h6>
                        <div className="space-y-4">
                          {getUnparliamentaryLanguageData().contextualExamples.map((example, idx) => (
                            <div key={idx} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{example.member}</div>
                                <div className="text-sm text-gray-500">{example.date}</div>
                              </div>
                              
                              <div className="mb-2">
                                <button
                                  onClick={() => openDebateContextModal(
                                    example.member,
                                    example.context,
                                    example.date,
                                    'Current',
                                    `Unparliamentary language incident: ${example.fullQuote}. Speaker action: ${example.speakerAction}. Outcome: ${example.outcome}`,
                                    example.debateId
                                  )}
                                  className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
                                >
                                  {example.context}
                                </button>
                              </div>
                              
                              <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-2">
                                <div className="text-sm text-gray-900 mb-1">
                                  <strong>What was said:</strong>
                                </div>
                                <div className="text-sm text-red-800 italic">
                                  "{example.fullQuote}"
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-600 mb-1">
                                <strong>Speaker Action:</strong> {example.speakerAction}
                              </div>
                              
                              <div className="text-xs text-gray-600">
                                <strong>Outcome:</strong> {example.outcome}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Topic Analysis */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <h6 className="font-semibold text-red-800 mb-3">Language by Topic</h6>
                        <div className="space-y-3">
                          {getUnparliamentaryLanguageData().topicAnalysis.map((topic, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <div className="font-medium text-gray-900">{topic.topic}</div>
                                <div className="text-sm text-gray-500">{topic.incidents} incidents ({topic.percentage}%)</div>
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                <strong>Common terms:</strong> {topic.commonTerms.map(term => `"${term}"`).join(', ')}
                              </div>
                              <div className="text-xs text-gray-600 mb-1">
                                <strong>Emotional intensity:</strong> {topic.emotionalIntensity}/10
                              </div>
                              <div className="text-xs text-green-700">
                                <strong>Speaker interventions:</strong> {topic.speakerInterventions} ({Math.round((topic.speakerInterventions/topic.incidents)*100)}% response rate)
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Word Cloud Modal */}
      <WordCloudModal
        isOpen={wordCloudModal.isOpen}
        onClose={closeWordCloudModal}
        memberName={wordCloudModal.memberName}
        debateTopic={wordCloudModal.debateTopic}
        date={wordCloudModal.date}
        emotionType={wordCloudModal.emotionType}
        intensity={wordCloudModal.intensity}
      />
      
      {/* Debate Context Modal */}
      <DebateContextModal
        isOpen={debateContextModal.isOpen}
        onClose={closeDebateContextModal}
        memberName={debateContextModal.memberName}
        debateTitle={debateContextModal.debateTitle}
        date={debateContextModal.date}
        term={debateContextModal.term}
        context={debateContextModal.context}
        voteId={debateContextModal.voteId}
      />
    </div>
  );
}