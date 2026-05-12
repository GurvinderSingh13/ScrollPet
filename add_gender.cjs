require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  return client.query("ALTER TABLE messages ADD COLUMN IF NOT EXISTS gender text;");
}).then(() => {
  console.log("Successfully added gender column to messages table.");
  client.end();
}).catch(e => {
  console.error("Failed to alter table:", e);
  client.end();
});
