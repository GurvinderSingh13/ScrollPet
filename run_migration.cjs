require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const migrationSql = `
CREATE TABLE IF NOT EXISTS public.followers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(follower_id, following_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'followers' AND policyname = 'Anyone can view followers'
    ) THEN
        CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'followers' AND policyname = 'Authenticated users can follow'
    ) THEN
        CREATE POLICY "Authenticated users can follow" ON public.followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'followers' AND policyname = 'Users can unfollow'
    ) THEN
        CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE USING (auth.uid() = follower_id);
    END IF;
END $$;
`;

async function runMigration() {
  console.log("Connecting to database...");
  const client = await pool.connect();
  try {
    console.log("Executing migration...");
    await client.query(migrationSql);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
