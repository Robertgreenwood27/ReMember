-- Memory Jogger Database Schema
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Entries table
CREATE TABLE IF NOT EXISTS entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  anchor TEXT NOT NULL,
  text TEXT NOT NULL,
  nouns TEXT[] NOT NULL DEFAULT '{}',
  is_private BOOLEAN DEFAULT FALSE,
  phase TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Nodes table (for anchor words)
CREATE TABLE IF NOT EXISTS nodes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  connections TEXT[] NOT NULL DEFAULT '{}',
  count INTEGER DEFAULT 1 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, word)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS entries_user_id_idx ON entries(user_id);
CREATE INDEX IF NOT EXISTS entries_anchor_idx ON entries(anchor);
CREATE INDEX IF NOT EXISTS entries_date_idx ON entries(date DESC);
CREATE INDEX IF NOT EXISTS nodes_user_id_idx ON nodes(user_id);
CREATE INDEX IF NOT EXISTS nodes_word_idx ON nodes(word);

-- Row Level Security (RLS)
ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE nodes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for entries
CREATE POLICY "Users can view their own entries"
  ON entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own entries"
  ON entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own entries"
  ON entries FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own entries"
  ON entries FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for nodes
CREATE POLICY "Users can view their own nodes"
  ON nodes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nodes"
  ON nodes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own nodes"
  ON nodes FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own nodes"
  ON nodes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_entries_updated_at
  BEFORE UPDATE ON entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nodes_updated_at
  BEFORE UPDATE ON nodes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Function to recalculate node connections
CREATE OR REPLACE FUNCTION recalculate_node_connections(p_user_id UUID, p_word TEXT)
RETURNS TEXT[] AS $$
DECLARE
  connections TEXT[];
BEGIN
  SELECT ARRAY_AGG(DISTINCT unnested_noun)
  INTO connections
  FROM (
    SELECT UNNEST(nouns) AS unnested_noun
    FROM entries
    WHERE user_id = p_user_id
      AND p_word = ANY(nouns)
      AND unnested_noun != p_word
  ) AS subquery;
  
  RETURN COALESCE(connections, '{}');
END;
$$ LANGUAGE plpgsql;