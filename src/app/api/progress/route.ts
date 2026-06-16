import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const rows = await sql`
    SELECT lesson_completions FROM user_progress
    WHERE user_email = ${session.user.email}
  `;
  return NextResponse.json({
    lesson_completions: rows[0]?.lesson_completions ?? [],
  });
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { lesson_completions } = await req.json();
  const completionsJson = JSON.stringify(lesson_completions ?? []);

  await sql`
    INSERT INTO user_progress (user_email, lesson_completions, updated_at)
    VALUES (${session.user.email}, ${completionsJson}::jsonb, NOW())
    ON CONFLICT (user_email) DO UPDATE
    SET lesson_completions = ${completionsJson}::jsonb,
        updated_at         = NOW()
  `;
  return NextResponse.json({ ok: true });
}
