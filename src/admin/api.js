// Client for the admin area. Administrators sign in with Supabase Auth; the
// session token is then sent with every call, and each ctf_admin_* function
// checks on the server that the caller is a listed administrator.
import { API_KEY, API_URL } from '../api/ranking';
import { formatPlayerName } from '../game/names';

// Kept for the browser tab only: closing it signs the administrator out
const SESSION_KEY = 'casaviva-ctf/admin-session';
const REFRESH_MARGIN = 60000;

let session = readSession();

function readSession() {
  try {
    const stored = JSON.parse(window.sessionStorage.getItem(SESSION_KEY));
    return stored?.accessToken ? stored : null;
  } catch {
    return null;
  }
}

function storeSession(next) {
  session = next;
  try {
    if (next) window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
    else window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Without storage the session lives in memory until the page is reloaded
  }
}

function toSession(data) {
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    email: data.user?.email ?? '',
  };
}

async function request(path, { token = API_KEY, body } = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { apikey: API_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(data?.message || data?.msg || data?.error_description || `HTTP ${response.status}`);
    error.status = response.status;
    // Another attempt already uses that name and class
    error.duplicate = data?.code === '23505';
    throw error;
  }
  return data;
}

function unauthorized() {
  storeSession(null);
  const error = new Error('unauthorized');
  error.unauthorized = true;
  return error;
}

async function refreshSession() {
  try {
    const data = await request('/auth/v1/token?grant_type=refresh_token', {
      body: { refresh_token: session.refreshToken },
    });
    storeSession(toSession(data));
  } catch {
    throw unauthorized();
  }
}

async function rpc(name, params) {
  if (!session) throw unauthorized();
  if (session.expiresAt - Date.now() < REFRESH_MARGIN) await refreshSession();
  try {
    return await request(`/rest/v1/rpc/${name}`, { token: session.accessToken, body: params });
  } catch (error) {
    // 401: token no longer valid. 403: signed in, but not an administrator.
    if (error.status === 401 || error.status === 403) throw unauthorized();
    throw error;
  }
}

export const getSession = () => session;

export async function signIn(email, password) {
  const data = await request('/auth/v1/token?grant_type=password', { body: { email, password } });
  storeSession(toSession(data));
  // A valid login is not enough: the account must be a listed administrator
  const isAdmin = await rpc('ctf_is_admin').catch(() => false);
  if (!isAdmin) {
    await signOut();
    const error = new Error('not an administrator');
    error.notAdmin = true;
    throw error;
  }
  return session;
}

export async function signOut() {
  const token = session?.accessToken;
  storeSession(null);
  if (token) await request('/auth/v1/logout', { token }).catch(() => null);
}

const toPlayer = (row) => ({
  id: row.id,
  name: formatPlayerName(row.name),
  group: row.class_name,
  status: row.status,
  currentChallenge: row.current_challenge,
  startedAt: row.started_at,
  finishedAt: row.finished_at,
  hidden: row.hidden,
  score: row.score,
  totalSeconds: row.total_seconds,
  errors: row.errors,
  hints: row.hints,
  solved: row.solved,
});

export async function listPlayers() {
  return ((await rpc('ctf_admin_players')) ?? []).map(toPlayer);
}

export async function getPlayer(id) {
  const data = await rpc('ctf_admin_player', { p_run: id });
  if (!data) return null;
  return {
    id: data.id,
    name: formatPlayerName(data.name),
    group: data.class_name,
    startedAt: data.started_at,
    finishedAt: data.finished_at,
    hidden: data.hidden,
    totalSeconds: data.total_seconds,
    challenges: data.challenges.map((item) => ({
      id: item.id,
      maxPoints: item.max_points,
      started: Boolean(item.entered_at),
      solvedAt: item.solved_at,
      seconds: item.seconds,
      wrong: item.wrong,
      hintUsed: item.hint_used,
      score: item.score,
    })),
  };
}

export const updatePlayer = (id, name, group) =>
  rpc('ctf_admin_update_player', { p_run: id, p_name: name, p_class: group });

export const setPlayerHidden = (id, hidden) =>
  rpc('ctf_admin_set_hidden', { p_run: id, p_hidden: hidden });

export const deletePlayer = (id) => rpc('ctf_admin_delete_player', { p_run: id });

// Server-side settings of each challenge, including the plain-text answer
export async function listChallengeSettings() {
  const rows = (await rpc('ctf_admin_challenges')) ?? [];
  return Object.fromEntries(
    rows.map((row) => [
      row.id,
      {
        answer: row.answer,
        maxPoints: row.max_points,
        fastSeconds: row.fast_seconds,
        slowSeconds: row.slow_seconds,
      },
    ]),
  );
}
