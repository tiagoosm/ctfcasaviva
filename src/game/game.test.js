import { challenges } from '../challenges';
import { CODENAME_MAX_LENGTH, createInitialState, gameReducer } from './gameReducer';
import {
  getChallengeScore,
  getCurrentChallenge,
  getMissionSeconds,
  getProgress,
  getRank,
  getStatus,
  getSummary,
  isClockRunning,
  isRegistered,
} from './selectors';
import { parseState } from './storage';

const [first, second] = challenges;
const RUN = '00000000-0000-4000-8000-000000000001';

// An attempt as the server reports it
function attempt(stages = {}, extra = {}) {
  return {
    id: RUN,
    name: 'João da Silva',
    group: 'A2',
    status: 'in_progress',
    startedAt: 1000,
    finishedAt: null,
    score: 0,
    totalSeconds: 0,
    errors: 0,
    hints: 0,
    ...extra,
    challenges: challenges.map((challenge) => ({
      id: challenge.id,
      solvedAt: null,
      wrong: 0,
      hintUsed: false,
      seconds: 0,
      score: null,
      ...stages[challenge.id],
    })),
  };
}

const hydrate = (state, data, now = 5000) => gameReducer(state, { type: 'HYDRATE', attempt: data, now });
const started = (stages, extra) => hydrate(createInitialState(), attempt(stages, extra));
const enter = (state, challenge, now) => gameReducer(state, { type: 'ENTER', id: challenge.id, now });
const leave = (state, challenge, now) => gameReducer(state, { type: 'LEAVE', id: challenge.id, now });
const solved = (state, challenge, values) =>
  gameReducer(state, { type: 'SOLVED', id: challenge.id, score: 100, seconds: 10, now: 9000, ...values });

describe('attempt state', () => {
  it('is empty until the server confirms an attempt', () => {
    const state = createInitialState();
    expect(isRegistered(state)).toBe(false);
    expect(getMissionSeconds(state, 5000)).toBeNull();
  });

  it('is built from the attempt the server reports', () => {
    const state = started({
      [first.id]: { solvedAt: 2000, wrong: 2, hintUsed: true, seconds: 40, score: 55 },
      [second.id]: { wrong: 1, seconds: 12 },
    });

    expect(isRegistered(state)).toBe(true);
    // Names are always shown in capital letters
    expect(state.codename).toBe('JOÃO DA SILVA');
    expect(state.group).toBe('A2');
    expect(state.runId).toBe(RUN);
    expect(getStatus(state, first)).toBe('solved');
    expect(getStatus(state, second)).toBe('available');
    expect(getCurrentChallenge(state)).toBe(second);
    expect(getChallengeScore(state, first)).toBe(55);

    const summary = getSummary(state);
    expect(summary.solvedCount).toBe(1);
    expect(summary.score).toBe(55);
    expect(summary.errors).toBe(3);
    expect(summary.hintsUsed).toBe(1);
    // Time already spent in challenges, paused until one is opened
    expect(getMissionSeconds(state, 999999)).toBe(52);
    expect(isClockRunning(state)).toBe(false);
  });

  it('replaces whatever was saved locally, including tampered values', () => {
    let state = started({ [first.id]: { solvedAt: 2000, seconds: 5, score: 100 } });
    state = {
      ...state,
      finishedAt: 10,
      result: { score: 99999, totalSeconds: 1, errors: 0, hints: 0 },
      progress: { ...state.progress, [second.id]: { ...state.progress[first.id], score: 9999 } },
    };

    state = hydrate(state, attempt({ [first.id]: { solvedAt: 2000, seconds: 5, score: 100 } }));
    expect(state.finishedAt).toBeNull();
    expect(state.result).toBeNull();
    expect(getStatus(state, second)).toBe('available');
    expect(getSummary(state).score).toBe(100);
  });

  it('carries the official result of a completed attempt', () => {
    const all = Object.fromEntries(
      challenges.map((challenge) => [challenge.id, { solvedAt: 3000, seconds: 20, score: challenge.points }]),
    );
    const state = started(all, {
      status: 'completed',
      finishedAt: 8000,
      score: 1000,
      totalSeconds: 100,
      errors: 0,
      hints: 0,
    });

    expect(getSummary(state).isComplete).toBe(true);
    expect(state.result).toEqual({ score: 1000, totalSeconds: 100, errors: 0, hints: 0 });
    expect(getMissionSeconds(state, 99999999)).toBe(100);
    expect(isClockRunning(state)).toBe(false);
  });

  it('unlocks challenges in sequence as the server accepts answers', () => {
    let state = started();
    expect(getStatus(state, first)).toBe('available');
    expect(getStatus(state, second)).toBe('locked');

    state = solved(state, first, { score: 80, seconds: 30 });
    expect(getStatus(state, first)).toBe('solved');
    expect(getStatus(state, second)).toBe('available');
    expect(getChallengeScore(state, first)).toBe(80);
    expect(getProgress(state, first.id).seconds).toBe(30);
  });

  it('keeps the first result when a solve is reported twice', () => {
    let state = solved(started(), first, { score: 80, now: 9000 });
    state = solved(state, first, { score: 100, now: 20000 });
    expect(getChallengeScore(state, first)).toBe(80);
    expect(getProgress(state, first.id).solvedAt).toBe(9000);
  });

  it('counts wrong answers and a single hint, and none after solving', () => {
    let state = started();
    state = gameReducer(state, { type: 'WRONG', id: first.id });
    state = gameReducer(state, { type: 'WRONG', id: first.id });
    for (let i = 0; i < 4; i++) state = gameReducer(state, { type: 'REVEAL_HINT', id: first.id });
    expect(getSummary(state).errors).toBe(2);
    expect(getSummary(state).hintsUsed).toBe(1);

    state = solved(state, first);
    state = gameReducer(state, { type: 'WRONG', id: first.id });
    expect(getSummary(state).errors).toBe(2);
  });

  it('marks the mission as finished with the last answer', () => {
    let state = started();
    state = solved(state, first, { finished: true, now: 7000 });
    expect(state.finishedAt).toBe(7000);
  });

  it('forgets the player on this browser when leaving', () => {
    const state = gameReducer(started({ [first.id]: { solvedAt: 2000, score: 100 } }), { type: 'SIGN_OUT' });
    expect(state).toEqual(createInitialState());
  });

  it('assigns the title according to performance', () => {
    expect(getRank(1000).title).toBe('Mestre do CTF');
    expect(getRank(750).title).toBe('Especialista');
    expect(getRank(100).title).toBe('Recruta de elite');
  });
});

