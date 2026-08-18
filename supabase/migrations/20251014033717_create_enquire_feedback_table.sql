/*
  # Create enquire feedback table

  1. New Tables
    - `enquire_feedback`
      - `id` (uuid, primary key) - Unique identifier for each feedback entry
      - `ai_response` (text) - The AI response that received feedback
      - `feedback_type` (text) - Type of feedback: 'up' or 'down'
      - `comment` (text, nullable) - Optional comment for negative feedback
      - `user_query` (text, nullable) - The original user query
      - `created_at` (timestamptz) - Timestamp of when feedback was given
      - `user_id` (uuid, nullable) - User ID if authenticated
      - `session_id` (text, nullable) - Session identifier for anonymous users

  2. Security
    - Enable RLS on `enquire_feedback` table
    - Add policy for authenticated users to create feedback
    - Add policy for service role to read all feedback (for analytics)
*/

CREATE TABLE IF NOT EXISTS enquire_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ai_response text NOT NULL,
  feedback_type text NOT NULL CHECK (feedback_type IN ('up', 'down')),
  comment text,
  user_query text,
  created_at timestamptz DEFAULT now(),
  user_id uuid,
  session_id text
);

ALTER TABLE enquire_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create feedback"
  ON enquire_feedback
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can view all feedback"
  ON enquire_feedback
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_enquire_feedback_created_at ON enquire_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enquire_feedback_type ON enquire_feedback(feedback_type);
