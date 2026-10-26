// Keeps the Supabase project awake. On the free plan a project is paused when
// it does not get enough database activity over a week; Supabase suggests "a
// few requests each day". The CTF is used only now and then, so four Vercel
// Cron Jobs (vercel.json) call this function every 6 hours, and each call makes
// a few small reads. Nothing is written.
//
// The URL and the publishable key are the same public values the site uses.
const API_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zssdxfbsnsjcqqoxgckp.supabase.co';
const API_KEY = process.env.REACT_APP_SUPABASE_KEY || 'sb_publishable_6uzYyeNkU7l7ZSWrECcV8g_dkdnoVtg';

// Read-only database functions: the top of the ranking, the full Top 20 and
// the state of an attempt that does not exist (answered with null)
const READS = [
  ['ctf_ranking', { p_limit: 1 }],
  ['ctf_ranking', { p_limit: 20 }],
  ['ctf_state', { p_run: '00000000-0000-4000-8000-000000000000' }],
];

async function read([name, params]) {
  const response = await fetch(`${API_URL}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: API_KEY,
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
    signal: AbortSignal.timeout(20000),
  });
  return response.status;
}

module.exports = async function keepalive(req, res) {
  const startedAt = Date.now();
  try {
    const statuses = [];
    for (const call of READS) statuses.push(await read(call));
    const ok = statuses.every((status) => status === 200);
    // A failure is reported as an error so it shows up in the Vercel logs
    res.status(ok ? 200 : 502).json({ ok, slot: req.query?.slot ?? null, statuses, ms: Date.now() - startedAt });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message, ms: Date.now() - startedAt });
  }
};
