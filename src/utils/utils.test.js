import { createHash } from 'crypto';
import { evaluateAnswer, hashAnswer, normalizeAnswer } from './answers';
import { caesar, vigenere } from './cipher';
import { formatDuration } from './format';
import { sha256 } from './sha256';

describe('sha256', () => {
  it.each(['', 'abc', 'começar', 'x'.repeat(55), 'y'.repeat(64), 'z'.repeat(1000), '🚩 flag'])(
    'coincide com o crypto do Node para %p',
    (input) => {
      expect(sha256(input)).toBe(createHash('sha256').update(input, 'utf8').digest('hex'));
    },
  );
});

describe('normalizeAnswer', () => {
  it.each([
    ['  GOGH ', 'gogh'],
    ['Começar', 'comecar'],
    ['casaviva{Começar}', 'comecar'],
    ['CASAVIVA{ ultimato }', 'ultimato'],
    ['g o g h', 'gogh'],
    ['casaviva{}', ''],
    [undefined, ''],
  ])('%p → %p', (input, expected) => {
    expect(normalizeAnswer(input)).toBe(expected);
  });
});

describe('evaluateAnswer', () => {
  const challenge = {
    id: 'teste',
    answerHash: hashAnswer('teste', 'segredo'),
    nearMisses: [{ hashes: [hashAnswer('teste', 'quase')], message: 'Quase!' }],
  };

  it('reconhece a resposta correta com variações de formato', () => {
    expect(evaluateAnswer(challenge, 'casaviva{SEGREDO}').status).toBe('correct');
  });

  it('retorna mensagem contextual para quase-acertos', () => {
    expect(evaluateAnswer(challenge, 'Quase')).toEqual({ status: 'incorrect', message: 'Quase!' });
  });

  it('trata resposta vazia separadamente', () => {
    expect(evaluateAnswer(challenge, '   ').status).toBe('empty');
  });

  it('usa o id do desafio como sal', () => {
    expect(hashAnswer('a', 'x')).not.toBe(hashAnswer('b', 'x'));
  });
});

describe('cifras', () => {
  it('César com deslocamento 3 é reversível e preserva maiúsculas', () => {
    expect(caesar('Ultimato', 3)).toBe('Xowlpdwr');
    expect(caesar('xowlpdwr', -3)).toBe('ultimato');
  });

  it('Vigenère cifra e decifra com a mesma chave', () => {
    const encrypted = vigenere('CONQUISTA', 'GOGH');
    expect(vigenere(encrypted, 'GOGH', -1)).toBe('CONQUISTA');
  });
});

describe('formatDuration', () => {
  it.each([
    [42_000, '42 s'],
    [125_000, '2 min 05 s'],
    [3_780_000, '1 h 3 min'],
    [null, '—'],
  ])('%p → %p', (ms, expected) => {
    expect(formatDuration(ms)).toBe(expected);
  });
});
