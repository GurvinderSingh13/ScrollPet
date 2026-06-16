import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function runMigration() {
  try {
    await db.execute(sql`ALTER TABLE pets ADD COLUMN IF NOT EXISTS status_mating BOOLEAN DEFAULT false;`);
    await db.execute(sql`ALTER TABLE pets ADD COLUMN IF NOT EXISTS status_pups_sell BOOLEAN DEFAULT false;`);
    await db.execute(sql`ALTER TABLE pets ADD COLUMN IF NOT EXISTS status_pups_adoption BOOLEAN DEFAULT false;`);
    await db.execute(sql`ALTER TABLE pets ADD COLUMN IF NOT EXISTS status_for_sell BOOLEAN DEFAULT false;`);
    await db.execute(sql`ALTER TABLE pets ADD COLUMN IF NOT EXISTS status_for_adoption BOOLEAN DEFAULT false;`);
    await db.execute(sql`ALTER TABLE pets ADD COLUMN IF NOT EXISTS status_lost BOOLEAN DEFAULT false;`);
    await db.execute(sql`ALTER TABLE pets ADD COLUMN IF NOT EXISTS status_dead BOOLEAN DEFAULT false;`);
    
    // Also make sure pet_followers table exists just in case
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pet_followers (
        pet_id VARCHAR NOT NULL,
        user_id VARCHAR NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (pet_id, user_id)
      );
    `);
    
    console.log('Migration successful');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
}

runMigration();
