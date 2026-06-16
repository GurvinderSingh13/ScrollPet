const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:ScrollPet2026@db.xmapispmhbvqowgcbguf.supabase.co:5432/postgres'
});

async function run() {
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.pet_followers (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
          UNIQUE(pet_id, user_id)
      );
      ALTER TABLE public.pet_followers ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "Anyone can view pet followers" ON public.pet_followers;
      CREATE POLICY "Anyone can view pet followers" ON public.pet_followers FOR SELECT USING (true);
      
      DROP POLICY IF EXISTS "Authenticated users can follow pets" ON public.pet_followers;
      CREATE POLICY "Authenticated users can follow pets" ON public.pet_followers FOR INSERT WITH CHECK (auth.uid() = user_id);
      
      DROP POLICY IF EXISTS "Users can unfollow pets" ON public.pet_followers;
      CREATE POLICY "Users can unfollow pets" ON public.pet_followers FOR DELETE USING (auth.uid() = user_id);
    `);
    console.log("Success setting up pet_followers!");
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
