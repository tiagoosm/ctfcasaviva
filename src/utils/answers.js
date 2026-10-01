import { sha256 } from './sha256.js';

export const FLAG_PREFIX = 'casaviva';

// Makes validation tolerant of variations that do not change the answer:
// casing, accents, spaces and the optional casaviva{...} wrapper.
export function normalizeAnswer(raw) {
  let value = String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

  const wrapped = value.match(new RegExp(`^${FLAG_PREFIX}\\s*\\{(.*)\\}$`));
  if (wrapped) value = wrapped[1];

  return value.replace(/\s+/g, '');
}

// The challenge id acts as a "salt": the same word yields different hashes
// in different challenges, and answers are not stored in plain text in the bundle.
export function hashAnswer(challengeId, normalizedAnswer) {
  return sha256(`${challengeId}:${normalizedAnswer}`);
}

export function evaluateAnswer(challenge, rawAnswer) {
  const answer = normalizeAnswer(rawAnswer);
  if (!answer) return { status: 'empty' };

  const hash = hashAnswer(challenge.id, answer);
  if (hash === challenge.answerHash) return { status: 'correct' };

  // Near misses are hashed too, so answers from other stages do not leak
  const nearMiss = challenge.nearMisses?.find((rule) => rule.hashes.includes(hash));
  return { status: 'incorrect', message: nearMiss?.message };
}
