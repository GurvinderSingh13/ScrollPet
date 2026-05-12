require('dotenv').config();
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(() => {
  return client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'messages'");
}).then(res => {
  console.log(res.rows.map(r => r.column_name));
  return client.query("SELECT id, location, intent_status, crosspost_rooms, gender FROM messages LIMIT 1");
}).then(res => {
  console.log(res.rows);
  client.end();
}).catch(e => {
  console.error(e);
  client.end();
});
