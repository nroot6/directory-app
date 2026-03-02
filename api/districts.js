const { Pool } = require('pg');

let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const db = getPool();
    const result = await db.query(
      `SELECT DISTINCT district FROM directory WHERE district IS NOT NULL ORDER BY district ASC`
    );
    return res.status(200).json({ districts: result.rows.map(r => r.district) });
  } catch (err) {
    console.error('DB error:', err.message);
    return res.status(500).json({ error: 'Failed to load districts', detail: err.message });
  }
};
