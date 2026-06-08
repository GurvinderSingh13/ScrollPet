import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://xmapispmhbvqowgcbguf.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtYXBpc3BtaGJ2cW93Z2NiZ3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjA1NzYsImV4cCI6MjA4ODgzNjU3Nn0.TbN1bg0gITJXieXQq3Z_nWY8nu1S2uX1klj4a7u57ac";
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const { data: cats } = await supabase.from('categories').select('*').limit(1);
  console.log('Categories:', cats);
  
  const { data: breeds } = await supabase.from('breeds').select('*').limit(1);
  console.log('Breeds:', breeds);
}
check();
