import { API_URL } from '@/config/runtime';
// Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || API_URL;

export interface Vote {
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

export interface VoteStatistics {
  totalVotes: number;
  passed: number;
  failed: number;
  averageTurnout: number;
  monthlyBreakdown: Array<{
    month: string;
    passed: number;
    failed: number;
    total: number;
  }>;
}

export interface MemberVoteRecord {
  id: string;
  date: string;
  voteTitle: string;
  billTitle?: string;
  voteType: 'division' | 'voice' | 'committee';
  memberVote: 'yes' | 'no' | 'abstain' | 'absent';
  result: 'passed' | 'failed';
  yesCount: number;
  noCount: number;
  abstainCount: number;
  description: string;
  topics: string[];
  chamber: string;
  stage: string;
}

class VotingDataService {
  private readonly requestTimeoutMs = 10000;

  private async fetchWithTimeout(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), this.requestTimeoutMs);

    try {
      return await fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch all votes from the database
   */
  async getAllVotes(): Promise<Vote[]> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/votes`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.votes || [];
    } catch (error) {
      console.error('Error fetching votes:', error);
      return [];
    }
  }

  /**
   * Fetch recent votes (configurable limit, defaults to all recent votes)
   */
  async getRecentVotes(limit?: number): Promise<Vote[]> {
    try {
      const limitParam = limit ? `?limit=${limit}` : '';
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/votes/recent${limitParam}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.votes || [];
    } catch (error) {
      console.error('Error fetching recent votes:', error);
      return [];
    }
  }

  /**
   * Get voting statistics including monthly breakdown
   */
  async getVotingStatistics(): Promise<VoteStatistics> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/votes/statistics`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.statistics || {
        totalVotes: 0,
        passed: 0,
        failed: 0,
        averageTurnout: 0,
        monthlyBreakdown: []
      };
    } catch (error) {
      console.error('Error calculating voting statistics:', error);
      return {
        totalVotes: 0,
        passed: 0,
        failed: 0,
        averageTurnout: 0,
        monthlyBreakdown: []
      };
    }
  }

  /**
   * Get voting records for a specific member
   */
  async getMemberVotingRecords(memberCode: string): Promise<MemberVoteRecord[]> {
    try {
      const response = await this.fetchWithTimeout(`${API_BASE_URL}/api/votes/member/${encodeURIComponent(memberCode)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data.memberVotes || [];
    } catch (error) {
      console.error('Error fetching member voting records:', error);
      return [];
    }
  }
}

export const votingDataService = new VotingDataService();