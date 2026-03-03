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

  const { district, name, page = '0', limit = '20' } = req.query;
  const pageNum  = Math.max(0, parseInt(page)  || 0);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
  const offset   = pageNum * limitNum;

  const conditions = [];
  const values     = [];
  let   idx        = 1;

  if (district && district.trim()) { conditions.push(`district = $${idx++}`); values.push(district.trim()); }
  if (name     && name.trim())     { conditions.push(`name ILIKE $${idx++}`); values.push('%' + name.trim() + '%'); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const pool  = getPool();

  try {
    const [dataResult, countResult] = await Promise.all([
      pool.query(
        `SELECT id, name, address, district FROM directory ${where} ORDER BY name ASC LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, limitNum, offset]
      ),
      pool.query(`SELECT COUNT(*) AS total FROM directory ${where}`, values),
    ]);
    return res.status(200).json({
      records: dataResult.rows,
      total:   parseInt(countResult.rows[0].total),
      page:    pageNum,
      limit:   limitNum,
    });
  } catch (err) {
    console.error('[search] DB error:', err.message);
    return res.status(500).json({ error: 'Database query failed', detail: err.message });
  } finally {
    await pool.end().catch(() => {});
  }
};
