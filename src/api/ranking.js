// Client for the ranking backend (Supabase). Every call is a server-side
// function: the server validates answers, measures time and computes scores,
// so nothing sent from here can set a score directly.
// The publishable key is meant to be public; it only grants access to the
// ctf_* functions exposed in supabase/migrations.
export const API_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zssdxfbsnsjcqqoxgckp.supabase.co';
export const API_KEY =
  process.env.REACT_APP_SUPABASE_KEY || 'sb_publishable_6uzYyeNkU7l7ZSWrECcV8g_dkdnoVtg';

const TIMEOUT = 8000;
const RETRY_DELAYS = [400, 1200];

export const rankingEnabled = typeof fetch === 'function' && process.env.NODE_ENV !== 'test';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function call(name, params) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(`${API_URL}/rest/v1/rpc/${name}`, {
      method: 'POST',
      headers: {
        apikey: API_KEY,
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.message || `HTTP ${response.status}`);
      // The server understood and refused: retrying would not help
      error.rejected = response.status >= 400 && response.status < 500;
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// Network failures and server errors are retried; refusals are not
async function rpc(name, params = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call(name, params);
    } catch (error) {
      if (error.rejected || attempt >= RETRY_DELAYS.length) throw error;
      await wait(RETRY_DELAYS[attempt]);
    }
  }
}

export const startRun = (name, group) => rpc('ctf_start', { p_name: name, p_class: group });

export const enterChallenge = (runId, challengeId) =>
  rpc('ctf_enter', { p_run: runId, p_challenge: challengeId });

export const revealHint = (runId, challengeId) =>
  rpc('ctf_hint', { p_run: runId, p_challenge: challengeId });

export const submitAnswer = (runId, challengeId, answer) =>
  rpc('ctf_submit', { p_run: runId, p_challenge: challengeId, p_answer: answer });

export async function fetchResult(runId) {
  const data = await rpc('ctf_result', { p_run: runId });
  if (!data) return null;
  return {
    place: data.place,
    score: data.score,
    totalSeconds: data.total_seconds,
    errors: data.errors,
    hints: data.hints,
  };
}

export async function fetchRanking(limit = 20) {
  const rows = await rpc('ctf_ranking', { p_limit: limit });
  return (rows ?? []).map((row) => ({
    place: row.place,
    name: row.name,
    group: row.class_name,
    score: row.score,
    totalSeconds: row.total_seconds,
  }));
}
