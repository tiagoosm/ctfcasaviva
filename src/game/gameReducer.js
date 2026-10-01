export const STATE_VERSION = 2;
export const CODENAME_MAX_LENGTH = 40;
export const GROUP_MAX_LENGTH = 20;

export function createInitialState(codename = '', group = '') {
  return {
    version: STATE_VERSION,
    codename,
    group,
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

function sanitizeText(value, maxLength) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export const sanitizeCodename = (value) => sanitizeText(value, CODENAME_MAX_LENGTH);
export const sanitizeGroup = (value) => sanitizeText(value, GROUP_MAX_LENGTH);

export function gameReducer(state, action) {
  switch (action.type) {
    case 'START':
      return {
        ...state,
        codename: sanitizeCodename(action.codename) || state.codename,
        group: sanitizeGroup(action.group) || state.group,
        startedAt: state.startedAt ?? action.now,
      };

    case 'RECORD_ATTEMPT':
      return updateProgress(state, action.id, (p) => ({ attempts: p.attempts + 1 }));

    // Each challenge has a single hint
    case 'REVEAL_HINT': {
      const current = state.progress[action.id] ?? emptyProgress;
      if (current.solvedAt || current.hintsRevealed > 0) return state;
      return updateProgress(state, action.id, () => ({ hintsRevealed: 1 }));
    }

    case 'SOLVE': {
      if (state.progress[action.id]?.solvedAt) return state;
      const next = updateProgress(state, action.id, () => ({ solvedAt: action.now }));
      return action.completesMission ? { ...next, finishedAt: action.now } : next;
    }

    case 'RESET':
      return createInitialState(state.codename, state.group);

    default:
      return state;
  }
}
