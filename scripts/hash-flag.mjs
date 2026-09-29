// Gera o hash de uma resposta para colocar em `answerHash` na configuração do desafio.
// Uso: npm run hash-flag -- <id-do-desafio> <resposta>
// Ex.:  npm run hash-flag -- gallery gogh
import { hashAnswer, normalizeAnswer } from '../src/utils/answers.js';

const [challengeId, ...answerParts] = process.argv.slice(2);

if (!challengeId || answerParts.length === 0) {
  console.error('Uso: npm run hash-flag -- <id-do-desafio> <resposta>');
  process.exit(1);
}

const normalized = normalizeAnswer(answerParts.join(' '));
console.log(`desafio:    ${challengeId}`);
console.log(`normalizada: ${normalized}`);
console.log(`answerHash: '${hashAnswer(challengeId, normalized)}'`);
