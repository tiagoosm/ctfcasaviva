import briefing from './briefing';
import gallery from './gallery';
import sequence from './sequence';
import interception from './interception';
import vault from './vault';

// Display order. To add a challenge: create its folder with config + Stage
// and include it here. Progress, map, scoring and routes adapt on their own.
export const challenges = [briefing, gallery, sequence, interception, vault];

// Progression: a challenge unlocks once every challenge of an earlier tier is
// solved. Challenges of the same tier can be played in any order. The server
// applies the same rule (`tier` in ctf_challenges).
export const TIERS = { briefing: 1, gallery: 2, sequence: 2, interception: 2, vault: 3 };

export const getTier = (challenge) => TIERS[challenge.id];

// Challenges that must be solved before this one opens
export const getRequirements = (challenge) =>
  challenges.filter((other) => getTier(other) < getTier(challenge));

// The challenges grouped by tier, in order: [[briefing], [gallery, …], [vault]]
export const tiers = [...new Set(challenges.map(getTier))]
  .sort((a, b) => a - b)
  .map((tier) => challenges.filter((challenge) => getTier(challenge) === tier));

export const TOTAL_POINTS = challenges.reduce((sum, challenge) => sum + challenge.points, 0);

export function getChallengeBySlug(slug) {
  return challenges.find((challenge) => challenge.slug === slug) ?? null;
}

export function challengePath(challenge) {
  return `/missao/${challenge.slug}`;
}
