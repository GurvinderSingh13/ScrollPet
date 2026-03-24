import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://xmapispmhbvqowgcbguf.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtYXBpc3BtaGJ2cW93Z2NiZ3VmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyNjA1NzYsImV4cCI6MjA4ODgzNjU3Nn0.TbN1bg0gITJXieXQq3Z_nWY8nu1S2uX1klj4a7u57ac");

async function test() {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      id,
      users:users!user_id(id),
      receiver:users!receiver_id(id)
    `)
    .limit(1);
    
  console.log("receiver_id result:", error ? error.message : "SUCCESS!");

  const { data: d2, error: e2 } = await supabase
    .from('messages')
    .select(`
      id,
      users:users!user_id(id),
      receiver:users!messages_receiver_id_fkey(id)
    `)
    .limit(1);
    
  console.log("messages_receiver_id_fkey result:", e2 ? e2.message : "SUCCESS!");
}
test();
