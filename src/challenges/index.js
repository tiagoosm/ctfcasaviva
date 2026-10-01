import briefing from './briefing';
import gallery from './gallery';
import sequence from './sequence';
import interception from './interception';
import vault from './vault';

// Mission order. To add a challenge: create its folder with config + Stage
// and include it here. Progress, map, scoring and routes adapt on their own.
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
