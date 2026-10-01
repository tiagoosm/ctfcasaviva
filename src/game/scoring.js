// Scoring rules. The server applies the same formula (ctf_score in
// supabase/migrations) and its result is the one that counts for the ranking;
// this copy gives instant feedback and keeps the game playable offline.
export const SCORING = {
  // Share of a challenge earned just by solving it; the rest is the speed bonus
  baseShare: 0.7,
  wrongPenalty: 10,
  // Wrong answers beyond this are not charged, so a bad streak never ruins a run
  maxChargedWrong: 5,
  hintPenalty: 25,
};

// The speed bonus is full up to `fastSeconds` and decays linearly to zero at
// `slowSeconds`, so a few seconds never change the score by more than a point.
export function computeScore(challenge, { seconds, wrong, hintUsed }) {
  const { points, fastSeconds, slowSeconds } = challenge;
  const base = Math.round(points * SCORING.baseShare);
  const maxBonus = points - base;

  let bonus = 0;
  if (seconds <= fastSeconds) bonus = maxBonus;
  else if (seconds < slowSeconds) {
    bonus = Math.round((maxBonus * (slowSeconds - seconds)) / (slowSeconds - fastSeconds));
  }

  const wrongPenalty = Math.min(Math.max(wrong, 0), SCORING.maxChargedWrong) * SCORING.wrongPenalty;
  const hintPenalty = hintUsed ? SCORING.hintPenalty : 0;

  return Math.max(0, base + bonus - wrongPenalty - hintPenalty);
}
