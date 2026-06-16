const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:ScrollPet2026@db.xmapispmhbvqowgcbguf.supabase.co:5432/postgres' });
client.connect().then(() => {
  client.query("SELECT column_name, data_type, table_name FROM information_schema.columns WHERE table_name IN ('posts', 'pet_media');").then(res => {
    console.log(res.rows);
    client.end();
  });
});
