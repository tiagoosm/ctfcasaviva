import { sha256 } from './sha256.js';

export const FLAG_PREFIX = 'casaviva';

// Deixa a validação tolerante a variações que não mudam a resposta:
// maiúsculas, acentos, espaços e o invólucro opcional casaviva{...}.
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

// O id do desafio funciona como "sal": a mesma palavra gera hashes diferentes
// em desafios diferentes, e as respostas não ficam em texto puro no bundle.
export function hashAnswer(challengeId, normalizedAnswer) {
  return sha256(`${challengeId}:${normalizedAnswer}`);
}

export function evaluateAnswer(challenge, rawAnswer) {
  const answer = normalizeAnswer(rawAnswer);
  if (!answer) return { status: 'empty' };

  const hash = hashAnswer(challenge.id, answer);
  if (hash === challenge.answerHash) return { status: 'correct' };

  // Quase-acertos também ficam em hash, para não vazar respostas de outras fases
  const nearMiss = challenge.nearMisses?.find((rule) => rule.hashes.includes(hash));
  return { status: 'incorrect', message: nearMiss?.message };
}
