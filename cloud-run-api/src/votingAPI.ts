import express from 'express';
import { Firestore } from '@google-cloud/firestore';

const router = express.Router();
const db = new Firestore();

// Vote interface
interface Vote {
  voteId: string;
  date: string;
  outcome: string;
  subject: {
    showAs: string;
  };
  house: {
    showAs: string;
    houseCode: string;
  };
  tallies: {
    taVotes: { tally: number; showAs: string };
    nilVotes: { tally: number; showAs: string };
    staonVotes: { tally: number; showAs: string };
  };
  memberVotes: Array<{
    memberCode: string;
    showAs: string;
    voteType: 'taVotes' | 'nilVotes' | 'staonVotes';
  }>;
  isBill?: boolean;
  category?: string;
  debate?: any;
  memberVoteCount: number;
}

// Helper function to convert Firestore document to Vote
function documentToVote(doc: any): Vote {
  const data = doc.data();
  return {
    voteId: data.voteId,
    date: data.date,
    outcome: data.outcome,
    subject: data.subject || { showAs: 'Unknown Subject' },
    house: data.house || { showAs: 'Unknown House', houseCode: 'unknown' },
    tallies: data.tallies || {
      taVotes: { tally: 0, showAs: 'Tá' },
      nilVotes: { tally: 0, showAs: 'Níl' },
      staonVotes: { tally: 0, showAs: 'Staon' }
    },
    memberVotes: data.memberVotes || [],
    isBill: data.isBill || false,
    category: data.category,
    debate: data.debate,
    memberVoteCount: data.memberVoteCount || 0
  };
}

// Helper function to extract topics from vote subject
function extractTopicsFromSubject(subject: string): string[] {
  const topics: string[] = [];
  const subjectLower = subject.toLowerCase();
  
  const topicKeywords = {
    'Budget': ['budget', 'expenditure', 'funding', 'allocation'],
    'Housing': ['housing', 'accommodation', 'rental', 'property'],
    'Healthcare': ['health', 'medical', 'hospital', 'care'],
    'Education': ['education', 'school', 'university', 'student'],
    'Environment': ['environment', 'climate', 'green', 'energy'],
    'Transport': ['transport', 'traffic', 'road', 'rail'],
    'Employment': ['employment', 'job', 'work', 'labour'],
    'Taxation': ['tax', 'revenue', 'income', 'vat'],
    'Business': ['business', 'enterprise', 'commerce', 'trade'],
    'Order of Business': ['order', 'arrangements', 'business', 'motion'],
    'Amendment': ['amendment', 'amend', 'modify', 'change']
  };
  
  for (const [topic, keywords] of Object.entries(topicKeywords)) {
    if (keywords.some(keyword => subjectLower.includes(keyword))) {
      topics.push(topic);
    }
  }
  
  return topics.length > 0 ? topics : ['Parliamentary Business'];
}

// GET /api/votes - Get all votes
router.get('/', async (_req, res) => {
  try {
    const votesRef = db.collection('votes');
    const snapshot = await votesRef.orderBy('date', 'desc').get();
    
    const votes: Vote[] = [];
    snapshot.forEach((doc) => {
      votes.push(documentToVote(doc));
    });
    
    res.json({
      success: true,
      votes,
      count: votes.length
    });
  } catch (error) {
    console.error('Error fetching votes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch votes'
    });
  }
});

// GET /api/votes/recent - Get recent votes
router.get('/recent', async (req, res) => {
  try {
    // Allow configurable limit, but default to getting all recent votes (no artificial limit)
    const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
    const votesRef = db.collection('votes');
    
    // Apply limit only if explicitly requested, otherwise get all recent votes
    const query = limit ? votesRef.orderBy('date', 'desc').limit(limit) : votesRef.orderBy('date', 'desc');
    const snapshot = await query.get();
    
    const votes: Vote[] = [];
    snapshot.forEach((doc) => {
      votes.push(documentToVote(doc));
    });
    
    res.json({
      success: true,
      votes,
      count: votes.length
    });
  } catch (error) {
    console.error('Error fetching recent votes:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent votes'
    });
  }
});

