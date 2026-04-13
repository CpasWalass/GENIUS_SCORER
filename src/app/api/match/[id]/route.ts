import { NextResponse } from 'next/server';
import { getMatch, updateRubrique } from '@/lib/db';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const match = await getMatch(id);
    if (!match) return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    return NextResponse.json(match);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch match' }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { rubriqueId, ...data } = await req.json();
    const match = await updateRubrique(id, rubriqueId, data);
    return NextResponse.json(match);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update match' }, { status: 500 });
  }
}
