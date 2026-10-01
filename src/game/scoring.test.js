import { challenges, TOTAL_POINTS } from '../challenges';
import { computeScore, SCORING } from './scoring';

const challenge = { points: 200, fastSeconds: 120, slowSeconds: 600 };
const clean = { seconds: 0, wrong: 0, hintUsed: false };

describe('computeScore', () => {
  it('adds up to 1000 points across the mission', () => {
    expect(TOTAL_POINTS).toBe(1000);
    const perfect = challenges.reduce((sum, c) => sum + computeScore(c, clean), 0);
    expect(perfect).toBe(1000);
  });

  it('gives the full speed bonus up to the fast time and none after the slow time', () => {
    expect(computeScore(challenge, clean)).toBe(200);
    expect(computeScore(challenge, { ...clean, seconds: 120 })).toBe(200);
    expect(computeScore(challenge, { ...clean, seconds: 600 })).toBe(140);
    expect(computeScore(challenge, { ...clean, seconds: 99999 })).toBe(140);
  });

  it('decays the bonus gradually, so a few seconds barely matter', () => {
    expect(computeScore(challenge, { ...clean, seconds: 360 })).toBe(170);
    const a = computeScore(challenge, { ...clean, seconds: 300 });
    const b = computeScore(challenge, { ...clean, seconds: 305 });
    expect(a - b).toBeLessThanOrEqual(1);
    expect(a).toBeGreaterThanOrEqual(b);
  });

  it('charges each wrong answer up to a limit', () => {
    expect(computeScore(challenge, { ...clean, wrong: 3 })).toBe(170);
    const capped = 200 - SCORING.maxChargedWrong * SCORING.wrongPenalty;
    expect(computeScore(challenge, { ...clean, wrong: 5 })).toBe(capped);
    expect(computeScore(challenge, { ...clean, wrong: 500 })).toBe(capped);
  });

  it('charges the hint once', () => {
    expect(computeScore(challenge, { ...clean, hintUsed: true })).toBe(200 - SCORING.hintPenalty);
  });

  it('matches the example: base 140, 3 errors, hint, bonus 40', () => {
    // 600 → 120 s spans 60 bonus points, so 280 s leaves 40
    expect(computeScore(challenge, { seconds: 280, wrong: 3, hintUsed: true })).toBe(140 + 40 - 30 - 25);
  });

  it('never goes below zero nor above the challenge maximum', () => {
    const small = { points: 100, fastSeconds: 60, slowSeconds: 300 };
    expect(computeScore(small, { seconds: 9999, wrong: 50, hintUsed: true })).toBe(0);
    expect(computeScore(small, { seconds: -500, wrong: -9, hintUsed: false })).toBe(100);
  });

  it.each(challenges.map((c) => [c.id, c]))('%s has a valid time window', (id, c) => {
    expect(c.fastSeconds).toBeGreaterThan(0);
    expect(c.slowSeconds).toBeGreaterThan(c.fastSeconds);
  });
});
