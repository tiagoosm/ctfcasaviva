// Client for the CTF backend (Supabase). Every call is a server-side function:
// the server owns the attempt of each player (one per name + class), validates
// answers, measures time and computes scores. Nothing sent from here can set a
// score or create a second attempt.
// The publishable key is meant to be public; it only grants access to the
// ctf_* functions exposed in supabase/migrations.
import { formatPlayerName } from '../game/names';

export const API_URL = process.env.REACT_APP_SUPABASE_URL || 'https://zssdxfbsnsjcqqoxgckp.supabase.co';
export const API_KEY =
  process.env.REACT_APP_SUPABASE_KEY || 'sb_publishable_6uzYyeNkU7l7ZSWrECcV8g_dkdnoVtg';

const TIMEOUT = 8000;
const RETRY_DELAYS = [400, 1200];

export const rankingEnabled = typeof fetch === 'function';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function call(name, params, keepalive) {
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
      keepalive,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.message || `HTTP ${response.status}`);
      // The server understood and refused: retrying would not help
      error.rejected = response.status >= 400 && response.status < 500;
      // The attempt no longer exists (an administrator reset it)
      error.gone = data?.message === 'run not found';
      throw error;
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// Network failures and server errors are retried; refusals are not. Retrying is
// safe because every function is idempotent on the server.
async function rpc(name, params = {}, { keepalive = false } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await call(name, params, keepalive);
    } catch (error) {
      if (error.rejected || attempt >= RETRY_DELAYS.length) throw error;
      await wait(RETRY_DELAYS[attempt]);
    }
  }
}

const toTime = (value) => (value ? new Date(value).getTime() : null);

// The attempt as the server knows it: identity, status, totals and progress
function toAttempt(data) {
  if (!data) return null;
  return {
    id: data.id,
    name: formatPlayerName(data.name),
    group: data.class_name,
    status: data.status,
    startedAt: toTime(data.started_at),
    finishedAt: toTime(data.finished_at),
    score: data.score,
    totalSeconds: data.total_seconds,
    errors: data.errors,
    hints: data.hints,
    challenges: data.challenges.map((item) => ({
      id: item.id,
      solvedAt: toTime(item.solved_at),
      wrong: item.wrong,
      hintUsed: item.hint_used,
      seconds: item.seconds,
      score: item.score,
    })),
  };
}

// Creates the attempt of this player, or returns the one that already exists
// (in progress or completed). There is never a second one.
export const startRun = async (name, group) =>
  toAttempt(await rpc('ctf_start', { p_name: name, p_class: group }));

// Null when the attempt no longer exists
export const fetchState = async (runId) => toAttempt(await rpc('ctf_state', { p_run: runId }));

// Starts or resumes the challenge clock; also used as a heartbeat
export const enterChallenge = (runId, challengeId) =>
  rpc('ctf_enter', { p_run: runId, p_challenge: challengeId });

// Pauses the challenge clock. `keepalive` lets the request finish even when it
// is sent while the page is being closed.
export const leaveChallenge = (runId, challengeId) =>
  rpc('ctf_leave', { p_run: runId, p_challenge: challengeId }, { keepalive: true });

export const revealHint = (runId, challengeId) =>
  rpc('ctf_hint', { p_run: runId, p_challenge: challengeId });

// `actionId` identifies this submission, so a retry is not charged twice
export const submitAnswer = (runId, challengeId, answer, actionId) =>
  rpc('ctf_submit', {
    p_run: runId,
    p_challenge: challengeId,
    p_answer: answer,
    p_action: actionId,
  });

export async function fetchRanking(limit = 20) {
  const rows = await rpc('ctf_ranking', { p_limit: limit });
  return (rows ?? []).map((row) => ({
    place: row.place,
    name: formatPlayerName(row.name),
    group: row.class_name,
    score: row.score,
    totalSeconds: row.total_seconds,
    // The ranking lists players in progress too
    completed: row.completed,
  }));
}
