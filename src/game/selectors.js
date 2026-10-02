import { challenges, TOTAL_POINTS } from '../challenges';
import { activeTime, emptyProgress } from './gameReducer';

export const getProgress = (state, id) => state.progress[id] ?? emptyProgress;

export const isSolved = (state, id) => Boolean(getProgress(state, id).solvedAt);

export const isRegistered = (state) => Boolean(state.codename && state.group);

// True once the player has acted on the mission (visiting a challenge does not count)
export const hasProgress = (state) =>
  Object.values(state.progress).some((p) => p.solvedAt || p.wrong > 0 || p.hintUsed);

// A challenge only unlocks once all the previous ones are solved
export function getStatus(state, challenge) {
  if (isSolved(state, challenge.id)) return 'solved';
  const index = challenges.indexOf(challenge);
  const previousSolved = challenges.slice(0, index).every((c) => isSolved(state, c.id));
  return previousSolved ? 'available' : 'locked';
}

export const getCurrentChallenge = (state) =>
  challenges.find((challenge) => !isSolved(state, challenge.id)) ?? null;

export const getChallengeScore = (state, challenge) =>
  isSolved(state, challenge.id) ? getProgress(state, challenge.id).score ?? 0 : 0;

export const isClockRunning = (state) =>
  Object.values(state.progress).some((entry) => entry.resumedAt);

// Mission time in seconds: the time spent inside challenges, added up. Time on
// the map, the ranking or any other page does not count. It is derived from the
// persisted state, never from a counter. Returns null before the mission starts.
export function getMissionSeconds(state, now = Date.now()) {
  if (!state.startedAt) return null;
  // The server's measurement wins once the mission is over and it is known
  if (state.finishedAt && state.result) return state.result.totalSeconds;

  const total = Object.values(state.progress).reduce(
    (sum, entry) =>
      sum + (entry.solvedAt && entry.seconds !== null ? entry.seconds * 1000 : activeTime(entry, now)),
    0,
  );
  return Math.floor(total / 1000);
}

export function getSummary(state) {
  const entries = challenges.map((c) => getProgress(state, c.id));
  const solvedCount = entries.filter((p) => p.solvedAt).length;
  const isComplete = solvedCount === challenges.length;
  return {
    solvedCount,
    total: challenges.length,
    score: challenges.reduce((sum, c) => sum + getChallengeScore(state, c), 0),
    maxScore: TOTAL_POINTS,
    hintsUsed: entries.filter((p) => p.hintUsed).length,
    errors: entries.reduce((sum, p) => sum + p.wrong, 0),
    totalSeconds: isComplete ? getMissionSeconds(state) : null,
    isComplete,
    hasStarted: Boolean(state.startedAt) || solvedCount > 0,
  };
}

// Completion titles — "mestre do CTF" (CTF master) comes from the original project proposal
const RANKS = [
  { min: 0.9, title: 'Mestre do CTF' },
  { min: 0.7, title: 'Especialista' },
  { min: 0.45, title: 'Investigador(a)' },
  { min: 0, title: 'Recruta de elite' },
];

export function getRank(score, maxScore = TOTAL_POINTS) {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  return RANKS.find((rank) => ratio >= rank.min);
}
