import { sql } from '@vercel/postgres';

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

// Simple in-memory mock for local dev if Postgres is not connected
let mockMatch: (Match & { rubriques: Rubrique[] }) | null = null;

export async function getMatch(id: string) {
  if (!process.env.POSTGRES_URL) {
    if (mockMatch && mockMatch.id === id) return mockMatch;
    return null;
  }
  
  const { rows } = await sql`SELECT * FROM matches WHERE id = ${id}`;
  if (rows.length === 0) return null;
  
  const { rows: rubriques } = await sql`SELECT * FROM rubriques WHERE match_id = ${id} ORDER BY order_index ASC`;
  return { ...rows[0], rubriques };
}

export async function createMatch(data: any) {
  const id = crypto.randomUUID();
  if (!process.env.POSTGRES_URL) {
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

  await sql`
    INSERT INTO matches (id, title, team_a_name, team_b_name)
    VALUES (${id}, ${data.title}, ${data.team_a_name}, ${data.team_b_name})
  `;

  for (let i = 0; i < data.rubriques.length; i++) {
    const r = data.rubriques[i];
    await sql`
      INSERT INTO rubriques (match_id, name, timer_seconds, points_per_click, order_index)
      VALUES (${id}, ${r.name}, ${r.timer_seconds}, ${r.points_per_click}, ${i})
    `;
  }
  
  return getMatch(id);
}

export async function updateRubrique(matchId: string, rubriqueId: string, data: Partial<Rubrique>) {
  if (!process.env.POSTGRES_URL) {
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

  if (data.score_a !== undefined) await sql`UPDATE rubriques SET score_a = ${data.score_a} WHERE id = ${rubriqueId}`;
  if (data.score_b !== undefined) await sql`UPDATE rubriques SET score_b = ${data.score_b} WHERE id = ${rubriqueId}`;
  if (data.is_running !== undefined) await sql`UPDATE rubriques SET is_running = ${data.is_running} WHERE id = ${rubriqueId}`;
  if (data.timer_seconds !== undefined) await sql`UPDATE rubriques SET timer_seconds = ${data.timer_seconds} WHERE id = ${rubriqueId}`;

  // Update totals in parent match
  const { rows } = await sql`SELECT SUM(score_a) as a, SUM(score_b) as b FROM rubriques WHERE match_id = ${matchId}`;
  await sql`UPDATE matches SET score_a_total = ${rows[0].a}, score_b_total = ${rows[0].b} WHERE id = ${matchId}`;
  
  return getMatch(matchId);
}
