export const STATE_VERSION = 2;
export const CODENAME_MAX_LENGTH = 24;

export function createInitialState(codename = '') {
  return {
    version: STATE_VERSION,
    codename,
    startedAt: null,
    finishedAt: null,
    progress: {},
  };
}

export const emptyProgress = { attempts: 0, hintsRevealed: 0, solvedAt: null };

function updateProgress(state, id, update) {
  const current = state.progress[id] ?? emptyProgress;
  return { ...state, progress: { ...state.progress, [id]: { ...current, ...update(current) } } };
}

export function sanitizeCodename(value) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, CODENAME_MAX_LENGTH);
}

export function gameReducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        codename: sanitizeCodename(action.codename) || state.codename,
        startedAt: state.startedAt ?? action.now,
      };

    case 'ENSURE_STARTED':
      return state.startedAt ? state : { ...state, startedAt: action.now };

    case 'RECORD_ATTEMPT':
      return updateProgress(state, action.id, (p) => ({ attempts: p.attempts + 1 }));

    case 'REVEAL_HINT': {
      const current = state.progress[action.id] ?? emptyProgress;
      if (current.solvedAt || current.hintsRevealed >= action.max) return state;
      return updateProgress(state, action.id, (p) => ({ hintsRevealed: p.hintsRevealed + 1 }));
    }

    case 'SOLVE': {
      if (state.progress[action.id]?.solvedAt) return state;
      const next = updateProgress(state, action.id, () => ({ solvedAt: action.now }));
      return action.completesMission ? { ...next, finishedAt: action.now } : next;
    }

    case 'RESET':
      return createInitialState(state.codename);

    default:
      return state;
  }
}
