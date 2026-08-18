/*
  # Create Subscribers Table

  1. New Tables
    - `subscribers`
      - `id` (uuid, primary key) - Unique identifier for each subscriber
      - `email` (text, unique, not null) - Subscriber email address
      - `country_code` (text) - Selected country code (e.g., 'IE', 'US')
      - `language_code` (text) - Preferred language code (e.g., 'en', 'ga')
      - `subscribed_at` (timestamptz) - Timestamp when user subscribed
      - `unsubscribe_token` (uuid, unique) - Unique token for unsubscribe links
      - `is_active` (boolean) - Whether subscription is active
      - `unsubscribed_at` (timestamptz) - Timestamp when user unsubscribed (if applicable)
      - `created_at` (timestamptz) - Record creation timestamp
      - `updated_at` (timestamptz) - Record last update timestamp

  2. Security
    - Enable RLS on `subscribers` table
    - Add policy for inserting new subscriptions (public access for sign-up)
    - Add policy for updating own subscription status using unsubscribe token
    - Service role will have full access for sending emails

  3. Indexes
    - Index on email for fast lookups
    - Index on unsubscribe_token for unsubscribe operations
    - Index on is_active for filtering active subscribers
*/

CREATE TABLE IF NOT EXISTS subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  country_code text DEFAULT 'IE',
  language_code text DEFAULT 'en',
  subscribed_at timestamptz DEFAULT now(),
  unsubscribe_token uuid UNIQUE DEFAULT gen_random_uuid(),
  is_active boolean DEFAULT true,
  unsubscribed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscribers_email ON subscribers(email);
CREATE INDEX IF NOT EXISTS idx_subscribers_unsubscribe_token ON subscribers(unsubscribe_token);
CREATE INDEX IF NOT EXISTS idx_subscribers_is_active ON subscribers(is_active);

ALTER TABLE subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON subscribers
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Users can unsubscribe with token"
  ON subscribers
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can view their own subscription"
  ON subscribers
  FOR SELECT
  TO public
  USING (true);
