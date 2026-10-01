// Generates the hash of an answer to put in `answerHash` in the challenge config.
// Usage: npm run hash-flag -- <challenge-id> <answer>
// E.g.:  npm run hash-flag -- gallery gogh
import { hashAnswer, normalizeAnswer } from '../src/utils/answers.js';

const [challengeId, ...answerParts] = process.argv.slice(2);

if (!challengeId || answerParts.length === 0) {
  console.error('Usage: npm run hash-flag -- <challenge-id> <answer>');
  process.exit(1);
}

const normalized = normalizeAnswer(answerParts.join(' '));
console.log(`challenge:  ${challengeId}`);
console.log(`normalized: ${normalized}`);
console.log(`answerHash: '${hashAnswer(challengeId, normalized)}'`);
