import { isValidGroup } from './groups';
import { computeScore } from './scoring';

export const STATE_VERSION = 4;
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

// Time only counts while the player is inside a challenge: `activeMs` holds the
// periods already finished and `resumedAt` marks the one in progress (null
// while the clock is paused).
export const emptyProgress = {
  activeMs: 0,
  resumedAt: null,
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

// Active time of a challenge up to `now`, in milliseconds
export function activeTime(progress, now) {
  const running = progress.resumedAt ? Math.max(0, now - progress.resumedAt) : 0;
  return progress.activeMs + running;
}

const paused = (progress, now) => ({ activeMs: activeTime(progress, now), resumedAt: null });

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

    // Entering a challenge starts (or resumes) its clock
    case 'ENTER':
      if (current.solvedAt || current.resumedAt) return state;
      return {
        ...updateProgress(state, action.id, { resumedAt: action.now }),
        startedAt: state.startedAt ?? action.now,
      };

    // Leaving it (to the map, the ranking, anywhere else) pauses the clock
    case 'LEAVE':
      if (!current.resumedAt) return state;
      return updateProgress(state, action.id, paused(current, action.now));

    // The page is going away: pause whatever is running
    case 'PAUSE_ALL': {
      const progress = Object.fromEntries(
        Object.entries(state.progress).map(([id, entry]) => [
          id,
          entry.resumedAt ? { ...entry, ...paused(entry, action.now) } : entry,
        ]),
      );
      return { ...state, progress };
    }

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
      const stopped = paused(current, now);
      const seconds = Math.round(stopped.activeMs / 1000);
      const score = computeScore(challenge, {
        seconds,
        wrong: current.wrong,
        hintUsed: current.hintUsed,
      });
      const next = updateProgress(state, challenge.id, { ...stopped, solvedAt: now, seconds, score });
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
