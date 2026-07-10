import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS reported_issues (
      id            SERIAL PRIMARY KEY,
      user_email    TEXT,
      question_prompt TEXT NOT NULL,
      question_topic  TEXT,
      note          TEXT,
      resolved      BOOLEAN NOT NULL DEFAULT FALSE,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const ADMIN = process.env.ADMIN_EMAIL;
  if (!session?.user?.email || session.user.email !== ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await ensureTable();

  const rows = await sql`
    SELECT id, user_email, question_prompt, question_topic, note, resolved, created_at
    FROM reported_issues
    ORDER BY resolved ASC, created_at DESC
  `;

  return NextResponse.json({ issues: rows });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  const { question_prompt, question_topic, note } = await req.json() as {
    question_prompt: string;
    question_topic?: string;
    note?: string;
  };

  if (!question_prompt) return NextResponse.json({ ok: false }, { status: 400 });

  await ensureTable();

  await sql`
    INSERT INTO reported_issues (user_email, question_prompt, question_topic, note)
    VALUES (
      ${session?.user?.email ?? null},
      ${question_prompt},
      ${question_topic ?? null},
      ${note ?? null}
    )
  `;

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const ADMIN = process.env.ADMIN_EMAIL;
  if (!session?.user?.email || session.user.email !== ADMIN) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id, resolved } = await req.json() as { id: number; resolved: boolean };

  await sql`
    UPDATE reported_issues SET resolved = ${resolved} WHERE id = ${id}
  `;

  return NextResponse.json({ ok: true });
}
