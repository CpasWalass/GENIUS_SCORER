import { NextResponse } from 'next/server';
import { createMatch } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const match = await createMatch(data);
    return NextResponse.json(match);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json({ error: 'Failed to create match' }, { status: 500 });
  }
}
