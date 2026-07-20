-- ============================================================
-- Migration: Create leads table
-- Description: Stores qualified travel leads from the AI assistant
-- ============================================================

-- Create the leads table
CREATE TABLE IF NOT EXISTS leads (
  -- Primary key
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Conversation reference (unique to prevent duplicates)
  conversation_id TEXT UNIQUE NOT NULL,

  -- Travel details
  destination TEXT,
  departure_city TEXT,
  travel_date TEXT,
  travellers INTEGER,
  budget TEXT,
  duration TEXT,
  trip_type TEXT,
  special_requirements TEXT,

  -- Contact information
  customer_name TEXT,
  phone TEXT,
  email TEXT,

  -- Lead scoring
  lead_score INTEGER DEFAULT 0,
  confidence TEXT DEFAULT 'Low',
  qualification_status TEXT DEFAULT 'Exploring',

  -- AI-generated summary
  summary TEXT,

  -- Metadata
  buying_intent TEXT DEFAULT 'low',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- Indexes for common queries
-- ============================================================

-- Prevent duplicate conversation inserts (enforced by UNIQUE above, but add index for performance)
CREATE INDEX IF NOT EXISTS idx_leads_conversation_id ON leads(conversation_id);

-- Query by lead score (for sales team to find hot leads)
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC);

-- Query by qualification status
CREATE INDEX IF NOT EXISTS idx_leads_qualification_status ON leads(qualification_status);

-- Query by creation date (for reporting)
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Query by email (for deduplication by contact)
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email) WHERE email IS NOT NULL;

-- ============================================================
-- Trigger: Auto-update updated_at timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leads_updated_at ON leads;

CREATE TRIGGER trigger_update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (backend only)
CREATE POLICY "Service role full access"
  ON leads
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Anon role can read (for public-facing features if needed)
CREATE POLICY "Anon can read leads"
  ON leads
  FOR SELECT
  TO anon
  USING (false); -- Disabled by default, enable if needed

-- Authenticated users can read their own leads (if user auth is added later)
-- CREATE POLICY "Users can read own leads"
--   ON leads
--   FOR SELECT
--   TO authenticated
--   USING (auth.uid() = user_id);

-- ============================================================
-- Comments for documentation
-- ============================================================

COMMENT ON TABLE leads IS 'Stores qualified travel leads collected by the AI assistant';
COMMENT ON COLUMN leads.conversation_id IS 'Unique conversation ID to prevent duplicate inserts';
COMMENT ON COLUMN leads.lead_score IS 'Deterministic score 0-100 based on collected fields';
COMMENT ON COLUMN leads.qualification_status IS 'Exploring | In Progress | Qualified';
COMMENT ON COLUMN leads.buying_intent IS 'AI-detected buying intent: low | medium | high';