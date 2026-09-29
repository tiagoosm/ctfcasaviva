import briefing from './briefing';
import gallery from './gallery';
import sequence from './sequence';
import interception from './interception';
import vault from './vault';

// Ordem da missão. Para adicionar um desafio: crie a pasta com config + Stage
// e inclua-o aqui. Progresso, mapa, pontuação e rotas se ajustam sozinhos.
export const challenges = [briefing, gallery, sequence, interception, vault];

export const TOTAL_POINTS = challenges.reduce((sum, challenge) => sum + challenge.points, 0);

export function getChallengeBySlug(slug) {
  return challenges.find((challenge) => challenge.slug === slug) ?? null;
}

export function getChallengeIndex(id) {
  return challenges.findIndex((challenge) => challenge.id === id);
}

export function getNextChallenge(id) {
  return challenges[getChallengeIndex(id) + 1] ?? null;
}

export function challengePath(challenge) {
  return `/missao/${challenge.slug}`;
}