describe('mission clock', () => {
  it('waits at zero until a challenge is opened', () => {
    const state = started();
    expect(isClockRunning(state)).toBe(false);
    // Reading the landing page, the map or the ranking costs no time
    expect(getMissionSeconds(state, 600000)).toBe(0);
  });

  it('only counts the time spent inside a challenge', () => {
    let state = enter(started(), first, 10000);
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
    let state = enter(started(), first, 10000);
    state = enter(state, first, 500000);
    expect(getMissionSeconds(state, 20000)).toBe(10);

    state = leave(state, first, 20000);
    state = leave(state, first, 900000);
    expect(getMissionSeconds(state, 900000)).toBe(10);
  });

  it('keeps running through a sync with the server, from the time the server reports', () => {
    let state = enter(started(), first, 10000);
    // The server says 25 s were spent so far; the challenge is still on screen
    state = hydrate(state, attempt({ [first.id]: { seconds: 25 } }), 30000);
    expect(isClockRunning(state)).toBe(true);
    expect(getMissionSeconds(state, 30000)).toBe(25);
    expect(getMissionSeconds(state, 40000)).toBe(35);
  });

  it('uses the time the server measured once a challenge is solved', () => {
    let state = enter(started(), first, 10000);
    state = solved(state, first, { seconds: 42, now: 99000 });
    expect(isClockRunning(state)).toBe(false);
    expect(getMissionSeconds(state, 999999)).toBe(42);
  });

  it('pauses everything that is running when the page goes away', () => {
    let state = enter(started(), first, 1000);
    state = gameReducer(state, { type: 'PAUSE_ALL', now: 31000 });
    expect(isClockRunning(state)).toBe(false);
    expect(getMissionSeconds(state, 999999)).toBe(30);
  });
});

describe('parseState', () => {
  it('discards corrupted data or data from another version', () => {
    expect(parseState('{nao é json')).toBeNull();
    expect(parseState(JSON.stringify({ version: 4, progress: {} }))).toBeNull();
  });

  it('sanitizes invalid values', () => {
    const parsed = parseState(
      JSON.stringify({
        version: 5,
        codename: 'x'.repeat(100),
        group: 'Turma inventada',
        startedAt: 'ontem',
        runId: 'not-a-uuid',
        result: { score: 'muito' },
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
    expect(isRegistered(parsed)).toBe(false);
    expect(parsed.result).toEqual({ score: 0, totalSeconds: 0, errors: 0, hints: 0 });
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
        version: 5,
        codename: 'Coruja',
        group: 'A1',
        runId: RUN,
        startedAt: 1000,
        progress: { briefing: { activeMs: 30000, resumedAt: 5000, wrong: 0 } },
      }),
    );
    expect(parsed.progress.briefing.resumedAt).toBeNull();
    expect(getMissionSeconds(parsed, 99999999)).toBe(30);
  });
});
