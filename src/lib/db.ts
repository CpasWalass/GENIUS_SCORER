import { Pool } from 'pg';

export type Match = {
  id: string;
  title: string;
  team_a_name: string;
  team_b_name: string;
  score_a_total: number;
  score_b_total: number;
  status: 'pending' | 'live' | 'finished';
  created_at: string;
};

export type Rubrique = {
  id: string;
  match_id: string;
  name: string;
  score_a: number;
  score_b: number;
  timer_seconds: number;
  is_running: boolean;
  points_per_click: number;
  order_index: number;
};

// Use Pool for better performance and compatibility with DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Helper for SQL queries
async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}

// Simple in-memory mock for local dev if Postgres is not connected
let mockMatch: (Match & { rubriques: Rubrique[] }) | null = null;

export async function getMatch(id: string) {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    if (mockMatch && mockMatch.id === id) return mockMatch;
    return null;
  }
  
  const { rows } = await query('SELECT * FROM matches WHERE id = $1', [id]);
  if (rows.length === 0) return null;
  
  const { rows: rubriques } = await query('SELECT * FROM rubriques WHERE match_id = $1 ORDER BY order_index ASC', [id]);
  return { ...rows[0], rubriques };
}

export async function createMatch(data: any) {
  const id = crypto.randomUUID();
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    mockMatch = {
      id,
      ...data,
      score_a_total: 0,
      score_b_total: 0,
      status: 'pending',
      created_at: new Date().toISOString(),
      rubriques: data.rubriques.map((r: any, i: number) => ({
        id: crypto.randomUUID(),
        match_id: id,
        ...r,
        score_a: 0,
        score_b: 0,
        order_index: i
      }))
    };
    return mockMatch;
  }

  // Ensure tables exist (one-time check or migration would be better, but doing it here for simplicity)
  await query(`
    CREATE TABLE IF NOT EXISTS matches (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      title TEXT NOT NULL,
      team_a_name TEXT NOT NULL,
      team_b_name TEXT NOT NULL,
      score_a_total INTEGER DEFAULT 0,
      score_b_total INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS rubriques (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      score_a INTEGER DEFAULT 0,
      score_b INTEGER DEFAULT 0,
      timer_seconds INTEGER DEFAULT 300,
      is_running BOOLEAN DEFAULT FALSE,
      points_per_click INTEGER DEFAULT 1,
      order_index INTEGER DEFAULT 0
    );
  `);

  await query(
    'INSERT INTO matches (id, title, team_a_name, team_b_name) VALUES ($1, $2, $3, $4)',
    [id, data.title, data.team_a_name, data.team_b_name]
  );

  for (let i = 0; i < data.rubriques.length; i++) {
    const r = data.rubriques[i];
    await query(
      'INSERT INTO rubriques (match_id, name, timer_seconds, points_per_click, order_index) VALUES ($1, $2, $3, $4, $5)',
      [id, r.name, r.timer_seconds, r.points_per_click, i]
    );
  }
  
  return getMatch(id);
}

export async function updateRubrique(matchId: string, rubriqueId: string, data: Partial<Rubrique>) {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    if (mockMatch) {
      mockMatch.rubriques = mockMatch.rubriques.map(r => 
        r.id === rubriqueId ? { ...r, ...data } : r
      );
      // Recalculate totals
      mockMatch.score_a_total = mockMatch.rubriques.reduce((acc, r) => acc + r.score_a, 0);
      mockMatch.score_b_total = mockMatch.rubriques.reduce((acc, r) => acc + r.score_b, 0);
    }
    return mockMatch;
  }

  if (data.score_a !== undefined) await query('UPDATE rubriques SET score_a = $1 WHERE id = $2', [data.score_a, rubriqueId]);
  if (data.score_b !== undefined) await query('UPDATE rubriques SET score_b = $1 WHERE id = $2', [data.score_b, rubriqueId]);
  if (data.is_running !== undefined) await query('UPDATE rubriques SET is_running = $1 WHERE id = $2', [data.is_running, rubriqueId]);
  if (data.timer_seconds !== undefined) await query('UPDATE rubriques SET timer_seconds = $1 WHERE id = $2', [data.timer_seconds, rubriqueId]);

  // Update totals in parent match
  const { rows } = await query('SELECT SUM(score_a) as a, SUM(score_b) as b FROM rubriques WHERE match_id = $1', [matchId]);
  await query('UPDATE matches SET score_a_total = $1, score_b_total = $2 WHERE id = $3', [rows[0].a || 0, rows[0].b || 0, matchId]);
  
  return getMatch(matchId);
}
