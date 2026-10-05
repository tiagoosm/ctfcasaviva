import { createHash } from 'crypto';
import { evaluateAnswer, hashAnswer, normalizeAnswer } from './answers';
import { formatClock, formatDuration } from './format';
import { sha256 } from './sha256';

describe('sha256', () => {
  it.each(['', 'abc', 'começar', 'x'.repeat(55), 'y'.repeat(64), 'z'.repeat(1000), '🚩 flag'])(
    'matches Node crypto for %p',
    (input) => {
      expect(sha256(input)).toBe(createHash('sha256').update(input, 'utf8').digest('hex'));
    },
  );
});

describe('normalizeAnswer', () => {
  it.each([
    ['  GOGH ', 'gogh'],
    ['Começar', 'comecar'],
    [' Ultimato\n', 'ultimato'],
    ['g o g h', 'gogh'],
    ['   ', ''],
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

  it('recognizes the correct answer across format variations', () => {
    expect(evaluateAnswer(challenge, '  SEGREDO ').status).toBe('correct');
  });

  it('returns a contextual message for near misses', () => {
    expect(evaluateAnswer(challenge, 'Quase')).toEqual({ status: 'incorrect', message: 'Quase!' });
  });

  it('handles an empty answer separately', () => {
    expect(evaluateAnswer(challenge, '   ').status).toBe('empty');
  });

  it('uses the challenge id as salt', () => {
    expect(hashAnswer('a', 'x')).not.toBe(hashAnswer('b', 'x'));
  });
});

describe('formatClock', () => {
  it.each([
    [0, '00:00'],
    [75, '01:15'],
    [3725, '1:02:05'],
    [-4, '00:00'],
  ])('%p → %p', (seconds, expected) => {
    expect(formatClock(seconds)).toBe(expected);
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
