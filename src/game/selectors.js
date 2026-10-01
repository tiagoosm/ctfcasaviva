import { challenges, TOTAL_POINTS } from '../challenges';
import { emptyProgress } from './gameReducer';

export const getProgress = (state, id) => state.progress[id] ?? emptyProgress;

export const isSolved = (state, id) => Boolean(getProgress(state, id).solvedAt);

// A challenge only unlocks once all the previous ones are solved
export function getStatus(state, challenge) {
  if (isSolved(state, challenge.id)) return 'solved';
  const index = challenges.indexOf(challenge);
  const previousSolved = challenges.slice(0, index).every((c) => isSolved(state, c.id));
  return previousSolved ? 'available' : 'locked';
}

export const getCurrentChallenge = (state) =>
  challenges.find((challenge) => !isSolved(state, challenge.id)) ?? null;

export const getHintPenalty = (state, challenge) =>
  challenge.hints
    .slice(0, getProgress(state, challenge.id).hintsRevealed)
    .reduce((sum, hint) => sum + hint.cost, 0);

export function getChallengeScore(state, challenge) {
  if (!isSolved(state, challenge.id)) return 0;
  return Math.max(0, challenge.points - getHintPenalty(state, challenge));
}

export function getSummary(state) {
  const solvedCount = challenges.filter((c) => isSolved(state, c.id)).length;
  return {
    solvedCount,
    total: challenges.length,
    score: challenges.reduce((sum, c) => sum + getChallengeScore(state, c), 0),
    maxScore: TOTAL_POINTS,
    hintsUsed: challenges.reduce((sum, c) => sum + getProgress(state, c.id).hintsRevealed, 0),
    attempts: challenges.reduce((sum, c) => sum + getProgress(state, c.id).attempts, 0),
    isComplete: solvedCount === challenges.length,
    hasStarted: Boolean(state.startedAt) || solvedCount > 0,
    duration: state.finishedAt && state.startedAt ? state.finishedAt - state.startedAt : null,
  };
}

// Completion titles — "mestre do CTF" (CTF master) comes from the original project proposal
const RANKS = [
  { min: 0.9, title: 'Mestre do CTF', description: 'Precisão de especialista, quase sem ajuda.' },
  { min: 0.7, title: 'Especialista', description: 'Raciocínio afiado e bom uso das pistas.' },
  { min: 0.45, title: 'Investigador(a)', description: 'Persistência que levou até o fim.' },
  { min: 0, title: 'Recruta de elite', description: 'Missão cumprida — e muito aprendido no caminho.' },
];

export function getRank(score, maxScore = TOTAL_POINTS) {
  const ratio = maxScore > 0 ? score / maxScore : 0;
  return RANKS.find((rank) => ratio >= rank.min);
}
