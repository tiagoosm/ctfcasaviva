import { challenges, TOTAL_POINTS } from '../challenges';
import { CODENAME_MAX_LENGTH, createInitialState, gameReducer } from './gameReducer';
import { SCORING } from './scoring';
import {
  getChallengeScore,
  getCurrentChallenge,
  getMissionSeconds,
  getProgress,
  getRank,
  getStatus,
  getSummary,
  hasProgress,
  isClockRunning,
  isRegistered,
} from './selectors';
import { parseState } from './storage';

const [first, second] = challenges;

const start = (now = 1000) =>
  gameReducer(createInitialState(), { type: 'START', codename: 'Coruja', group: 'A1', now });
const enter = (state, challenge, now) => gameReducer(state, { type: 'ENTER', id: challenge.id, now });
const leave = (state, challenge, now) => gameReducer(state, { type: 'LEAVE', id: challenge.id, now });
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

  it('accepts only the known classes', () => {
    const withGroup = (group) =>
      gameReducer(createInitialState(), { type: 'START', codename: 'Coruja', group, now: 1 });
    expect(withGroup('A4').group).toBe('A4');
    expect(withGroup('C1').group).toBe('');
    expect(withGroup('2º Info').group).toBe('');
    expect(isRegistered(withGroup('Turma inventada'))).toBe(false);
  });

  it('clears progress and the server run but keeps name and class on restart', () => {
    let state = gameReducer(start(), { type: 'SET_RUN', runId: 'abc' });
    state = solve(state, first);
    state = gameReducer(state, { type: 'RESET' });
    expect(state).toEqual(createInitialState('Coruja', 'A1'));
  });

  it('forgets the player and all progress when leaving', () => {
    let state = gameReducer(start(), { type: 'SET_RUN', runId: 'abc' });
    state = solve(state, first);
    state = gameReducer(state, { type: 'SIGN_OUT' });
    expect(state).toEqual(createInitialState());
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

describe('mission clock', () => {
  it('does not exist before the mission starts and waits at zero until a challenge is opened', () => {
    expect(getMissionSeconds(createInitialState(), 5000)).toBeNull();
    const state = start(1000);
    expect(isClockRunning(state)).toBe(false);
    // Reading the landing page, the map or the ranking costs no time
    expect(getMissionSeconds(state, 600000)).toBe(0);
  });

  it('only counts the time spent inside a challenge', () => {
    let state = enter(start(1000), first, 10000);
    expect(isClockRunning(state)).toBe(true);
    expect(getMissionSeconds(state, 40000)).toBe(30);

    // Away for ten minutes on the map or ranking: the clock is paused
    state = leave(state, first, 40000);
    expect(isClockRunning(state)).toBe(false);
    expect(getMissionSeconds(state, 640000)).toBe(30);

    // Back in the challenge, it resumes from where it stopped
    state = enter(state, first, 640000);
    expect(getMissionSeconds(state, 655000)).toBe(45);
  });

  it('cannot be restarted by entering again nor shortened by leaving twice', () => {
    let state = enter(start(1000), first, 10000);
    state = enter(state, first, 500000);
    expect(getMissionSeconds(state, 20000)).toBe(10);

    state = leave(state, first, 20000);
    state = leave(state, first, 900000);
    expect(getMissionSeconds(state, 900000)).toBe(10);
  });

  it('uses the active time of a challenge for its speed bonus', () => {
    // A slow wall-clock solve that was mostly spent away still earns the full bonus…
    let state = enter(start(1000), first, 1000);
    state = leave(state, first, 11000);
    state = enter(state, first, 11000 + first.slowSeconds * 1000);
    state = solve(state, first, 21000 + first.slowSeconds * 1000);
    expect(getProgress(state, first.id).seconds).toBe(20);
    expect(getChallengeScore(state, first)).toBe(first.points);

    // …while staying inside past the slow time earns none
    let slow = enter(start(1000), first, 1000);
    slow = solve(slow, first, 1000 + first.slowSeconds * 1000);
    expect(getChallengeScore(slow, first)).toBe(Math.round(first.points * SCORING.baseShare));
  });

  it('pauses everything that is running when the page goes away', () => {
    let state = enter(start(1000), first, 1000);
    state = gameReducer(state, { type: 'PAUSE_ALL', now: 31000 });
    expect(isClockRunning(state)).toBe(false);
    expect(getMissionSeconds(state, 999999)).toBe(30);
  });

  it('adds up the challenges and freezes when the mission is over', () => {
    let state = start(1000);
    let clock = 1000;
    challenges.forEach((challenge, index) => {
      // A minute between challenges, which does not count
      clock += 60000;
      state = enter(state, challenge, clock);
      clock += 10000;
      state = solve(state, challenge, clock, index === challenges.length - 1);
    });

    const summary = getSummary(state);
    expect(summary.isComplete).toBe(true);
    expect(summary.totalSeconds).toBe(10 * challenges.length);
    expect(summary.score).toBe(TOTAL_POINTS);
    expect(state.finishedAt).toBe(clock);
    expect(isClockRunning(state)).toBe(false);
    expect(getMissionSeconds(state, clock + 999999)).toBe(10 * challenges.length);
  });

  it('shows the total confirmed by the server once the mission is over', () => {
    let state = enter(start(1000), first, 1000);
    state = solve(state, first, 91000, true);
    expect(getMissionSeconds(state)).toBe(90);
    state = gameReducer(state, {
      type: 'RESULT',
      result: { place: 1, score: 100, totalSeconds: 93, errors: 0, hints: 0 },
    });
    expect(getMissionSeconds(state)).toBe(93);
  });
});

describe('parseState', () => {
  it('discards corrupted data or data from another version', () => {
    expect(parseState('{nao é json')).toBeNull();
    expect(parseState(JSON.stringify({ version: 3, progress: {} }))).toBeNull();
  });

  it('sanitizes invalid values', () => {
    const parsed = parseState(
      JSON.stringify({
        version: 4,
        codename: 'x'.repeat(100),
        startedAt: 'ontem',
        runId: 'not-a-uuid',
        result: { place: -1, score: 'muito' },
        progress: {
          briefing: { activeMs: -50, solvedAt: 10, wrong: -3, hintUsed: 'sim', seconds: 1.5, score: 80 },
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
      briefing: {
        activeMs: 0,
        resumedAt: null,
        solvedAt: 10,
        wrong: 0,
        hintUsed: false,
        seconds: null,
        score: 80,
      },
    });
  });

  it('never restores a running clock: a page that is loading is not inside a challenge yet', () => {
    const parsed = parseState(
      JSON.stringify({
        version: 4,
        codename: 'Coruja',
        group: 'A1',
        startedAt: 1000,
        progress: { briefing: { activeMs: 30000, resumedAt: 5000, wrong: 0 } },
      }),
    );
    expect(parsed.progress.briefing.resumedAt).toBeNull();
    expect(parsed.progress.briefing.activeMs).toBe(30000);
    expect(getMissionSeconds(parsed, 99999999)).toBe(30);
  });
});
