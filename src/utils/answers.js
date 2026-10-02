import { sha256 } from './sha256.js';

// Makes validation tolerant of variations that do not change the answer:
// casing, accents and spaces.
export function normalizeAnswer(raw) {
  return String(raw ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '');
}

// The challenge id acts as a "salt": the same word yields different hashes
// in different challenges, and answers are not stored in plain text in the bundle.
export function hashAnswer(challengeId, normalizedAnswer) {
  return sha256(`${challengeId}:${normalizedAnswer}`);
}

export function evaluateAnswer(challenge, rawAnswer) {
  const answer = normalizeAnswer(rawAnswer);
  if (!answer) return { status: 'empty' };

  // Challenges checked by the server alone ship no hash: nothing to compare here
  const hash = hashAnswer(challenge.id, answer);
  if (challenge.answerHash && hash === challenge.answerHash) return { status: 'correct' };

  // Near misses are hashed too, so answers from other stages do not leak
  const nearMiss = challenge.nearMisses?.find((rule) => rule.hashes.includes(hash));
  return { status: 'incorrect', message: nearMiss?.message };
}
