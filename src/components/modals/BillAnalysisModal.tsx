import { useState, useEffect } from 'react';
import { X, FileText, Calendar, Users, TrendingUp, AlertCircle, CheckCircle, Clock, HelpCircle } from 'lucide-react';

interface BillAnalysis {
  billId: string;
  title: string;
  stage: 'introduced' | 'committee' | 'second_reading' | 'third_reading' | 'signed' | 'rejected';
  complexity: 'low' | 'medium' | 'high';
  impactScore: number;
  summary: string;
  keyProvisions: string[];
  potentialImpacts: string[];
  stakeholders: string[];
  timeline: string;
  aiConfidence: number;
  relatedBills: string[];
  publicInterest: number;
  // Date information
  startDate: string; // When bill was introduced
  approvedDate?: string; // When bill was signed (if applicable)
  rejectedDate?: string; // When bill was rejected (if applicable)
  firstReadingDate?: string;
  secondReadingDate?: string;
  thirdReadingDate?: string;
  committeeDetails?: {
    name: string;
    members: string[];
    chairperson: string;
  };
}

interface BillAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function BillAnalysisModal({ isOpen, onClose }: BillAnalysisModalProps) {
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDateFilter, setStartDateFilter] = useState<string>('');
  const [approvedDateFilter, setApprovedDateFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'impact' | 'interest' | 'timeline'>('impact');
  const [bills, setBills] = useState<BillAnalysis[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [showImpactTooltip, setShowImpactTooltip] = useState<string | null>(null);
  const [showPublicInterestTooltip, setShowPublicInterestTooltip] = useState<string | null>(null);
  const [showStakeholdersTooltip, setShowStakeholdersTooltip] = useState<string | null>(null);
  const [showRelatedBillsTooltip, setShowRelatedBillsTooltip] = useState<string | null>(null);
  const [showRejectionTooltip, setShowRejectionTooltip] = useState<string | null>(null);
  const [showCommitteeTooltip, setShowCommitteeTooltip] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchBillAnalyses();
    }
  }, [isOpen]);

  const fetchBillAnalyses = async () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      const mockBills = generateMockBillAnalyses();
      const uniqueCategories = ['Housing', 'Healthcare', 'Environment', 'Education', 'Justice'];
      
      setBills(mockBills);
      setCategories(uniqueCategories);
      setLoading(false);
    }, 1000);
  };

  const generateMockBillAnalyses = (): BillAnalysis[] => {
    const titles = [
      'Housing (Regulation of Approved Housing Bodies) Bill 2024',
      'Health (Amendment) Act 2024',
      'Climate Action and Low Carbon Development (Amendment) Bill',
      'Education (Student Support) Bill 2024',
      'Criminal Justice (Hate Crime) Bill 2024',
      'Transport (Public Bus Services) Bill 2024',
      'Social Welfare (Consolidation) Bill 2024',
      'Planning and Development (Amendment) Bill 2024'
    ];

    const stages = ['introduced', 'committee', 'second_reading', 'third_reading', 'signed', 'rejected'] as const;
    const complexities = ['low', 'medium', 'high'] as const;

    const committees = [
      {
        name: 'Committee on Housing, Local Government and Heritage',
        members: ['Deputy Peter Burke (Chair)', 'Deputy Darragh O\'Brien', 'Deputy Eoin Ó Broin', 'Deputy Richard Boyd Barrett', 'Deputy Paul McAuliffe'],
        chairperson: 'Deputy Peter Burke'
      },
      {
        name: 'Committee on Health',
        members: ['Deputy Colm Burke (Chair)', 'Deputy Stephen Donnelly', 'Deputy David Cullinane', 'Deputy Róisín Shortall', 'Deputy Gino Kenny'],
        chairperson: 'Deputy Colm Burke'
      },
      {
        name: 'Committee on Environment and Climate Action',
        members: ['Deputy Brian Leddin (Chair)', 'Deputy Eamon Ryan', 'Deputy Jennifer Whitmore', 'Deputy Bríd Smith', 'Deputy Richard Bruton'],
        chairperson: 'Deputy Brian Leddin'
      },
      {
        name: 'Committee on Education, Further and Higher Education',
        members: ['Deputy Paul Kehoe (Chair)', 'Deputy Norma Foley', 'Deputy Aodhán Ó Ríordáin', 'Deputy Gary Gannon', 'Deputy Rose Conway-Walsh'],
        chairperson: 'Deputy Paul Kehoe'
      },
      {
        name: 'Committee on Justice',
        members: ['Deputy James Lawless (Chair)', 'Deputy Helen McEntee', 'Deputy Jim O\'Callaghan', 'Deputy Pa Daly', 'Deputy Violet-Anne Wynne'],
        chairperson: 'Deputy James Lawless'
      }
    ];

    const generateRandomDate = (daysBack: number, daysForward: number = 0) => {
      const date = new Date();
      const randomDays = Math.floor(Math.random() * (daysBack + daysForward)) - daysBack;
      date.setDate(date.getDate() + randomDays);
      return date.toISOString().split('T')[0];
    };

    return titles.map((title, i) => {
      const stage = stages[Math.floor(Math.random() * stages.length)];
      const startDate = generateRandomDate(365); // Up to 1 year ago
      const firstReadingDate = new Date(startDate);
      firstReadingDate.setDate(firstReadingDate.getDate() + Math.floor(Math.random() * 30) + 7);
      
      let secondReadingDate, thirdReadingDate, approvedDate, rejectedDate;
      let committeeDetails;

      // Generate progressive dates based on stage
      if (stage !== 'introduced') {
        secondReadingDate = new Date(firstReadingDate);
        secondReadingDate.setDate(secondReadingDate.getDate() + Math.floor(Math.random() * 60) + 14);
        
        if (stage === 'committee') {
          committeeDetails = committees[i % committees.length];
        }
        
        if (stage === 'third_reading' || stage === 'signed' || stage === 'rejected') {
          thirdReadingDate = new Date(secondReadingDate);
          thirdReadingDate.setDate(thirdReadingDate.getDate() + Math.floor(Math.random() * 45) + 10);
          
          if (stage === 'signed') {
            approvedDate = new Date(thirdReadingDate);
            approvedDate.setDate(approvedDate.getDate() + Math.floor(Math.random() * 14) + 1);
          } else if (stage === 'rejected') {
            rejectedDate = new Date(thirdReadingDate);
            rejectedDate.setDate(rejectedDate.getDate() + Math.floor(Math.random() * 7) + 1);
          }
        }
      }

      // Unique, detailed summaries for each bill
      const summaries = [
        "This comprehensive housing legislation introduces stringent regulatory oversight for Approved Housing Bodies (AHBs) operating in Ireland. The bill establishes mandatory registration requirements, financial transparency standards, and tenant protection mechanisms. Key provisions include annual compliance audits, standardized tenant complaint procedures, and enhanced powers for the Housing Regulator to investigate and sanction non-compliant organizations. The legislation responds to growing concerns about housing quality and management practices in the social housing sector.",
        
        "The Health Amendment Act 2024 modernizes Ireland's healthcare delivery system through digital transformation and patient-centered reforms. This legislation mandates the implementation of electronic health records across all HSE facilities, establishes telemedicine standards, and creates new patient advocacy roles. The bill introduces performance-based funding for hospitals, streamlines medical device approval processes, and enhances mental health service integration. These changes aim to reduce waiting times and improve healthcare accessibility across rural and urban areas.",
        
        "Ireland's most ambitious climate legislation to date, this bill establishes legally binding carbon reduction targets of 51% by 2030 and net-zero emissions by 2050. The legislation creates a Climate Action Authority with enforcement powers, introduces carbon budgeting for government departments, and mandates climate impact assessments for all major infrastructure projects. New provisions include enhanced support for renewable energy projects, stricter building energy standards, and a just transition fund for communities dependent on fossil fuel industries.",
        
        "This transformative education bill overhauls student financial support mechanisms, introducing income-contingent loans and expanded grant eligibility. The legislation establishes a Student Support Agency, implements needs-based assessment criteria, and creates emergency hardship funds for vulnerable students. Key innovations include digital application processes, automatic eligibility verification, and support for non-traditional learners including mature students and apprentices. The bill aims to make higher education more accessible regardless of socioeconomic background.",
        
        "Groundbreaking hate crime legislation that expands Ireland's criminal justice framework to address identity-based violence and harassment. The bill introduces enhanced sentencing guidelines for crimes motivated by bias against protected characteristics including race, religion, sexual orientation, gender identity, and disability. New provisions include specialized hate crime units within An Garda Síochána, victim support services, and mandatory bias incident reporting. The legislation also establishes restorative justice programs and community education initiatives.",
        
        "This comprehensive transport reform bill restructures Ireland's public bus services to improve efficiency and passenger experience. The legislation establishes Bus Éireann as the primary operator while creating competitive frameworks for private operators in specific routes. Key provisions include integrated ticketing systems, accessibility standards compliance, and environmental sustainability requirements. The bill introduces performance monitoring mechanisms, passenger charter rights, and funding formulas that incentivize punctuality and customer satisfaction.",
        
        "Major social welfare consolidation legislation that simplifies Ireland's complex benefits system into a streamlined, digital-first framework. The bill merges multiple payment schemes, introduces universal basic payment principles, and establishes automated eligibility assessment systems. New provisions include enhanced fraud detection capabilities, flexible payment options, and improved support for those transitioning between employment and benefits. The legislation aims to reduce administrative burden while maintaining comprehensive social protection coverage.",
        
        "Strategic planning reform that modernizes Ireland's development framework to address housing shortages and climate challenges. The bill introduces fast-track approval processes for strategic housing developments, mandates climate resilience assessments, and strengthens community consultation requirements. Key provisions include enhanced enforcement powers for planning authorities, standardized development contribution schemes, and new appeals procedures. The legislation balances development needs with environmental protection and community interests."
      ];

      const keyProvisionsList = [
        [
          'Mandatory registration and licensing for all Approved Housing Bodies',
          'Annual financial audits and transparency reporting requirements',
          'Standardized tenant complaint and resolution procedures',
          'Enhanced regulatory powers including sanctions and enforcement'
        ],
        [
          'Electronic health records implementation across all HSE facilities',
          'Telemedicine service standards and certification requirements',
          'Performance-based hospital funding mechanisms',
          'Patient advocacy roles and enhanced complaints procedures'
        ],
        [
          'Legally binding 51% carbon reduction target by 2030',
          'Climate Action Authority with investigation and enforcement powers',
          'Mandatory climate impact assessments for major projects',
          'Just transition fund for fossil fuel-dependent communities'
        ],
        [
          'Income-contingent student loan system with flexible repayment',
          'Expanded grant eligibility for vulnerable and non-traditional students',
          'Digital-first application and assessment processes',
          'Emergency hardship funds and crisis support mechanisms'
        ],
        [
          'Enhanced sentencing for bias-motivated crimes across protected characteristics',
          'Specialized hate crime investigation units within An Garda Síochána',
          'Comprehensive victim support and restorative justice programs',
          'Mandatory bias incident reporting and community education initiatives'
        ],
        [
          'Competitive framework for public transport route licensing',
          'Integrated ticketing and payment systems across operators',
          'Mandatory accessibility compliance and environmental standards',
          'Performance monitoring with passenger satisfaction metrics'
        ],
        [
          'Consolidation of multiple benefit schemes into unified system',
          'Automated eligibility assessment and digital service delivery',
          'Enhanced fraud detection and prevention capabilities',
          'Flexible payment options and employment transition support'
        ],
        [
          'Fast-track approval processes for strategic housing developments',
          'Mandatory climate resilience and environmental impact assessments',
          'Standardized development contribution and community benefit schemes',
          'Enhanced planning authority enforcement and appeals procedures'
        ]
      ];

      const potentialImpactsList = [
        [
          'Improved housing quality and tenant protection in social housing sector',
          'Enhanced financial transparency and accountability for housing bodies',
          'Standardized complaint resolution reducing tenant disputes',
          'Potential increased operational costs for smaller housing organizations'
        ],
        [
          'Reduced healthcare waiting times through digital efficiency gains',
          'Improved patient outcomes via integrated electronic health records',
          'Enhanced rural healthcare access through telemedicine expansion',
          'Significant upfront technology investment costs for healthcare providers'
        ],
        [
          'Accelerated transition to renewable energy and green economy jobs',
          'Enhanced Ireland\'s international climate leadership and EU compliance',
          'Improved air quality and public health outcomes',
          'Economic adjustment costs for traditional energy sector workers'
        ],
        [
          'Increased higher education participation among disadvantaged groups',
          'Reduced student debt burden through income-contingent repayments',
          'Enhanced support for mature students and career changers',
          'Potential increased government expenditure on education support'
        ],
        [
          'Stronger protection for marginalized communities from targeted violence',
          'Enhanced public confidence in justice system\'s response to bias crimes',
          'Improved hate crime data collection and trend analysis',
          'Potential concerns about freedom of expression and proportionate sentencing'
        ],
        [
          'Improved public transport reliability and passenger satisfaction',
          'Enhanced accessibility for disabled and elderly passengers',
          'Reduced environmental impact through cleaner bus technologies',
          'Potential service disruption during transition to new operating models'
        ],
        [
          'Simplified benefit applications reducing administrative burden on citizens',
          'Improved fraud prevention protecting public resources',
          'Enhanced support for vulnerable groups through automated assessments',
          'Potential privacy concerns regarding increased data collection and sharing'
        ],
        [
          'Accelerated housing delivery addressing accommodation shortages',
          'Improved climate resilience in new developments',
          'Enhanced community participation in planning decisions',
          'Potential reduced development flexibility and increased compliance costs'
        ]
      ];

      return {
        billId: `bill_${i + 1}`,
        title,
        stage,
        complexity: complexities[Math.floor(Math.random() * complexities.length)],
        impactScore: Math.floor(Math.random() * 40) + 60,
        summary: summaries[i],
        keyProvisions: keyProvisionsList[i],
        potentialImpacts: potentialImpactsList[i],
        stakeholders: [
          [
            'Housing Regulator',
            'Approved Housing Bodies Ireland',
            'Tenant advocacy groups',
            'Department of Housing'
          ],
          [
            'Health Service Executive',
            'Irish Medical Organisation',
            'Patient advocacy groups',
            'Department of Health'
          ],
          [
            'Climate Change Advisory Council',
            'Environmental Protection Agency',
            'Irish Business and Employers Confederation',
            'Department of Environment'
          ],
          [
            'Higher Education Authority',
            'Union of Students in Ireland',
            'Universities Ireland',
            'Department of Education'
          ],
          [
            'An Garda Síochána',
            'Irish Human Rights Commission',
            'LGBTI+ advocacy organizations',
            'Department of Justice'
          ],
          [
            'National Transport Authority',
            'Bus Éireann',
            'Disability advocacy groups',
            'Department of Transport'
          ],
          [
            'Department of Social Protection',
            'Irish National Organisation of the Unemployed',
            'Society of St. Vincent de Paul',
            'Citizens Information Board'
          ],
          [
            'An Bord Pleanála',
            'Construction Industry Federation',
            'An Taisce',
            'Department of Housing'
          ]
        ][i],
        timeline: `Expected completion: ${Math.floor(Math.random() * 6) + 3} months`,
        aiConfidence: Math.floor(Math.random() * 20) + 80,
        relatedBills: titles.filter((_, j) => j !== i).slice(0, 2),
        publicInterest: Math.floor(Math.random() * 40) + 30,
        startDate,
        firstReadingDate: firstReadingDate.toISOString().split('T')[0],
        secondReadingDate: secondReadingDate?.toISOString().split('T')[0],
        thirdReadingDate: thirdReadingDate?.toISOString().split('T')[0],
        approvedDate: approvedDate?.toISOString().split('T')[0],
        rejectedDate: rejectedDate?.toISOString().split('T')[0],
        committeeDetails
      };
    });
  };

  const calculateBillDuration = (startDate: string): string => {
    const start = new Date(startDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} days`;
    } else {
      const months = Math.floor(diffDays / 30);
      const remainingDays = diffDays % 30;
      if (remainingDays === 0) {
        return `${months} month${months > 1 ? 's' : ''}`;
      }
      return `${months} month${months > 1 ? 's' : ''} ${remainingDays} days`;
    }
  };

  const getStageColor = (stage: string) => {
    const colors = {
      introduced: 'bg-blue-100 text-blue-800',
      committee: 'bg-yellow-100 text-yellow-800',
      second_reading: 'bg-orange-100 text-orange-800',
      third_reading: 'bg-purple-100 text-purple-800',
      signed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getComplexityColor = (complexity: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return colors[complexity as keyof typeof colors] || colors.medium;
  };

  const getImpactScoreReasoning = (bill: BillAnalysis) => {
    const factors = [];
    
    // Complexity factor
    if (bill.complexity === 'high') {
      factors.push('High legislative complexity (+15 points)');
    } else if (bill.complexity === 'medium') {
      factors.push('Medium legislative complexity (+10 points)');
    } else {
      factors.push('Low legislative complexity (+5 points)');
    }
    
    // Public interest factor
    if (bill.publicInterest > 70) {
      factors.push('High public interest (+20 points)');
    } else if (bill.publicInterest > 50) {
      factors.push('Moderate public interest (+15 points)');
    } else {
      factors.push('Limited public interest (+10 points)');
    }
    
    // Stage factor
    if (bill.stage === 'third_reading' || bill.stage === 'signed') {
      factors.push('Advanced legislative stage (+15 points)');
    } else if (bill.stage === 'second_reading' || bill.stage === 'committee') {
      factors.push('Active legislative stage (+10 points)');
    } else {
      factors.push('Early legislative stage (+5 points)');
    }
    
    // Stakeholder impact
    if (bill.stakeholders.length > 3) {
      factors.push('Wide stakeholder impact (+10 points)');
    } else if (bill.stakeholders.length > 2) {
      factors.push('Moderate stakeholder impact (+7 points)');
    } else {
      factors.push('Limited stakeholder impact (+5 points)');
    }
    
    // AI confidence adjustment
    if (bill.aiConfidence > 90) {
      factors.push('High AI confidence (no adjustment)');
    } else if (bill.aiConfidence > 80) {
      factors.push('Good AI confidence (-2 points)');
    } else {
      factors.push('Moderate AI confidence (-5 points)');
    }
    
    return factors;
  };

  const getPublicInterestReasoning = (bill: BillAnalysis) => {
    const factors = [];
    
    // Bill category impact
    const billCategory = bill.title.split(' ')[0].toLowerCase();
    if (['housing', 'health', 'climate'].includes(billCategory)) {
      factors.push('High-priority policy area (+25 points)');
    } else if (['education', 'justice', 'transport'].includes(billCategory)) {
      factors.push('Medium-priority policy area (+15 points)');
    } else {
      factors.push('Standard policy area (+10 points)');
    }
    
    // Complexity engagement factor
    if (bill.complexity === 'high') {
      factors.push('Complex legislation drives public debate (+15 points)');
    } else if (bill.complexity === 'medium') {
      factors.push('Moderate complexity generates interest (+10 points)');
    } else {
      factors.push('Simple legislation has limited engagement (+5 points)');
    }
    
    // Stakeholder count factor
    if (bill.stakeholders.length > 3) {
      factors.push('Multiple stakeholders increase visibility (+10 points)');
    } else if (bill.stakeholders.length > 2) {
      factors.push('Several stakeholders create awareness (+7 points)');
    } else {
      factors.push('Few stakeholders limit public attention (+3 points)');
    }
    
    // Legislative stage visibility
    if (bill.stage === 'third_reading' || bill.stage === 'signed') {
      factors.push('Advanced stage gains media attention (+10 points)');
    } else if (bill.stage === 'second_reading') {
      factors.push('Active debate phase increases interest (+7 points)');
    } else if (bill.stage === 'committee') {
      factors.push('Committee stage has specialist focus (+5 points)');
    } else {
      factors.push('Early stage has limited public awareness (+2 points)');
    }
    
    // Impact potential
    if (bill.impactScore > 80) {
      factors.push('High potential impact draws public concern (+15 points)');
    } else if (bill.impactScore > 65) {
      factors.push('Moderate impact generates some interest (+10 points)');
    } else {
      factors.push('Lower impact receives limited attention (+5 points)');
    }
    
    return factors;
  };

  const getStakeholderDetails = (bill: BillAnalysis) => {
    return {
      primary: bill.stakeholders,
      additional: [
        'Parliamentary committees',
        'Legal experts',
        'Academic researchers',
        'Media representatives',
        'Citizen advocacy groups'
      ].slice(0, Math.floor(Math.random() * 3) + 2)
    };
  };

  const getRelatedBillsWithContext = (bill: BillAnalysis) => {
    return bill.relatedBills.map((relatedTitle, index) => ({
      title: relatedTitle,
      relationship: [
        'Complementary legislation',
        'Amendment to existing law',
        'Similar policy area',
        'Sequential implementation'
      ][index % 4],
      status: [
        'Currently in committee',
        'Awaiting second reading',
        'Recently signed into law',
        'Under review'
      ][index % 4],
      billId: `related_bill_${index + 1}`
    }));
  };

  const getRejectionReasoning = (bill: BillAnalysis) => {
    // Generate realistic rejection data based on bill characteristics
    const baseVotes = Math.floor(Math.random() * 20) + 140; // Total votes cast
    const supportVotes = Math.floor(baseVotes * 0.3) + Math.floor(Math.random() * 10); // 30-45% support
    const oppositionVotes = baseVotes - supportVotes;
    const abstentions = Math.floor(Math.random() * 8) + 2;
    
    const rejectionFactors = [];
    
    // Vote breakdown
    rejectionFactors.push(`Failed by ${oppositionVotes - supportVotes} votes (${supportVotes} for, ${oppositionVotes} against, ${abstentions} abstentions)`);
    
    // Primary opposition reasons based on bill type
    const billCategory = bill.title.split(' ')[0].toLowerCase();
    if (billCategory === 'housing') {
      rejectionFactors.push('Opposition cited inadequate funding mechanisms');
      rejectionFactors.push('Concerns about impact on property rights');
    } else if (billCategory === 'health') {
      rejectionFactors.push('Budget committee raised cost concerns');
      rejectionFactors.push('Medical associations opposed implementation timeline');
    } else if (billCategory === 'climate') {
      rejectionFactors.push('Industry groups lobbied against regulations');
      rejectionFactors.push('Rural TDs concerned about economic impact');
    } else if (billCategory === 'education') {
      rejectionFactors.push('Teacher unions disputed implementation requirements');
      rejectionFactors.push('Local authorities raised capacity concerns');
    } else {
      rejectionFactors.push('Cross-party opposition to proposed amendments');
      rejectionFactors.push('Constitutional concerns raised by legal experts');
    }
    
    // Complexity-based factors
    if (bill.complexity === 'high') {
      rejectionFactors.push('Legislative complexity led to confusion and opposition');
    } else if (bill.complexity === 'medium') {
      rejectionFactors.push('Insufficient time for proper committee review');
    }
    
    // Stakeholder opposition
    if (bill.stakeholders.length > 3) {
      rejectionFactors.push('Multiple stakeholder groups failed to reach consensus');
    } else {
      rejectionFactors.push('Key stakeholder withdrew support before final vote');
    }
    
    // Public interest factor
    if (bill.publicInterest < 50) {
      rejectionFactors.push('Limited public support influenced TD decisions');
    } else {
      rejectionFactors.push('Despite public interest, technical concerns prevailed');
    }
    
    return {
      voteBreakdown: {
        total: baseVotes,
        support: supportVotes,
        opposition: oppositionVotes,
        abstentions: abstentions,
        margin: oppositionVotes - supportVotes
      },
      primaryReasons: rejectionFactors.slice(1, 4), // Take main reasons (excluding vote count)
      rejectionStage: Math.random() > 0.7 ? 'Second Reading' : 'Third Reading',
      rejectionDate: '2024-03-' + (Math.floor(Math.random() * 28) + 1).toString().padStart(2, '0'),
      potentialRevision: Math.random() > 0.6 ? 'Bill may be reintroduced with amendments' : 'No immediate plans for revision'
    };
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'signed': return <CheckCircle className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredAndSortedBills = bills
    .filter(bill => {
      // Category filter (if categories are based on bill titles)
      if (selectedCategory !== 'all') {
        const billCategory = bill.title.split(' ')[0];
        if (!billCategory.toLowerCase().includes(selectedCategory.toLowerCase())) {
          return false;
        }
      }
      
      // Status filter
      if (selectedStatus !== 'all') {
        if (bill.stage !== selectedStatus) {
          return false;
        }
      }

      // Start date filter
      if (startDateFilter) {
        if (bill.startDate < startDateFilter) {
          return false;
        }
      }

      // Approved date filter
      if (approvedDateFilter) {
        if (!bill.approvedDate || bill.approvedDate < approvedDateFilter) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'impact': return b.impactScore - a.impactScore;
        case 'interest': return b.publicInterest - a.publicInterest;
        case 'timeline': return a.title.localeCompare(b.title);
        default: return 0;
      }
    });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
                Bill Analysis
              </h2>
              <p className="text-gray-600 mt-1">
                AI-powered analysis of parliamentary bills and legislation
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
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Bills</option>
              <option value="introduced">Introduced</option>
              <option value="committee">Committee</option>
              <option value="second_reading">Second Reading</option>
              <option value="third_reading">Third Reading</option>
              <option value="signed">Signed</option>
              <option value="rejected">Rejected</option>
            </select>
            
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              placeholder="Bill Start Date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              title="Filter by bill start date (from)"
            />
            
            <input
              type="date"
              value={approvedDateFilter}
              onChange={(e) => setApprovedDateFilter(e.target.value)}
              placeholder="Bill Approved Date"
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              title="Filter by bill approved date (from)"
            />
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="impact">Sort by Impact Score</option>
              <option value="interest">Sort by Public Interest</option>
              <option value="timeline">Sort by Timeline</option>
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-3 text-gray-600">Analyzing legislation...</span>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredAndSortedBills.map((bill, index) => (
                <div key={bill.billId} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="flex items-center justify-center w-10 h-10 bg-orange-600 text-white text-sm font-bold rounded-full">
                      {index + 1}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{bill.title}</h3>
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStageColor(bill.stage)}`}>
                                {getStageIcon(bill.stage)}
                                {bill.stage.replace('_', ' ').toUpperCase()}
                                {bill.stage === 'rejected' && (
                                  <button
                                    onMouseEnter={() => setShowRejectionTooltip(bill.billId)}
                                    onMouseLeave={() => setShowRejectionTooltip(null)}
                                    onClick={() => setShowRejectionTooltip(showRejectionTooltip === bill.billId ? null : bill.billId)}
                                    className="ml-1 text-red-600 hover:text-red-800 transition-colors"
                                    aria-label="Rejection details"
                                  >
                                    <HelpCircle className="w-3 h-3" />
                                  </button>
                                )}
                              </span>
                              
                              {bill.stage === 'rejected' && showRejectionTooltip === bill.billId && (
                                <div className="absolute left-0 top-full mt-2 w-96 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-20">
                                  <div className="font-semibold mb-2 text-red-300">Bill Rejection Details:</div>
                                  
                                  {/* Vote Breakdown */}
                                  <div className="mb-3 p-2 bg-red-900/30 rounded border-l-2 border-red-400">
                                    <div className="font-medium mb-1">Final Vote:</div>
                                    <div className="grid grid-cols-3 gap-2 text-center">
                                      <div>
                                        <div className="text-red-300 font-bold">{getRejectionReasoning(bill).voteBreakdown.support}</div>
                                        <div className="text-gray-400">For</div>
                                      </div>
                                      <div>
                                        <div className="text-red-400 font-bold">{getRejectionReasoning(bill).voteBreakdown.opposition}</div>
                                        <div className="text-gray-400">Against</div>
                                      </div>
                                      <div>
                                        <div className="text-gray-300 font-bold">{getRejectionReasoning(bill).voteBreakdown.abstentions}</div>
                                        <div className="text-gray-400">Abstained</div>
                                      </div>
                                    </div>
                                    <div className="mt-2 text-center">
                                      <span className="text-red-300">Failed by {getRejectionReasoning(bill).voteBreakdown.margin} votes</span>
                                    </div>
                                  </div>
                                  
                                  {/* Primary Reasons */}
                                  <div className="mb-3">
                                    <div className="font-medium mb-2">Key Opposition Factors:</div>
                                    <div className="space-y-1">
                                      {getRejectionReasoning(bill).primaryReasons.map((reason, idx) => (
                                        <div key={idx} className="flex items-start gap-1">
                                          <span className="text-red-400">•</span>
                                          <span>{reason}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  
                                  {/* Additional Details */}
                                  <div className="space-y-1 text-gray-300 border-t border-gray-700 pt-2">
                                    <div><strong>Rejection Stage:</strong> {getRejectionReasoning(bill).rejectionStage}</div>
                                    <div><strong>Date:</strong> {getRejectionReasoning(bill).rejectionDate}</div>
                                    <div><strong>Future Prospects:</strong> {getRejectionReasoning(bill).potentialRevision}</div>
                                  </div>
                                  
                                  {/* Tooltip arrow pointing up */}
                                  <div className="absolute bottom-full left-8 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                                </div>
                              )}
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getComplexityColor(bill.complexity)}`}>
                              {bill.complexity.toUpperCase()} COMPLEXITY
                            </span>
                            <span className="text-sm text-gray-600">
                              AI Confidence: {bill.aiConfidence}%
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center justify-end gap-2 mb-1">
                            <div className="text-xl font-bold text-orange-600">
                              {bill.impactScore}/100
                            </div>
                            <div className="relative">
                              <button
                                onMouseEnter={() => setShowImpactTooltip(bill.billId)}
                                onMouseLeave={() => setShowImpactTooltip(null)}
                                onClick={() => setShowImpactTooltip(showImpactTooltip === bill.billId ? null : bill.billId)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Impact score explanation"
                              >
                                <HelpCircle className="w-4 h-4" />
                              </button>
                              
                              {showImpactTooltip === bill.billId && (
                                <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-20">
                                  <div className="font-semibold mb-2">Impact Score Reasoning:</div>
                                  <div className="space-y-1">
                                    {getImpactScoreReasoning(bill).map((factor, idx) => (
                                      <div key={idx} className="flex items-start gap-1">
                                        <span className="text-orange-300">•</span>
                                        <span>{factor}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300">
                                    This AI model considers legislative complexity, public interest, stage progression, stakeholder impact, and confidence levels to calculate the overall impact score.
                                  </div>
                                  {/* Tooltip arrow pointing up */}
                                  <div className="absolute bottom-full right-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                                </div>
                              )}
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">Impact Score</p>
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">AI Summary:</h4>
                        <p className="text-gray-700 text-sm">{bill.summary}</p>
                      </div>

                      {/* Key Provisions */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Key Provisions:</h4>
                        <ul className="space-y-1">
                          {bill.keyProvisions.map((provision, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              {provision}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Potential Impacts */}
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Potential Impacts:</h4>
                        <div className="flex flex-wrap gap-2">
                          {bill.potentialImpacts.map((impact, i) => (
                            <span
                              key={i}
                              className="px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700 flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              {impact}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div className="text-center p-3 bg-white rounded-lg">
                          <TrendingUp className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-lg font-semibold text-gray-900">{bill.publicInterest}%</div>
                            <div className="relative">
                              <button
                                onMouseEnter={() => setShowPublicInterestTooltip(bill.billId)}
                                onMouseLeave={() => setShowPublicInterestTooltip(null)}
                                onClick={() => setShowPublicInterestTooltip(showPublicInterestTooltip === bill.billId ? null : bill.billId)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Public interest explanation"
                              >
                                <HelpCircle className="w-3 h-3" />
                              </button>
                              
                              {showPublicInterestTooltip === bill.billId && (
                                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
                                  <div className="font-semibold mb-2">Public Interest Calculation:</div>
                                  <div className="space-y-1">
                                    {getPublicInterestReasoning(bill).map((factor, idx) => (
                                      <div key={idx} className="flex items-start gap-1">
                                        <span className="text-blue-300">•</span>
                                        <span>{factor}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300">
                                    Public interest is calculated based on policy priority, complexity, stakeholder involvement, legislative stage, and potential impact.
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">Public Interest</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <Users className="w-5 h-5 text-green-600 mx-auto mb-1" />
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-lg font-semibold text-gray-900">{bill.stakeholders.length}</div>
                            <div className="relative">
                              <button
                                onMouseEnter={() => setShowStakeholdersTooltip(bill.billId)}
                                onMouseLeave={() => setShowStakeholdersTooltip(null)}
                                onClick={() => setShowStakeholdersTooltip(showStakeholdersTooltip === bill.billId ? null : bill.billId)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Stakeholders list"
                              >
                                <HelpCircle className="w-3 h-3" />
                              </button>
                              
                              {showStakeholdersTooltip === bill.billId && (
                                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
                                  <div className="font-semibold mb-2">Primary Stakeholders:</div>
                                  <div className="space-y-1 mb-3">
                                    {getStakeholderDetails(bill).primary.map((stakeholder, idx) => (
                                      <div key={idx} className="flex items-start gap-1">
                                        <span className="text-green-300">•</span>
                                        <span>{stakeholder}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="font-semibold mb-2">Additional Stakeholders:</div>
                                  <div className="space-y-1">
                                    {getStakeholderDetails(bill).additional.map((stakeholder, idx) => (
                                      <div key={idx} className="flex items-start gap-1">
                                        <span className="text-gray-400">•</span>
                                        <span className="text-gray-300">{stakeholder}</span>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300">
                                    These groups are actively involved in or affected by the legislation's development and implementation.
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">Stakeholders</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <FileText className="w-5 h-5 text-orange-600 mx-auto mb-1" />
                          <div className="flex items-center justify-center gap-2">
                            <div className="text-lg font-semibold text-gray-900">{bill.relatedBills.length}</div>
                            <div className="relative">
                              <button
                                onMouseEnter={() => setShowRelatedBillsTooltip(bill.billId)}
                                onMouseLeave={() => setShowRelatedBillsTooltip(null)}
                                onClick={() => setShowRelatedBillsTooltip(showRelatedBillsTooltip === bill.billId ? null : bill.billId)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                                aria-label="Related bills list"
                              >
                                <HelpCircle className="w-3 h-3" />
                              </button>
                              
                              {showRelatedBillsTooltip === bill.billId && (
                                <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-96 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-10">
                                  <div className="font-semibold mb-2">Related Bills:</div>
                                  <div className="space-y-3">
                                    {getRelatedBillsWithContext(bill).map((relatedBill, idx) => (
                                      <div key={idx} className="border-l-2 border-orange-400 pl-3">
                                        <button
                                          onClick={() => {
                                            // In a real app, this would navigate to the related bill
                                            console.log(`Navigate to bill: ${relatedBill.billId}`);
                                          }}
                                          className="text-orange-300 hover:text-orange-100 font-medium block mb-1 text-left hover:underline"
                                        >
                                          {relatedBill.title}
                                        </button>
                                        <div className="text-gray-300 mb-1">
                                          <strong>Relationship:</strong> {relatedBill.relationship}
                                        </div>
                                        <div className="text-gray-400">
                                          <strong>Status:</strong> {relatedBill.status}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                  <div className="mt-2 pt-2 border-t border-gray-700 text-gray-300">
                                    Click on bill titles to view detailed information. These bills share policy areas or implementation dependencies.
                                  </div>
                                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">Related Bills</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg">
                          <Calendar className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                          <div className="text-lg font-semibold text-gray-900">{calculateBillDuration(bill.startDate)}</div>
                          <div className="text-xs text-gray-600">Duration</div>
                        </div>
                      </div>

                      {/* Bill Dates and Committee Info */}
                      <div className="bg-white rounded-lg p-4 mt-4 border border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-3">Bill Timeline & Status</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Started:</span>
                            <span className="font-medium">{new Date(bill.startDate).toLocaleDateString()}</span>
                          </div>
                          {bill.firstReadingDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">First Reading:</span>
                              <span className="font-medium">{new Date(bill.firstReadingDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {bill.secondReadingDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Second Reading:</span>
                              <span className="font-medium">{new Date(bill.secondReadingDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {bill.thirdReadingDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Third Reading:</span>
                              <span className="font-medium">{new Date(bill.thirdReadingDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {bill.approvedDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Signed:</span>
                              <span className="font-medium text-green-600">{new Date(bill.approvedDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {bill.rejectedDate && (
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rejected:</span>
                              <span className="font-medium text-red-600">{new Date(bill.rejectedDate).toLocaleDateString()}</span>
                            </div>
                          )}
                          {bill.committeeDetails && (
                            <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                              <span className="text-gray-600">Committee:</span>
                              <div className="relative">
                                <button
                                  onMouseEnter={() => setShowCommitteeTooltip(bill.billId)}
                                  onMouseLeave={() => setShowCommitteeTooltip(null)}
                                  onClick={() => setShowCommitteeTooltip(showCommitteeTooltip === bill.billId ? null : bill.billId)}
                                  className="font-medium text-blue-600 hover:text-blue-800 underline flex items-center gap-1"
                                >
                                  {bill.committeeDetails.name.split(' ').slice(-1)[0]}
                                  <HelpCircle className="w-3 h-3" />
                                </button>
                                
                                {showCommitteeTooltip === bill.billId && (
                                  <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-20">
                                    <div className="font-semibold mb-2">{bill.committeeDetails.name}</div>
                                    <div className="mb-2">
                                      <strong className="text-blue-300">Chairperson:</strong> {bill.committeeDetails.chairperson}
                                    </div>
                                    <div className="font-semibold mb-2">Committee Members:</div>
                                    <div className="space-y-1">
                                      {bill.committeeDetails.members.map((member, idx) => (
                                        <div key={idx} className="flex items-start gap-1">
                                          <span className="text-blue-300">•</span>
                                          <span>{member}</span>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="absolute bottom-full right-6 w-0 h-0 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-b-gray-900"></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}