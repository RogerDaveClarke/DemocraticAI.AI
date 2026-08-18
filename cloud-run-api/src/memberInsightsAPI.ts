import express from 'express';
import NodeCache from 'node-cache';

const router = express.Router();
const cache = new NodeCache({ stdTTL: 86400 }); // 24 hours cache

interface MemberInsight {
  id: string;
  name: string;
  party: string;
  constituency: string;
  chamber: 'Dáil' | 'Seanad';
  activityScore: number;
  speeches: number;
  questions: number;
  votingAttendance: number;
  keyTopics: string[];
  recentActivity: {
    date: string;
    type: 'speech' | 'question' | 'vote';
    topic: string;
    summary: string;
  }[];
  trending: 'up' | 'down' | 'stable';
  profileImage?: string;
}

interface MemberInsightsData {
  members: MemberInsight[];
  summary: {
    totalMembers: number;
    avgActivityScore: number;
    mostActiveParty: string;
    topPerformers: string[];
  };
  filters: {
    parties: string[];
    constituencies: string[];
    chambers: string[];
  };
}

const generateMockMemberInsights = (): MemberInsightsData => {
  const parties = ['Fianna Fáil', 'Fine Gael', 'Sinn Féin', 'Labour Party', 'Green Party', 'Social Democrats', 'People Before Profit', 'Independent'];
  const constituencies = ['Dublin Central', 'Cork North-Central', 'Galway West', 'Kerry', 'Limerick City', 'Waterford', 'Donegal', 'Mayo'];
  const chambers: ('Dáil' | 'Seanad')[] = ['Dáil', 'Seanad'];
  
  const topicPool = [
    'Housing Crisis', 'Healthcare Reform', 'Climate Action', 'Economic Recovery', 
    'Education Funding', 'Rural Development', 'Transport Infrastructure', 'Social Welfare',
    'Immigration Policy', 'Digital Innovation', 'Agriculture Support', 'Tourism Recovery'
  ];

  const members: MemberInsight[] = [];
  
  for (let i = 0; i < 50; i++) {
    const party = parties[Math.floor(Math.random() * parties.length)];
    const constituency = constituencies[Math.floor(Math.random() * constituencies.length)];
    const chamber = chambers[Math.floor(Math.random() * chambers.length)];
    const activityScore = Math.floor(Math.random() * 40) + 60; // 60-100
    
    const keyTopics = topicPool
      .sort(() => 0.5 - Math.random())
      .slice(0, Math.floor(Math.random() * 3) + 2);
    
    const recentActivity = [
      {
        date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'speech' as const,
        topic: keyTopics[0],
        summary: `Delivered comprehensive speech on ${keyTopics[0]} highlighting key concerns and proposed solutions.`
      },
      {
        date: new Date(Date.now() - Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'question' as const,
        topic: keyTopics[1] || 'Parliamentary Procedure',
        summary: `Asked critical questions about implementation timeline and budget allocation.`
      },
      {
        date: new Date(Date.now() - Math.random() * 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        type: 'vote' as const,
        topic: 'Budget 2024',
        summary: `Participated in key vote on budget amendments affecting social welfare provisions.`
      }
    ].slice(0, Math.floor(Math.random() * 2) + 2);
    
    members.push({
      id: `member_${i + 1}`,
      name: `${['Michael', 'Sarah', 'John', 'Mary', 'David', 'Emma', 'James', 'Claire', 'Patrick', 'Aoife'][i % 10]} ${['O\'Brien', 'Murphy', 'Kelly', 'Walsh', 'Ryan', 'Byrne', 'Connor', 'McCarthy', 'Flanagan', 'Sullivan'][Math.floor(i / 10) % 10]}`,
      party,
      constituency,
      chamber,
      activityScore,
      speeches: Math.floor(Math.random() * 50) + 10,
      questions: Math.floor(Math.random() * 30) + 5,
      votingAttendance: Math.floor(Math.random() * 20) + 75, // 75-95%
      keyTopics,
      recentActivity,
      trending: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as 'up' | 'down' | 'stable'
    });
  }
  
  // Sort by activity score
  members.sort((a, b) => b.activityScore - a.activityScore);
  
  const avgActivityScore = Math.round(members.reduce((sum, m) => sum + m.activityScore, 0) / members.length);
  
  // Find most active party
  const partyActivity = parties.reduce((acc, party) => {
    const partyMembers = members.filter(m => m.party === party);
    const avgScore = partyMembers.reduce((sum, m) => sum + m.activityScore, 0) / partyMembers.length || 0;
    acc[party] = avgScore;
    return acc;
  }, {} as Record<string, number>);
  
  const mostActiveParty = Object.entries(partyActivity).sort(([,a], [,b]) => b - a)[0][0];
  const topPerformers = members.slice(0, 5).map(m => m.name);
  
  return {
    members,
    summary: {
      totalMembers: members.length,
      avgActivityScore,
      mostActiveParty,
      topPerformers
    },
    filters: {
      parties: [...new Set(parties)],
      constituencies: [...new Set(constituencies)],
      chambers: [...new Set(chambers)]
    }
  };
};

// GET /api/member-insights
router.get('/', (req, res) => {
  try {
    const cacheKey = 'member_insights_data';
    
    let memberData = cache.get<MemberInsightsData>(cacheKey);
    
    if (!memberData) {
      memberData = generateMockMemberInsights();
      cache.set(cacheKey, memberData);
    }
    
    // Apply filters if provided
    let filteredMembers = memberData.members;
    
    if (req.query.party) {
      filteredMembers = filteredMembers.filter(m => m.party === req.query.party);
    }
    
    if (req.query.chamber) {
      filteredMembers = filteredMembers.filter(m => m.chamber === req.query.chamber);
    }
    
    if (req.query.search) {
      const searchTerm = (req.query.search as string).toLowerCase();
      filteredMembers = filteredMembers.filter(m => 
        m.name.toLowerCase().includes(searchTerm) ||
        m.constituency.toLowerCase().includes(searchTerm) ||
        m.keyTopics.some(topic => topic.toLowerCase().includes(searchTerm))
      );
    }
    
    // Apply sorting
    const sortBy = req.query.sortBy as string || 'activityScore';
    const sortOrder = req.query.sortOrder as string || 'desc';
    
    filteredMembers.sort((a, b) => {
      let aVal: any = a[sortBy as keyof MemberInsight];
      let bVal: any = b[sortBy as keyof MemberInsight];
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }
      
      if (sortOrder === 'desc') {
        return bVal > aVal ? 1 : -1;
      } else {
        return aVal > bVal ? 1 : -1;
      }
    });
    
    res.json({
      success: true,
      data: {
        ...memberData,
        members: filteredMembers
      },
      cached: !!cache.get(cacheKey),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching member insights:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member insights data'
    });
  }
});

// GET /api/member-insights/:id
router.get('/:id', (req, res) => {
  try {
    const memberId = req.params.id;
    const cacheKey = 'member_insights_data';
    
    let memberData = cache.get<MemberInsightsData>(cacheKey);
    
    if (!memberData) {
      memberData = generateMockMemberInsights();
      cache.set(cacheKey, memberData);
    }
    
    const member = memberData.members.find(m => m.id === memberId);
    
    if (!member) {
      res.status(404).json({
        success: false,
        error: 'Member not found'
      });
      return;
    }
    
    res.json({
      success: true,
      data: member,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching member details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member details'
    });
  }
});

export default router;