import { neon } from '@neondatabase/serverless';

// sql is a tagged-template function — use as: await sql`SELECT ...`
export const sql = neon(process.env.DATABASE_URL!);
