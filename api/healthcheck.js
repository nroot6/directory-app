// Visit /api/healthcheck on your Vercel deployment to debug connection issues
const { Pool } = require('pg');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const url = process.env.DATABASE_URL;
  if (!url) {
    return res.status(500).json({ ok: false, issue: 'DATABASE_URL is not set in environment variables' });
  }

  // Mask password for safe display
  const masked = url.replace(/:([^@]+)@/, ':****@');

  const pool = new Pool({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 8000,
  });

  try {
    const result = await pool.query(`SELECT COUNT(*) as total FROM directory`);
    return res.status(200).json({
      ok: true,
      url_used: masked,
      records_in_directory: parseInt(result.rows[0].total),
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      url_used: masked,
      error: err.message,
      fix: err.message.includes('SSL') 
        ? 'SSL issue — already handled in code, check URL format'
        : err.message.includes('password') || err.message.includes('auth')
        ? 'Wrong password in DATABASE_URL'
        : err.message.includes('does not exist')
        ? 'Table "directory" does not exist — run setup.sql in Supabase'
        : err.message.includes('ENOTFOUND') || err.message.includes('connect')
        ? 'Cannot reach host — use the Session Pooler URL from Supabase (port 5432)'
        : 'Check DATABASE_URL format',
    });
  } finally {
    await pool.end().catch(() => {});
  }
};
