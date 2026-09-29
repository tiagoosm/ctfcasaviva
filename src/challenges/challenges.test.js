import { evaluateAnswer } from '../utils/answers';
import { vigenere } from '../utils/cipher';
import { challenges, getChallengeBySlug, TOTAL_POINTS } from '.';
import transmission from './interception/transmission';

// As soluções ficam apenas nos testes (fora do bundle de produção)
const SOLUTIONS = {
  briefing: 'começar',
  gallery: 'gogh',
  sequence: 'w-q-r-t-m-k',
  interception: 'ultimato',
  vault: 'conquista',
};

describe('registro de desafios', () => {
  it('tem ids e slugs únicos', () => {
    expect(new Set(challenges.map((c) => c.id)).size).toBe(challenges.length);
    expect(new Set(challenges.map((c) => c.slug)).size).toBe(challenges.length);
  });

  it.each(challenges.map((c) => [c.id, c]))('%s está configurado por completo', (id, challenge) => {
    expect(challenge.Stage).toEqual(expect.any(Function));
    expect(challenge.answerHash).toMatch(/^[0-9a-f]{64}$/);
    expect(['flag', 'interactive']).toContain(challenge.answerMode);
    expect(challenge.hints.length).toBeGreaterThan(0);
    expect(challenge.success.lesson).toBeTruthy();
    // As dicas nunca podem zerar (ou negativar) o desafio
    const totalCost = challenge.hints.reduce((sum, hint) => sum + hint.cost, 0);
    expect(totalCost).toBeLessThan(challenge.points);
    expect(getChallengeBySlug(challenge.slug)).toBe(challenge);
  });

  it.each(Object.entries(SOLUTIONS))('%s aceita a solução esperada', (id, solution) => {
    const challenge = challenges.find((c) => c.id === id);
    expect(evaluateAnswer(challenge, solution).status).toBe('correct');
  });

  it('não aceita a resposta de um desafio em outro', () => {
    const gallery = challenges.find((c) => c.id === 'gallery');
    expect(evaluateAnswer(gallery, SOLUTIONS.interception).status).toBe('incorrect');
  });

  it('a dificuldade nunca diminui ao longo da missão', () => {
    const levels = challenges.map((c) => c.difficulty);
    expect(levels).toEqual([...levels].sort((a, b) => a - b));
  });

  it('soma a pontuação máxima corretamente', () => {
    expect(TOTAL_POINTS).toBe(800);
  });

  it('o cofre é a flag final cifrada com a chave da Galeria', () => {
    const vault = challenges.find((c) => c.id === 'vault');
    expect(vigenere(vault.ciphertext, SOLUTIONS.gallery.toUpperCase(), -1)).toBe(
      SOLUTIONS.vault.toUpperCase(),
    );
    expect(vault.keyLength).toBe(SOLUTIONS.gallery.length);
  });

  it('a transmissão contém exatamente uma palavra cifrada e nenhum parágrafo duplicado', () => {
    const text = transmission.join(' ');
    expect(text.match(/xowlpdwr/g)).toHaveLength(1);
    expect(new Set(transmission).size).toBe(transmission.length);
  });
});
