import { createInitialState, sanitizeCodename, sanitizeGroup, STATE_VERSION } from './gameReducer';

export const STORAGE_KEY = 'casaviva-ctf/progress';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isTimestamp = (value) => (Number.isFinite(value) && value > 0 ? value : null);
const isCount = (value) => (Number.isInteger(value) && value >= 0 ? value : 0);
const isCountOrNull = (value) => (Number.isInteger(value) && value >= 0 ? value : null);
const isDuration = (value) => (Number.isFinite(value) && value > 0 ? value : 0);

function parseResult(result) {
  if (!result || typeof result !== 'object') return null;
  return {
    score: isCount(result.score),
    totalSeconds: isCount(result.totalSeconds),
    errors: isCount(result.errors),
    hints: isCount(result.hints),
  };
}

// localStorage data may be corrupted, hand-edited or in an old
// format: we accept only what has the expected shape and discard the rest.
// Editing it only changes what this browser shows for a moment: the attempt
// lives on the server, and this cache is rebuilt from it when the app opens.
export function parseState(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== STATE_VERSION || typeof data.progress !== 'object') return null;

    const progress = {};
    for (const [id, entry] of Object.entries(data.progress ?? {})) {
      if (!entry || typeof entry !== 'object') continue;
      progress[id] = {
        activeMs: isDuration(entry.activeMs),
        // A clock is never restored as running: the page that is loading is not
        // inside a challenge yet, and the challenge page starts it again
        resumedAt: null,
        solvedAt: isTimestamp(entry.solvedAt),
        wrong: isCount(entry.wrong),
        hintUsed: entry.hintUsed === true,
        seconds: isCountOrNull(entry.seconds),
        score: isCountOrNull(entry.score),
      };
    }

    return {
      ...createInitialState(),
      codename: sanitizeCodename(data.codename),
      group: sanitizeGroup(data.group),
      startedAt: isTimestamp(data.startedAt),
      finishedAt: isTimestamp(data.finishedAt),
      runId: typeof data.runId === 'string' && UUID.test(data.runId) ? data.runId : null,
      result: parseResult(data.result),
      progress,
    };
  } catch {
    return null;
  }
}

// In a private tab, in data-saver mode or with cookies blocked, accessing
// storage may throw — the game keeps working, it just does not persist.
export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return (raw && parseState(raw)) || createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // No persistence available: progress lives only in this session
  }
}
