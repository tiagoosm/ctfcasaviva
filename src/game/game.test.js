import { challenges } from '../challenges';
import { CODENAME_MAX_LENGTH, createInitialState, gameReducer } from './gameReducer';
import {
  getChallengeScore,
  getCurrentChallenge,
  getRank,
  getStatus,
  getSummary,
  isRegistered,
} from './selectors';
import { parseState } from './storage';

const [first, second] = challenges;

function solve(state, challenge, now = 1000) {
  return gameReducer(state, { type: 'SOLVE', id: challenge.id, now });
}

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

  it('deducts the revealed hint from the challenge score', () => {
    let state = createInitialState();
    state = gameReducer(state, { type: 'REVEAL_HINT', id: first.id });
    state = solve(state, first);
    expect(getChallengeScore(state, first)).toBe(first.points - first.hint.cost);
    expect(getSummary(state).hintsUsed).toBe(1);
  });

  it('reveals a single hint per challenge, and none after solving', () => {
    let state = createInitialState();
    for (let i = 0; i < 5; i++) {
      state = gameReducer(state, { type: 'REVEAL_HINT', id: first.id });
    }
    expect(state.progress[first.id].hintsRevealed).toBe(1);

    let solved = solve(createInitialState(), first);
    solved = gameReducer(solved, { type: 'REVEAL_HINT', id: first.id });
    expect(solved.progress[first.id].hintsRevealed).toBe(0);
  });

  it('keeps the original timestamp when solved twice', () => {
    let state = solve(createInitialState(), first, 1000);
    state = solve(state, first, 5000);
    expect(state.progress[first.id].solvedAt).toBe(1000);
  });

  it('records mission start, end and duration', () => {
    let state = gameReducer(createInitialState(), {
      type: 'START',
      codename: '  Agente   X ',
      group: ' 2º  A ',
      now: 100,
    });
    expect(state.codename).toBe('Agente X');
    expect(state.group).toBe('2º A');
    state = gameReducer(state, { type: 'SOLVE', id: first.id, now: 700, completesMission: true });
    expect(getSummary(state).duration).toBe(600);
  });

  it('clears progress but keeps name and class on restart', () => {
    let state = gameReducer(createInitialState(), { type: 'START', codename: 'Coruja', group: 'T1', now: 1 });
    state = solve(state, first);
    state = gameReducer(state, { type: 'RESET' });
    expect(state).toEqual(createInitialState('Coruja', 'T1'));
  });

  it('requires both name and class to be registered', () => {
    expect(isRegistered(createInitialState())).toBe(false);
    expect(isRegistered(createInitialState('Coruja'))).toBe(false);
    expect(isRegistered(createInitialState('Coruja', 'T1'))).toBe(true);
  });

  it('assigns the title according to performance', () => {
    expect(getRank(800).title).toBe('Mestre do CTF');
    expect(getRank(600).title).toBe('Especialista');
    expect(getRank(100).title).toBe('Recruta de elite');
  });
});

describe('parseState', () => {
  it('discards corrupted data or data from another version', () => {
    expect(parseState('{nao é json')).toBeNull();
    expect(parseState(JSON.stringify({ version: 1, progress: {} }))).toBeNull();
  });

  it('sanitizes invalid values', () => {
    const parsed = parseState(
      JSON.stringify({
        version: 2,
        codename: 'x'.repeat(100),
        startedAt: 'ontem',
        progress: { briefing: { attempts: -3, hintsRevealed: 1.5, solvedAt: 10 }, lixo: null },
      }),
    );
    expect(parsed.codename).toHaveLength(CODENAME_MAX_LENGTH);
    expect(parsed.group).toBe('');
    expect(parsed.startedAt).toBeNull();
    expect(parsed.progress).toEqual({ briefing: { attempts: 0, hintsRevealed: 0, solvedAt: 10 } });
  });
});
