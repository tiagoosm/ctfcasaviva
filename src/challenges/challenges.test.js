import { evaluateAnswer } from '../utils/answers';
import { vigenere } from '../utils/cipher';
import { challenges, getChallengeBySlug, TOTAL_POINTS } from '.';
import transmission from './interception/transmission';

// Solutions live only in the tests (outside the production bundle)
const SOLUTIONS = {
  briefing: 'começar',
  gallery: 'gogh',
  sequence: 'w-q-r-t-m-k',
  interception: 'ultimato',
  vault: 'conquista',
};

describe('challenge registry', () => {
  it('has unique ids and slugs', () => {
    expect(new Set(challenges.map((c) => c.id)).size).toBe(challenges.length);
    expect(new Set(challenges.map((c) => c.slug)).size).toBe(challenges.length);
  });

  it.each(challenges.map((c) => [c.id, c]))('%s is fully configured', (id, challenge) => {
    expect(challenge.Stage).toEqual(expect.any(Function));
    expect(challenge.answerHash).toMatch(/^[0-9a-f]{64}$/);
    expect(['flag', 'interactive']).toContain(challenge.answerMode);
    expect(challenge.hints.length).toBeGreaterThan(0);
    expect(challenge.success.lesson).toBeTruthy();
    // Hints must never bring a challenge down to zero (or negative) points
    const totalCost = challenge.hints.reduce((sum, hint) => sum + hint.cost, 0);
    expect(totalCost).toBeLessThan(challenge.points);
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
    expect(TOTAL_POINTS).toBe(800);
  });

  it('has the vault hold the final flag encrypted with the Gallery key', () => {
    const vault = challenges.find((c) => c.id === 'vault');
    expect(vigenere(vault.ciphertext, SOLUTIONS.gallery.toUpperCase(), -1)).toBe(
      SOLUTIONS.vault.toUpperCase(),
    );
    expect(vault.keyLength).toBe(SOLUTIONS.gallery.length);
  });

  it('has a transmission with exactly one encrypted word and no duplicated paragraph', () => {
    const text = transmission.join(' ');
    expect(text.match(/xowlpdwr/g)).toHaveLength(1);
    expect(new Set(transmission).size).toBe(transmission.length);
  });
});
