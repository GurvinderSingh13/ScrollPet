import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function check() {
  const r1 = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'pet_followers'`);
  console.log('pet_followers columns:', r1);
  const r2 = await db.execute(sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'pets'`);
  console.log('pets columns:', r2.map(row => row.column_name));
  process.exit(0);
}

check().catch(console.error);
