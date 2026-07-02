import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import { sql } from '@/lib/db';

const ADMIN_EMAIL = 'eddieriley.tmo@gmail.com';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const rows = await sql`
    SELECT user_email, lesson_completions, updated_at
    FROM user_progress
    ORDER BY updated_at DESC
  `;
  return NextResponse.json({ users: rows });
}