// GET /api/votes/statistics - Get voting statistics
router.get('/statistics', async (_req, res) => {
  try {
    const votesRef = db.collection('votes');
    const snapshot = await votesRef.orderBy('date', 'desc').get();
    
    const votes: Vote[] = [];
    snapshot.forEach((doc) => {
      votes.push(documentToVote(doc));
    });
    
    const passed = votes.filter(vote => vote.outcome === 'Carried').length;
    const failed = votes.filter(vote => vote.outcome !== 'Carried').length;
    const totalTurnout = votes.reduce((sum, vote) => sum + vote.memberVoteCount, 0);
    const averageTurnout = votes.length > 0 ? Math.round(totalTurnout / votes.length) : 0;
    
    // Create monthly breakdown
    const monthlyData = new Map<string, { passed: number; failed: number; total: number }>();
    
    votes.forEach(vote => {
      const date = new Date(vote.date);
      const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { passed: 0, failed: 0, total: 0 });
      }
      
      const monthData = monthlyData.get(monthKey)!;
      if (vote.outcome === 'Carried') {
        monthData.passed++;
      } else {
        monthData.failed++;
      }
      monthData.total++;
    });
    
    const monthlyBreakdown = Array.from(monthlyData.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
      // Show all months, not just last 6
    
    res.json({
      success: true,
      statistics: {
        totalVotes: votes.length,
        passed,
        failed,
        averageTurnout,
        monthlyBreakdown
      }
    });
  } catch (error) {
    console.error('Error calculating voting statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate voting statistics'
    });
  }
});

// GET /api/votes/member/:memberCode - Get voting records for a specific member
router.get('/member/:memberCode', async (req, res) => {
  try {
    const { memberCode } = req.params;
    const votesRef = db.collection('votes');
    const snapshot = await votesRef.orderBy('date', 'desc').get();
    
    const votes: Vote[] = [];
    snapshot.forEach((doc) => {
      votes.push(documentToVote(doc));
    });
    
    const memberVoteRecords: any[] = [];
    
    votes.forEach(vote => {
      // Find this member's vote in the memberVotes array
      const memberVote = vote.memberVotes.find(mv => mv.memberCode === memberCode);
      
      if (memberVote) {
        // Convert vote type to readable format
        let memberVoteType: 'yes' | 'no' | 'abstain' | 'absent';
        switch (memberVote.voteType) {
          case 'taVotes':
            memberVoteType = 'yes';
            break;
          case 'nilVotes':
            memberVoteType = 'no';
            break;
          case 'staonVotes':
            memberVoteType = 'abstain';
            break;
          default:
            memberVoteType = 'absent';
        }
        
        // Extract topics from subject
        const topics = extractTopicsFromSubject(vote.subject.showAs);
        
        memberVoteRecords.push({
          id: vote.voteId,
          date: vote.date,
          voteTitle: vote.subject.showAs.substring(0, 100) + (vote.subject.showAs.length > 100 ? '...' : ''),
          billTitle: vote.debate?.billTitle || 'Parliamentary Business',
          voteType: 'division', // Most votes in Irish parliament are divisions
          memberVote: memberVoteType,
          result: vote.outcome === 'Carried' ? 'passed' : 'failed',
          yesCount: vote.tallies.taVotes.tally,
          noCount: vote.tallies.nilVotes.tally,
          abstainCount: vote.tallies.staonVotes.tally,
          description: vote.subject.showAs,
          topics,
          chamber: vote.house.showAs,
          stage: vote.category || 'Division'
        });
      }
    });
    
    // Sort by date descending
    memberVoteRecords.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    res.json({
      success: true,
      memberVotes: memberVoteRecords,
      count: memberVoteRecords.length,
      memberCode
    });
  } catch (error) {
    console.error('Error fetching member voting records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch member voting records'
    });
  }
});

export default router;