require("dotenv").config();
const { Pool } = require("pg");

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log("Adding handle column to pets table...");
    await pool.query(`
      ALTER TABLE pets 
      ADD COLUMN IF NOT EXISTS handle text UNIQUE,
      ADD COLUMN IF NOT EXISTS handle_updated boolean DEFAULT false;
    `);
    console.log("Migration successful!");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

migrate();
