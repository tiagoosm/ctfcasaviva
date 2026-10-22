// Keeps the Supabase project awake. On the free plan a project is paused after
// several days without any request; the CTF is used only now and then, so a
// Vercel Cron Job (see vercel.json) calls this function once a day and it
// makes one small read: the top of the ranking. Nothing is written.
//
// The URL and the publishable key are the same public values the site uses.
const API_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zssdxfbsnsjcqqoxgckp.supabase.co';
const API_KEY = process.env.REACT_APP_SUPABASE_KEY || 'sb_publishable_6uzYyeNkU7l7ZSWrECcV8g_dkdnoVtg';

module.exports = async function keepalive(req, res) {
  const startedAt = Date.now();
  try {
    const response = await fetch(`${API_URL}/rest/v1/rpc/ctf_ranking`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_limit: 1 }),
      signal: AbortSignal.timeout(20000),
    });
    // A failure is reported as an error so it shows up in the Vercel logs
    res.status(response.ok ? 200 : 502).json({
      ok: response.ok,
      status: response.status,
      ms: Date.now() - startedAt,
    });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message, ms: Date.now() - startedAt });
  }
};
