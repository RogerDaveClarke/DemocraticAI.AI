import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Official = {
  id: string;
  name: string;
  role: string;
  party: string;
  constituency: string;
  avatar_url: string;
  attendance_percentage: number;
  bills_count: number;
  questions_count: number;
  sentiment_score: number;
  sentiment_trend: string;
  created_at: string;
};

export type Debate = {
  id: string;
  title: string;
  chamber: string;
  date: string;
  participants_count: number;
  speakers_count: number;
  duration_minutes: number;
  status: string;
  created_at: string;
};

export type Bill = {
  id: string;
  title: string;
  date: string;
  ta_count: number;
  nil_count: number;
  abstentions_count: number;
  passed: boolean;
  created_at: string;
};

export type Vote = {
  id: string;
  bill_id: string;
  official_id: string;
  vote: string;
  created_at: string;
};

export type QuestionAnswer = {
  id: string;
  question: string;
  answer: string;
  official_id: string;
  category: string;
  sentiment: string;
  date: string;
  created_at: string;
};

export type AttendanceRecord = {
  id: string;
  session_title: string;
  session_type: string;
  official_id: string;
  status: string;
  date: string;
  duration_minutes: number;
  late_minutes: number;
  absence_reason: string | null;
  created_at: string;
};
