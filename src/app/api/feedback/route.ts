import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { rating, suggestion } = await req.json();
  if (!rating || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
  }

  await sql`
    INSERT INTO user_feedback (user_email, rating, suggestion)
    VALUES (${session.user.email}, ${rating}, ${suggestion ?? null})
  `;
  return NextResponse.json({ ok: true });
}
