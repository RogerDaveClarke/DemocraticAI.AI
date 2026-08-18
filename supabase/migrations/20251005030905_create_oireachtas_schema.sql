/*
  # Oireachtas Transparency Platform - Database Schema

  1. New Tables
    - `officials`
      - `id` (uuid, primary key)
      - `name` (text) - Official's full name
      - `role` (text) - TD or Senator
      - `party` (text) - Political party affiliation
      - `constituency` (text) - Electoral constituency
      - `avatar_url` (text) - Profile image URL
      - `attendance_percentage` (numeric) - Attendance rate
      - `bills_count` (integer) - Number of bills sponsored
      - `questions_count` (integer) - Questions asked
      - `sentiment_score` (numeric) - Approval rating
      - `sentiment_trend` (text) - up/down/stable
      - `created_at` (timestamp)

    - `debates`
      - `id` (uuid, primary key)
      - `title` (text) - Debate title
      - `chamber` (text) - Dáil Éireann or Seanad Éireann
      - `date` (timestamp) - Debate date and time
      - `participants_count` (integer) - Number of participants
      - `speakers_count` (integer) - Number of speakers
      - `duration_minutes` (integer) - Duration in minutes
      - `status` (text) - Completed/In Progress/Scheduled
      - `created_at` (timestamp)

    - `bills`
      - `id` (uuid, primary key)
      - `title` (text) - Bill title
      - `date` (timestamp) - Vote date
      - `ta_count` (integer) - Yes votes
      - `nil_count` (integer) - No votes
      - `abstentions_count` (integer) - Abstentions
      - `passed` (boolean) - Vote result
      - `created_at` (timestamp)

    - `votes`
      - `id` (uuid, primary key)
      - `bill_id` (uuid, foreign key) - References bills
      - `official_id` (uuid, foreign key) - References officials
      - `vote` (text) - Tá/Níl/Abstention
      - `created_at` (timestamp)

    - `questions_answers`
      - `id` (uuid, primary key)
      - `question` (text) - Question text
      - `answer` (text) - Response text
      - `official_id` (uuid, foreign key) - Who answered
      - `category` (text) - Housing/Environment/Healthcare/etc
      - `sentiment` (text) - positive/neutral/negative
      - `date` (timestamp)
      - `created_at` (timestamp)

    - `attendance_records`
      - `id` (uuid, primary key)
      - `session_title` (text) - Session name
      - `session_type` (text) - Session type
      - `official_id` (uuid, foreign key) - References officials
      - `status` (text) - Present/Absent/Late
      - `date` (timestamp)
      - `duration_minutes` (integer) - Session duration
      - `late_minutes` (integer) - Minutes late (if applicable)
      - `absence_reason` (text) - Reason if absent
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for public read access (transparency platform)
*/

-- Create officials table
CREATE TABLE IF NOT EXISTS officials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  party text NOT NULL,
  constituency text NOT NULL,
  avatar_url text NOT NULL,
  attendance_percentage numeric DEFAULT 0,
  bills_count integer DEFAULT 0,
  questions_count integer DEFAULT 0,
  sentiment_score numeric DEFAULT 0,
  sentiment_trend text DEFAULT 'stable',
  created_at timestamptz DEFAULT now()
);

-- Create debates table
CREATE TABLE IF NOT EXISTS debates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  chamber text NOT NULL,
  date timestamptz NOT NULL,
  participants_count integer DEFAULT 0,
  speakers_count integer DEFAULT 0,
  duration_minutes integer DEFAULT 0,
  status text DEFAULT 'Scheduled',
  created_at timestamptz DEFAULT now()
);

-- Create bills table
CREATE TABLE IF NOT EXISTS bills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  date timestamptz NOT NULL,
  ta_count integer DEFAULT 0,
  nil_count integer DEFAULT 0,
  abstentions_count integer DEFAULT 0,
  passed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id uuid REFERENCES bills(id) ON DELETE CASCADE,
  official_id uuid REFERENCES officials(id) ON DELETE CASCADE,
  vote text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create questions_answers table
CREATE TABLE IF NOT EXISTS questions_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  official_id uuid REFERENCES officials(id) ON DELETE CASCADE,
  category text NOT NULL,
  sentiment text DEFAULT 'neutral',
  date timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_title text NOT NULL,
  session_type text NOT NULL,
  official_id uuid REFERENCES officials(id) ON DELETE CASCADE,
  status text NOT NULL,
  date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 0,
  late_minutes integer DEFAULT 0,
  absence_reason text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE officials ENABLE ROW LEVEL SECURITY;
ALTER TABLE debates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (transparency platform)
CREATE POLICY "Public read access for officials"
  ON officials FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access for debates"
  ON debates FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access for bills"
  ON bills FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access for votes"
  ON votes FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access for questions_answers"
  ON questions_answers FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Public read access for attendance_records"
  ON attendance_records FOR SELECT
  TO anon
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_votes_bill_id ON votes(bill_id);
CREATE INDEX IF NOT EXISTS idx_votes_official_id ON votes(official_id);
CREATE INDEX IF NOT EXISTS idx_questions_answers_official_id ON questions_answers(official_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_official_id ON attendance_records(official_id);
CREATE INDEX IF NOT EXISTS idx_officials_party ON officials(party);