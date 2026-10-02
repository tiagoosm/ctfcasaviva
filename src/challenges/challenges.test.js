import { evaluateAnswer } from '../utils/answers';
import { SCORING } from '../game/scoring';
import { challenges, getChallengeBySlug, TOTAL_POINTS } from '.';
import transmission from './interception/transmission';

// Solutions live only in the tests (outside the production bundle)
const SOLUTIONS = {
  briefing: 'começar',
  gallery: 'gogh',
  sequence: 'w-q-r-t-m-k',
  interception: 'ultimato',
};

describe('challenge registry', () => {
  it('has unique ids and slugs', () => {
    expect(new Set(challenges.map((c) => c.id)).size).toBe(challenges.length);
    expect(new Set(challenges.map((c) => c.slug)).size).toBe(challenges.length);
  });

  it.each(challenges.map((c) => [c.id, c]))('%s is fully configured', (id, challenge) => {
    expect(challenge.Stage).toEqual(expect.any(Function));
    // A challenge checked by the server alone must not ship a hash of its answer
    if (challenge.serverOnly) expect(challenge.answerHash).toBeUndefined();
    else expect(challenge.answerHash).toMatch(/^[0-9a-f]{64}$/);
    expect(['flag', 'interactive']).toContain(challenge.answerMode);
    // A single hint per challenge, which must never be worth the whole challenge
    expect(challenge.hints).toBeUndefined();
    expect(challenge.hint.text).toBeTruthy();
    expect(challenge.hint.cost).toBeUndefined();
    expect(challenge.points).toBeGreaterThan(SCORING.hintPenalty);
    expect(getChallengeBySlug(challenge.slug)).toBe(challenge);
  });

  it.each(Object.entries(SOLUTIONS))('%s accepts the expected solution', (id, solution) => {
    const challenge = challenges.find((c) => c.id === id);
    expect(evaluateAnswer(challenge, solution).status).toBe('correct');
  });

  it('does not accept the answer of one challenge in another', () => {
    const gallery = challenges.find((c) => c.id === 'gallery');
    expect(evaluateAnswer(gallery, SOLUTIONS.interception).status).toBe('incorrect');
  });

  it('never decreases in points along the mission', () => {
    const levels = challenges.map((c) => c.points);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it('adds up the maximum score correctly', () => {
    expect(TOTAL_POINTS).toBe(1000);
  });

  it('never accepts a vault combination on the client', () => {
    const vault = challenges.find((c) => c.id === 'vault');
    expect(vault.serverOnly).toBe(true);
    for (let code = 0; code < 10000; code += 1) {
      const guess = String(code).padStart(vault.codeLength, '0');
      if (evaluateAnswer(vault, guess).status === 'correct') throw new Error(`accepted ${guess}`);
    }
  });

  it('has a transmission with exactly one encrypted word and no duplicated paragraph', () => {
    const text = transmission.join(' ');
    expect(text.match(/xowlpdwr/g)).toHaveLength(1);
    expect(new Set(transmission).size).toBe(transmission.length);
  });
});
