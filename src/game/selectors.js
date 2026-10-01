import { challenges, TOTAL_POINTS } from '../challenges';
import { emptyProgress } from './gameReducer';

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
    // Sum of the time spent inside each challenge, not wall-clock time
    totalSeconds: isComplete ? entries.reduce((sum, p) => sum + (p.seconds ?? 0), 0) : null,
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
