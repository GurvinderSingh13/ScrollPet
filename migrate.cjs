const { Client } = require('pg');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const dbUrl = env.match(/DATABASE_URL="([^"]+)"/)[1];

const client = new Client({ connectionString: dbUrl });

async function run() {
  await client.connect();
  try {
    // Add handle to pets
    await client.query(`
      ALTER TABLE pets 
      ADD COLUMN IF NOT EXISTS handle VARCHAR(255) UNIQUE;
    `);
    
    // Add pet_id to posts
    await client.query(`
      ALTER TABLE posts 
      ADD COLUMN IF NOT EXISTS pet_id VARCHAR(255) REFERENCES pets(id) ON DELETE CASCADE;
    `);
    
    // Create an index on handle
    await client.query(`
      CREATE INDEX IF NOT EXISTS pets_handle_idx ON pets(handle);
    `);
    
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.end();
  }
}

run();
