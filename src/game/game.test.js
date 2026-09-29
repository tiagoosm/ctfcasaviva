import { challenges } from '../challenges';
import { createInitialState, gameReducer } from './gameReducer';
import { getChallengeScore, getCurrentChallenge, getRank, getStatus, getSummary } from './selectors';
import { parseState } from './storage';

const [first, second] = challenges;

function solve(state, challenge, now = 1000) {
  return gameReducer(state, { type: 'SOLVE', id: challenge.id, now });
}

describe('gameReducer + selectors', () => {
  it('libera os desafios em sequência', () => {
    let state = createInitialState();
    expect(getStatus(state, first)).toBe('available');
    expect(getStatus(state, second)).toBe('locked');

    state = solve(state, first);
    expect(getStatus(state, first)).toBe('solved');
    expect(getStatus(state, second)).toBe('available');
    expect(getCurrentChallenge(state)).toBe(second);
  });

  it('desconta as dicas reveladas da pontuação do desafio', () => {
    let state = createInitialState();
    state = gameReducer(state, { type: 'REVEAL_HINT', id: first.id, max: first.hints.length });
    state = solve(state, first);
    expect(getChallengeScore(state, first)).toBe(first.points - first.hints[0].cost);
  });

  it('não revela mais dicas do que existem nem após resolver', () => {
    let state = createInitialState();
    for (let i = 0; i < 5; i++) {
      state = gameReducer(state, { type: 'REVEAL_HINT', id: first.id, max: first.hints.length });
    }
    expect(state.progress[first.id].hintsRevealed).toBe(first.hints.length);

    let solved = solve(createInitialState(), first);
    solved = gameReducer(solved, { type: 'REVEAL_HINT', id: first.id, max: 2 });
    expect(solved.progress[first.id].hintsRevealed).toBe(0);
  });

  it('resolver duas vezes não altera o horário original', () => {
    let state = solve(createInitialState(), first, 1000);
    state = solve(state, first, 5000);
    expect(state.progress[first.id].solvedAt).toBe(1000);
  });

  it('registra início, fim e duração da missão', () => {
    let state = gameReducer(createInitialState(), { type: 'START', codename: '  Agente   X ', now: 100 });
    expect(state.codename).toBe('Agente X');
    state = gameReducer(state, { type: 'SOLVE', id: first.id, now: 700, completesMission: true });
    expect(getSummary(state).duration).toBe(600);
  });

  it('reiniciar apaga o progresso mas mantém o codinome', () => {
    let state = gameReducer(createInitialState(), { type: 'START', codename: 'Coruja', now: 1 });
    state = solve(state, first);
    state = gameReducer(state, { type: 'RESET' });
    expect(state).toEqual(createInitialState('Coruja'));
  });

  it('atribui o título de acordo com o aproveitamento', () => {
    expect(getRank(800).title).toBe('Mestre do CTF');
    expect(getRank(600).title).toBe('Especialista');
    expect(getRank(100).title).toBe('Recruta de elite');
  });
});

describe('parseState', () => {
  it('descarta dados corrompidos ou de outra versão', () => {
    expect(parseState('{nao é json')).toBeNull();
    expect(parseState(JSON.stringify({ version: 1, progress: {} }))).toBeNull();
  });

  it('higieniza valores inválidos', () => {
    const parsed = parseState(
      JSON.stringify({
        version: 2,
        codename: 'x'.repeat(100),
        startedAt: 'ontem',
        progress: { briefing: { attempts: -3, hintsRevealed: 1.5, solvedAt: 10 }, lixo: null },
      }),
    );
    expect(parsed.codename).toHaveLength(24);
    expect(parsed.startedAt).toBeNull();
    expect(parsed.progress).toEqual({ briefing: { attempts: 0, hintsRevealed: 0, solvedAt: 10 } });
  });
});
