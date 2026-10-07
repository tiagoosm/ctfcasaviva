// In-memory stand-in for the backend, used by the tests. It follows the same
// rules as the server functions in supabase/migrations: one attempt per
// name + class, answers and scores decided here, completed attempts frozen,
// and a ranking of every player who started.
import { challenges, getRequirements } from '../../challenges';
import { formatPlayerName, playerNameKey } from '../../game/names';
import { computeScore } from '../../game/scoring';
import { evaluateAnswer } from '../../utils/answers';

export const rankingEnabled = true;

// Answers the real server checks without any hash on the client
const SERVER_ONLY = { vault: '1969' };

let attempts = new Map();
let failing = false;
let nextId = 1;
let lockSeconds = 0;

// Test helpers
export function __reset() {
  attempts = new Map();
  failing = false;
  nextId = 1;
  lockSeconds = 0;
}
export const __setFailing = (value) => {
  failing = value;
};
// Makes throttled stages answer "locked" for that many seconds
export const __setLock = (seconds) => {
  lockSeconds = seconds;
};
export const __attempts = () => [...attempts.values()];
export const __remove = (id) => attempts.delete(id);

const playerKey = (name, group) => `${playerNameKey(name)}|${group.trim().toUpperCase()}`;

const makeId = () => `00000000-0000-4000-8000-${String(nextId++).padStart(12, '0')}`;

function check() {
  if (failing) throw new Error('offline');
}

function find(runId) {
  const attempt = attempts.get(runId);
  if (!attempt) throw Object.assign(new Error('run not found'), { rejected: true, gone: true });
  return attempt;
}

function stage(attempt, id) {
  if (!attempt.stages[id]) {
    attempt.stages[id] = { solvedAt: null, wrong: 0, hintUsed: false, score: null, lastAction: null };
  }
  return attempt.stages[id];
}

function open(attempt, challengeId) {
  if (attempt.finishedAt) throw Object.assign(new Error('run finished'), { rejected: true });
  // Same rule as the server: every challenge of an earlier tier must be solved
  const challenge = challenges.find((item) => item.id === challengeId);
  if (getRequirements(challenge).some((item) => !attempt.stages[item.id]?.solvedAt)) {
    throw Object.assign(new Error('challenge locked'), { rejected: true });
  }
  return stage(attempt, challengeId);
}

// Points so far, or the official score once completed
const currentScore = (attempt) =>
  attempt.finishedAt
    ? attempt.score
    : Object.values(attempt.stages).reduce((sum, item) => sum + (item.score ?? 0), 0);

// Every player who started, by current score, then name (time is always 0 here)
const ranked = () =>
  [...attempts.values()].sort(
    (a, b) => currentScore(b) - currentScore(a) || a.name.localeCompare(b.name),
  );

function snapshot(attempt) {
  const stages = challenges.map((challenge) => ({ id: challenge.id, ...stage(attempt, challenge.id) }));
  const completed = Boolean(attempt.finishedAt);
  return {
    id: attempt.id,
    name: attempt.name,
    group: attempt.group,
    status: completed ? 'completed' : 'in_progress',
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
    score: completed ? attempt.score : stages.reduce((sum, item) => sum + (item.score ?? 0), 0),
    totalSeconds: 0,
    errors: stages.reduce((sum, item) => sum + item.wrong, 0),
    hints: stages.filter((item) => item.hintUsed).length,
    challenges: stages.map((item) => ({
      id: item.id,
      solvedAt: item.solvedAt,
      wrong: item.wrong,
      hintUsed: item.hintUsed,
      seconds: 0,
      score: item.score,
    })),
  };
}

export async function startRun(name, group) {
  check();
  const key = playerKey(name, group);
  let attempt = [...attempts.values()].find((item) => item.key === key);
  if (!attempt) {
    attempt = {
      id: makeId(),
      key,
      // Stored in capital letters, as on the server
      name: formatPlayerName(name),
      group: group.trim().toUpperCase(),
      startedAt: Date.now(),
      finishedAt: null,
      score: null,
      stages: {},
    };
    attempts.set(attempt.id, attempt);
  }
  return snapshot(attempt);
}

export async function fetchState(runId) {
  check();
  const attempt = attempts.get(runId);
  return attempt ? snapshot(attempt) : null;
}

export async function enterChallenge(runId, challengeId) {
  check();
  open(find(runId), challengeId);
}

export async function leaveChallenge(runId) {
  check();
  find(runId);
}

export async function revealHint(runId, challengeId) {
  check();
  const item = open(find(runId), challengeId);
  if (!item.solvedAt) item.hintUsed = true;
}

export async function submitAnswer(runId, challengeId, answer, actionId) {
  check();
  const attempt = find(runId);
  const challenge = challenges.find((item) => item.id === challengeId);
  const solvedAlready = attempt.stages[challengeId]?.solvedAt;
  if (solvedAlready) {
    return {
      status: 'correct',
      score: attempt.stages[challengeId].score,
      seconds: 0,
      finished: Boolean(attempt.finishedAt),
    };
  }

  const item = open(attempt, challengeId);
  const expected = SERVER_ONLY[challengeId];
  if (expected && lockSeconds > 0) return { status: 'locked', wait: lockSeconds };
  const result = expected
    ? { status: answer.trim() === expected ? 'correct' : answer.trim() ? 'incorrect' : 'empty' }
    : evaluateAnswer(challenge, answer);
  if (result.status === 'empty') return { status: 'empty' };
  if (result.status !== 'correct') {
    if (!actionId || item.lastAction !== actionId) {
      item.wrong += 1;
      item.lastAction = actionId;
    }
    return { status: 'incorrect', wait: 0 };
  }

  item.solvedAt = Date.now();
  item.score = computeScore(challenge, { seconds: 0, wrong: item.wrong, hintUsed: item.hintUsed });

  const finished = challenges.every((entry) => attempt.stages[entry.id]?.solvedAt);
  if (finished) {
    attempt.finishedAt = Date.now();
    attempt.score = challenges.reduce((sum, entry) => sum + attempt.stages[entry.id].score, 0);
  }
  return { status: 'correct', score: item.score, seconds: 0, finished };
}

export async function fetchRanking(limit = 20) {
  check();
  return ranked()
    .slice(0, limit)
    .map((attempt, index) => ({
      place: index + 1,
      name: attempt.name,
      group: attempt.group,
      score: currentScore(attempt),
      totalSeconds: 0,
      completed: Boolean(attempt.finishedAt),
    }));
}
