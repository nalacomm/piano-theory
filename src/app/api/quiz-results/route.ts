import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS quiz_performance (
      user_email  TEXT NOT NULL,
      topic       TEXT NOT NULL,
      correct_count INT NOT NULL DEFAULT 0,
      wrong_count   INT NOT NULL DEFAULT 0,
      last_seen   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_email, topic)
    )
  `;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ performance: [] });

  await ensureTable();

  const rows = await sql`
    SELECT topic, correct_count, wrong_count
    FROM quiz_performance
    WHERE user_email = ${session.user.email}
  `;

  return NextResponse.json({ performance: rows });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ ok: false }, { status: 401 });

  const { topic, correct } = await req.json() as { topic: string; correct: boolean };
  if (!topic) return NextResponse.json({ ok: false }, { status: 400 });

  await ensureTable();

  await sql`
    INSERT INTO quiz_performance (user_email, topic, correct_count, wrong_count, last_seen)
    VALUES (
      ${session.user.email},
      ${topic},
      ${correct ? 1 : 0},
      ${correct ? 0 : 1},
      NOW()
    )
    ON CONFLICT (user_email, topic) DO UPDATE SET
      correct_count = quiz_performance.correct_count + ${correct ? 1 : 0},
      wrong_count   = quiz_performance.wrong_count   + ${correct ? 0 : 1},
      last_seen     = NOW()
  `;

  return NextResponse.json({ ok: true });
}
