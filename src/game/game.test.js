import { challenges, TOTAL_POINTS } from '../challenges';
import { CODENAME_MAX_LENGTH, createInitialState, gameReducer } from './gameReducer';
import { SCORING } from './scoring';
import {
  getChallengeScore,
  getCurrentChallenge,
  getProgress,
  getRank,
  getStatus,
  getSummary,
  hasProgress,
  isRegistered,
} from './selectors';
import { parseState } from './storage';

const [first, second] = challenges;

const enter = (state, challenge, now) => gameReducer(state, { type: 'ENTER', id: challenge.id, now });
const solve = (state, challenge, now = 1000, completesMission = false) =>
  gameReducer(state, { type: 'SOLVE', challenge, now, completesMission });

describe('gameReducer + selectors', () => {
  it('unlocks challenges in sequence', () => {
    let state = createInitialState();
    expect(getStatus(state, first)).toBe('available');
    expect(getStatus(state, second)).toBe('locked');

    state = solve(state, first);
    expect(getStatus(state, first)).toBe('solved');
    expect(getStatus(state, second)).toBe('available');
    expect(getCurrentChallenge(state)).toBe(second);
  });

  it('gives the full score for a fast, clean solve', () => {
    let state = enter(createInitialState(), first, 1000);
    state = solve(state, first, 1000 + first.fastSeconds * 1000);
    expect(getChallengeScore(state, first)).toBe(first.points);
    expect(getProgress(state, first.id).seconds).toBe(first.fastSeconds);
  });

  it('charges wrong answers and the hint', () => {
    let state = enter(createInitialState(), first, 1000);
    state = gameReducer(state, { type: 'WRONG', id: first.id });
    state = gameReducer(state, { type: 'WRONG', id: first.id });
    state = gameReducer(state, { type: 'REVEAL_HINT', id: first.id });
    state = solve(state, first, 2000);

    expect(getChallengeScore(state, first)).toBe(
      first.points - 2 * SCORING.wrongPenalty - SCORING.hintPenalty,
    );
    expect(getSummary(state).errors).toBe(2);
    expect(getSummary(state).hintsUsed).toBe(1);
  });

  it('starts the clock on the first visit only', () => {
    let state = enter(createInitialState(), first, 1000);
    // Reloading or coming back later must not restart it
    state = enter(state, first, 500000);
    state = solve(state, first, 1000 + first.slowSeconds * 1000);
    expect(getProgress(state, first.id).seconds).toBe(first.slowSeconds);
    expect(getChallengeScore(state, first)).toBe(Math.round(first.points * SCORING.baseShare));
  });

  it('reveals a single hint per challenge, and none after solving', () => {
    let state = createInitialState();
    for (let i = 0; i < 5; i++) {
      state = gameReducer(state, { type: 'REVEAL_HINT', id: first.id });
    }
    expect(getSummary(state).hintsUsed).toBe(1);

    let solved = solve(createInitialState(), first);
    solved = gameReducer(solved, { type: 'REVEAL_HINT', id: first.id });
    solved = gameReducer(solved, { type: 'WRONG', id: first.id });
    expect(getProgress(solved, first.id).hintUsed).toBe(false);
    expect(getProgress(solved, first.id).wrong).toBe(0);
  });

  it('keeps the original result when solved twice', () => {
    let state = solve(createInitialState(), first, 1000);
    state = solve(state, first, 5000);
    expect(getProgress(state, first.id).solvedAt).toBe(1000);
  });

  it('replaces the local estimate with the score confirmed by the server', () => {
    let state = solve(createInitialState(), first);
    state = gameReducer(state, { type: 'SERVER_SCORE', id: first.id, score: 42, seconds: 77 });
    expect(getChallengeScore(state, first)).toBe(42);
    expect(getProgress(state, first.id).seconds).toBe(77);

    // A challenge that was not solved locally cannot receive a score
    state = gameReducer(state, { type: 'SERVER_SCORE', id: second.id, score: 999, seconds: 1 });
    expect(getChallengeScore(state, second)).toBe(0);
  });

  it('adds up the time spent inside each challenge', () => {
    let state = createInitialState();
    let clock = 0;
    challenges.forEach((challenge, index) => {
      state = enter(state, challenge, clock);
      clock += 10000;
      state = solve(state, challenge, clock, index === challenges.length - 1);
      // Time between challenges does not count
      clock += 60000;
    });
    const summary = getSummary(state);
    expect(summary.isComplete).toBe(true);
    expect(summary.totalSeconds).toBe(10 * challenges.length);
    expect(summary.score).toBe(TOTAL_POINTS);
    expect(state.finishedAt).toBeTruthy();
  });

  it('records name and class when the mission starts', () => {
    const state = gameReducer(createInitialState(), {
      type: 'START',
      codename: '  Agente   X ',
      group: ' b3 ',
      now: 100,
    });
    expect(state.codename).toBe('Agente X');
    expect(state.group).toBe('B3');
    expect(state.startedAt).toBe(100);
  });

  it('clears progress and the server run but keeps name and class on restart', () => {
    let state = gameReducer(createInitialState(), { type: 'START', codename: 'Coruja', group: 'A1', now: 1 });
    state = gameReducer(state, { type: 'SET_RUN', runId: 'abc' });
    state = solve(state, first);
    state = gameReducer(state, { type: 'RESET' });
    expect(state).toEqual(createInitialState('Coruja', 'A1'));
  });

  it('forgets the player and all progress when leaving', () => {
    let state = gameReducer(createInitialState(), { type: 'START', codename: 'Coruja', group: 'A1', now: 1 });
    state = gameReducer(state, { type: 'SET_RUN', runId: 'abc' });
    state = solve(state, first);
    state = gameReducer(state, { type: 'SIGN_OUT' });
    expect(state).toEqual(createInitialState());
  });

  it('accepts only the known classes', () => {
    const start = (group) =>
      gameReducer(createInitialState(), { type: 'START', codename: 'Coruja', group, now: 1 });
    expect(start('A4').group).toBe('A4');
    expect(start('C1').group).toBe('');
    expect(start('2º Info').group).toBe('');
    expect(isRegistered(start('Turma inventada'))).toBe(false);
  });

  it('requires both name and class to be registered', () => {
    expect(isRegistered(createInitialState())).toBe(false);
    expect(isRegistered(createInitialState('Coruja'))).toBe(false);
    expect(isRegistered(createInitialState('Coruja', 'A1'))).toBe(true);
  });

  it('does not treat a visit as progress', () => {
    let state = enter(createInitialState(), first, 1);
    expect(hasProgress(state)).toBe(false);
    state = gameReducer(state, { type: 'WRONG', id: first.id });
    expect(hasProgress(state)).toBe(true);
  });

  it('assigns the title according to performance', () => {
    expect(getRank(1000).title).toBe('Mestre do CTF');
    expect(getRank(750).title).toBe('Especialista');
    expect(getRank(100).title).toBe('Recruta de elite');
  });
});

describe('parseState', () => {
  it('discards corrupted data or data from another version', () => {
    expect(parseState('{nao é json')).toBeNull();
    expect(parseState(JSON.stringify({ version: 2, progress: {} }))).toBeNull();
  });

  it('sanitizes invalid values', () => {
    const parsed = parseState(
      JSON.stringify({
        version: 3,
        codename: 'x'.repeat(100),
        startedAt: 'ontem',
        runId: 'not-a-uuid',
        result: { place: -1, score: 'muito' },
        progress: {
          briefing: { enteredAt: 5, solvedAt: 10, wrong: -3, hintUsed: 'sim', seconds: 1.5, score: 80 },
          lixo: null,
        },
      }),
    );
    expect(parsed.codename).toHaveLength(CODENAME_MAX_LENGTH);
    expect(parsed.group).toBe('');
    expect(parsed.startedAt).toBeNull();
    expect(parsed.runId).toBeNull();
    expect(parsed.result).toEqual({ place: null, score: 0, totalSeconds: 0, errors: 0, hints: 0 });
    expect(parsed.progress).toEqual({
      briefing: { enteredAt: 5, solvedAt: 10, wrong: 0, hintUsed: false, seconds: null, score: 80 },
    });
  });
});
