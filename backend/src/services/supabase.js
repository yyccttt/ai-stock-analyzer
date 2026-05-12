const axios = require('axios');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

async function saveAnalysis(record) {
  const { data, status } = await axios.post(
    `${SUPABASE_URL}/rest/v1/stock_analyses`,
    record,
    {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
    }
  );

  return { data, status };
}

module.exports = { saveAnalysis };
