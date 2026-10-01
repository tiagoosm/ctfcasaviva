import { createInitialState, sanitizeCodename, STATE_VERSION } from './gameReducer';

export const STORAGE_KEY = 'casaviva-ctf/progress';

const isTimestamp = (value) => (Number.isFinite(value) && value > 0 ? value : null);
const isCount = (value) => (Number.isInteger(value) && value >= 0 ? value : 0);

// localStorage data may be corrupted, hand-edited or in an old
// format: we accept only what has the expected shape and discard the rest.
export function parseState(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== STATE_VERSION || typeof data.progress !== 'object') return null;

    const progress = {};
    for (const [id, entry] of Object.entries(data.progress ?? {})) {
      if (!entry || typeof entry !== 'object') continue;
      progress[id] = {
        attempts: isCount(entry.attempts),
        hintsRevealed: isCount(entry.hintsRevealed),
        solvedAt: isTimestamp(entry.solvedAt),
      };
    }

    return {
      ...createInitialState(sanitizeCodename(data.codename)),
      startedAt: isTimestamp(data.startedAt),
      finishedAt: isTimestamp(data.finishedAt),
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
