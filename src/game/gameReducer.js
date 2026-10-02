import { isValidGroup } from './groups';
import { computeScore } from './scoring';

export const STATE_VERSION = 3;
export const CODENAME_MAX_LENGTH = 40;

export function createInitialState(codename = '', group = '') {
  return {
    version: STATE_VERSION,
    codename,
    group,
    startedAt: null,
    finishedAt: null,
    // Server-side run this mission is mirrored to (null while playing offline)
    runId: null,
    // Final result as confirmed by the server, including the ranking place
    result: null,
    progress: {},
  };
}

export const emptyProgress = {
  enteredAt: null,
  solvedAt: null,
  wrong: 0,
  hintUsed: false,
  seconds: null,
  score: null,
};

function updateProgress(state, id, changes) {
  const current = state.progress[id] ?? emptyProgress;
  return { ...state, progress: { ...state.progress, [id]: { ...current, ...changes } } };
}

function sanitizeText(value, maxLength) {
  return String(value ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}

export const sanitizeCodename = (value) => sanitizeText(value, CODENAME_MAX_LENGTH);
// The class must be one of the known classes; anything else counts as not informed
export function sanitizeGroup(value) {
  const group = String(value ?? '').trim().toUpperCase();
  return isValidGroup(group) ? group : '';
}

export function gameReducer(state, action) {
  const current = state.progress[action.id ?? action.challenge?.id] ?? emptyProgress;

  switch (action.type) {
    case 'START':
      return {
        ...state,
        codename: sanitizeCodename(action.codename) || state.codename,
        group: sanitizeGroup(action.group) || state.group,
        startedAt: state.startedAt ?? action.now,
      };

    case 'SET_RUN':
      return { ...state, runId: action.runId };

    // Each challenge has its own hidden clock, used only for its speed bonus: it
    // starts on the first visit and is never restarted. The clock players see is
    // the mission clock, which runs from startedAt to finishedAt.
    case 'ENTER':
      if (current.enteredAt || current.solvedAt) return state;
      return {
        ...updateProgress(state, action.id, { enteredAt: action.now }),
        startedAt: state.startedAt ?? action.now,
      };

    case 'WRONG':
      if (current.solvedAt) return state;
      return updateProgress(state, action.id, { wrong: current.wrong + 1 });

    // Each challenge has a single hint
    case 'REVEAL_HINT':
      if (current.solvedAt || current.hintUsed) return state;
      return updateProgress(state, action.id, { hintUsed: true });

    case 'SOLVE': {
      if (current.solvedAt) return state;
      const { challenge, now } = action;
      const seconds = Math.max(0, Math.round((now - (current.enteredAt ?? now)) / 1000));
      const score = computeScore(challenge, {
        seconds,
        wrong: current.wrong,
        hintUsed: current.hintUsed,
      });
      const next = updateProgress(state, challenge.id, { solvedAt: now, seconds, score });
      return action.completesMission ? { ...next, finishedAt: now } : next;
    }

    // The server's numbers replace the local estimate once they arrive
    case 'SERVER_SCORE':
      if (!current.solvedAt) return state;
      return updateProgress(state, action.id, { score: action.score, seconds: action.seconds });

    case 'RESULT':
      return { ...state, result: action.result };

    case 'RESET':
      return createInitialState(state.codename, state.group);

    // Leaving forgets the player too: the next visitor starts from the form
    case 'SIGN_OUT':
      return createInitialState();

    default:
      return state;
  }
}
