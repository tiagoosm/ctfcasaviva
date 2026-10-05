import { isValidGroup } from './groups';
import { formatPlayerName, NAME_MAX_LENGTH } from './names';

export const STATE_VERSION = 5;
export const CODENAME_MAX_LENGTH = NAME_MAX_LENGTH;

// What this browser remembers about the player's attempt. It is a cache: the
// attempt itself (identity, progress, score, completion) lives on the server,
// and this state is rebuilt from it whenever the player starts or returns.
export function createInitialState() {
  return {
    version: STATE_VERSION,
    codename: '',
    group: '',
    // Id of the player's attempt on the server
    runId: null,
    startedAt: null,
    finishedAt: null,
    // Official result, once the attempt is completed
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

// Player names are always kept in capital letters (see names.js)
export const sanitizeCodename = formatPlayerName;

// The class must be one of the known classes; anything else counts as not informed
export function sanitizeGroup(value) {
  const group = String(value ?? '').trim().toUpperCase();
  return isValidGroup(group) ? group : '';
}

// Rebuilds the local state from the attempt as the server knows it
function hydrate(state, attempt, now) {
  const sameAttempt = state.runId === attempt.id;
  const progress = {};

  for (const item of attempt.challenges) {
    // A challenge that is open on screen right now keeps its clock running
    const running = !item.solvedAt && sameAttempt && Boolean(state.progress[item.id]?.resumedAt);
    const touched = item.solvedAt || item.wrong > 0 || item.hintUsed || item.seconds > 0 || running;
    if (!touched) continue;

    progress[item.id] = {
      activeMs: item.seconds * 1000,
      resumedAt: running ? now : null,
      solvedAt: item.solvedAt,
      wrong: item.wrong,
      hintUsed: item.hintUsed,
      seconds: item.solvedAt ? item.seconds : null,
      score: item.solvedAt ? item.score : null,
    };
  }

  return {
    version: STATE_VERSION,
    codename: formatPlayerName(attempt.name),
    group: attempt.group,
    runId: attempt.id,
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
    result:
      attempt.status === 'completed'
        ? {
            place: attempt.place,
            score: attempt.score,
            totalSeconds: attempt.totalSeconds,
            errors: attempt.errors,
            hints: attempt.hints,
          }
        : null,
    progress,
  };
}

export function gameReducer(state, action) {
  const current = state.progress[action.id] ?? emptyProgress;

  switch (action.type) {
    case 'HYDRATE':
      return hydrate(state, action.attempt, action.now);

    // Entering a challenge starts (or resumes) its clock
    case 'ENTER':
      if (current.solvedAt || current.resumedAt) return state;
      return updateProgress(state, action.id, { resumedAt: action.now });

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

    // The server refused an answer
    case 'WRONG':
      if (current.solvedAt) return state;
      return updateProgress(state, action.id, { wrong: current.wrong + 1 });

    // Each challenge has a single hint
    case 'REVEAL_HINT':
      if (current.solvedAt || current.hintUsed) return state;
      return updateProgress(state, action.id, { hintUsed: true });

    // The server accepted an answer: time and score are the ones it computed
    case 'SOLVED': {
      if (current.solvedAt) return state;
      const next = updateProgress(state, action.id, {
        activeMs: action.seconds * 1000,
        resumedAt: null,
        solvedAt: action.now,
        seconds: action.seconds,
        score: action.score,
      });
      return action.finished ? { ...next, finishedAt: action.now } : next;
    }

    // Forgets the player on this browser. The attempt stays on the server.
    case 'SIGN_OUT':
      return createInitialState();

    default:
      return state;
  }
}
