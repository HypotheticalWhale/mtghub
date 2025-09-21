-- MTG Database Schema for Scryfall-style search and Draft simulator

-- Drop existing tables if they exist
DROP TABLE IF EXISTS mtg_draft_picks CASCADE;
DROP TABLE IF EXISTS mtg_draft_sessions CASCADE;
DROP TABLE IF EXISTS mtg_cards CASCADE;
DROP TABLE IF EXISTS mtg_sets CASCADE;

-- Create mtg_sets table
CREATE TABLE mtg_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    release_date DATE,
    type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mtg_cards table
CREATE TABLE mtg_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id UUID REFERENCES mtg_sets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    mana_cost VARCHAR(100),
    cmc INTEGER DEFAULT 0,
    type_line VARCHAR(255) NOT NULL,
    oracle_text TEXT,
    power VARCHAR(10),
    toughness VARCHAR(10),
    colors TEXT[] DEFAULT '{}',
    color_identity TEXT[] DEFAULT '{}',
    rarity VARCHAR(20),
    image_url TEXT,
    multiverse_id INTEGER,
    scryfall_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mtg_draft_sessions table
CREATE TABLE mtg_draft_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    set_code VARCHAR(10) REFERENCES mtg_sets(code),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
    current_pack INTEGER DEFAULT 1,
    current_pick INTEGER DEFAULT 1,
    total_packs INTEGER DEFAULT 3,
    picks_per_pack INTEGER DEFAULT 15,
    user_picks JSONB DEFAULT '[]',
    ai_players JSONB DEFAULT '{"player1": [], "player2": [], "player3": [], "player4": [], "player5": [], "player6": [], "player7": []}',
    total_picks INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mtg_draft_picks table
CREATE TABLE mtg_draft_picks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES mtg_draft_sessions(id) ON DELETE CASCADE,
    pack_number INTEGER NOT NULL,
    pick_number INTEGER NOT NULL,
    card_id UUID REFERENCES mtg_cards(id) ON DELETE CASCADE,
    is_ai_pick BOOLEAN DEFAULT FALSE,
    ai_reasoning TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_mtg_cards_name ON mtg_cards(name);
CREATE INDEX idx_mtg_cards_type_line ON mtg_cards(type_line);
CREATE INDEX idx_mtg_cards_colors ON mtg_cards USING GIN(colors);
CREATE INDEX idx_mtg_cards_color_identity ON mtg_cards USING GIN(color_identity);
CREATE INDEX idx_mtg_cards_set_id ON mtg_cards(set_id);
CREATE INDEX idx_mtg_cards_cmc ON mtg_cards(cmc);
CREATE INDEX idx_mtg_cards_rarity ON mtg_cards(rarity);
CREATE INDEX idx_mtg_cards_scryfall_id ON mtg_cards(scryfall_id);

CREATE INDEX idx_mtg_draft_sessions_user_id ON mtg_draft_sessions(user_id);
CREATE INDEX idx_mtg_draft_sessions_status ON mtg_draft_sessions(status);
CREATE INDEX idx_mtg_draft_picks_session_id ON mtg_draft_picks(session_id);
CREATE INDEX idx_mtg_draft_picks_pack_pick ON mtg_draft_picks(pack_number, pick_number);

-- Create full-text search index for card names and text
CREATE INDEX idx_mtg_cards_search ON mtg_cards USING GIN(
    to_tsvector('english', name || ' ' || COALESCE(oracle_text, '') || ' ' || type_line)
);

-- Enable Row Level Security
ALTER TABLE mtg_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtg_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtg_draft_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mtg_draft_picks ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow all users to read sets" ON mtg_sets FOR SELECT USING (true);
CREATE POLICY "Allow all users to read cards" ON mtg_cards FOR SELECT USING (true);

CREATE POLICY "Users can manage their own draft sessions" ON mtg_draft_sessions
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage picks in their draft sessions" ON mtg_draft_picks
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM mtg_draft_sessions 
            WHERE id = mtg_draft_picks.session_id 
            AND user_id = auth.uid()
        )
    );

-- Create functions for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_mtg_sets_updated_at BEFORE UPDATE ON mtg_sets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mtg_cards_updated_at BEFORE UPDATE ON mtg_cards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_mtg_draft_sessions_updated_at BEFORE UPDATE ON mtg_draft_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
