const { Pool } = require('pg');

function getPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL environment variable is not set');
  return new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    max: 3,
    connectionTimeoutMillis: 10000,
    idleTimeoutMillis: 20000,
  });
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.DATABASE_URL) {
    return res.status(500).json({
      error: 'DATABASE_URL not set',
      detail: 'Add DATABASE_URL in Vercel Project Settings → Environment Variables, then redeploy.',
    });
  }

  const pool = getPool();
  try {
    const result = await pool.query(
      `SELECT DISTINCT district FROM directory WHERE district IS NOT NULL ORDER BY district ASC`
    );
    return res.status(200).json({ districts: result.rows.map(r => r.district) });
  } catch (err) {
    console.error('[districts] DB error:', err.message);
    return res.status(500).json({ error: 'Database query failed', detail: err.message });
  } finally {
    await pool.end().catch(() => {});
  }
};
