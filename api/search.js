const { Pool } = require('pg');

// Connection pool — reused across warm serverless invocations
let pool;
function getPool() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }, // required for Supabase
      max: 5,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

module.exports = async function handler(req, res) {
  // CORS headers so the frontend can call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { district, name, page = '0', limit = '20' } = req.query;

  const pageNum  = Math.max(0, parseInt(page)  || 0);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset   = pageNum * limitNum;

  // Build query dynamically based on provided filters
  const conditions = [];
  const values     = [];
  let   idx        = 1;

  if (district && district.trim()) {
    conditions.push(`district = $${idx++}`);
    values.push(district.trim());
  }

  if (name && name.trim()) {
    conditions.push(`name ILIKE $${idx++}`);
    values.push(`%${name.trim()}%`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  try {
    const db = getPool();

    // Run data query and count query in parallel
    const [dataResult, countResult] = await Promise.all([
      db.query(
        `SELECT id, name, address, district
         FROM directory
         ${where}
         ORDER BY name ASC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limitNum, offset]
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM directory ${where}`,
        values
      ),
    ]);

    return res.status(200).json({
      records: dataResult.rows,
      total:   parseInt(countResult.rows[0].total),
      page:    pageNum,
      limit:   limitNum,
    });
  } catch (err) {
    console.error('DB error:', err.message);
    return res.status(500).json({ error: 'Database query failed', detail: err.message });
  }
};
