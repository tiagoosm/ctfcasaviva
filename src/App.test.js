import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import * as server from './api/ranking';
import App from './App';
import { GameProvider } from './game/GameProvider';
import { STORAGE_KEY } from './game/storage';

// The in-memory backend in src/api/__mocks__ follows the same rules as the server
jest.mock('./api/ranking');

const ANSWERS = {
  briefing: 'começar',
  gallery: 'gogh',
  sequence: 'w-q-r-t-m-k',
  interception: 'ultimato',
  vault: '1969',
};

beforeEach(() => {
  server.__reset();
  window.localStorage.clear();
});

function renderApp(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <GameProvider>
        <App />
      </GameProvider>
    </MemoryRouter>,
  );
}

async function submitFlag(value) {
  fireEvent.change(await screen.findByLabelText('Resposta'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
}

async function solveFlag(value, successTitle) {
  await submitFlag(value);
  return screen.findByRole('heading', { name: successTitle, level: 2 });
}

// Presses the vault keypad
const typeCode = (code) =>
  [...code].forEach((digit) => fireEvent.click(screen.getByRole('button', { name: digit })));

const pageTitle = (name) => screen.findByRole('heading', { name, level: 1 });

// Fills in the start form the way a player does
function identify(name, group) {
  fireEvent.change(screen.getByLabelText('NOME COMPLETO'), { target: { value: name } });
  fireEvent.click(screen.getByRole('combobox', { name: 'TURMA' }));
  fireEvent.click(screen.getByRole('option', { name: group }));
  fireEvent.click(screen.getByRole('button', { name: /iniciar missão/i }));
}

// Plays on the server directly, as if it had happened on another device
async function playOnServer(name, group, stages) {
  const attempt = await server.startRun(name, group);
  for (const id of stages) await server.submitAnswer(attempt.id, id, ANSWERS[id]);
  return attempt.id;
}

// A browser that already knows the player (what localStorage keeps between visits)
async function knownPlayer(stages = []) {
  const runId = await playOnServer('Coruja', 'A1', stages);
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 5,
      codename: 'Coruja',
      group: 'A1',
      runId,
      startedAt: 1,
      finishedAt: null,
      result: null,
      progress: {},
    }),
  );
  return runId;
}

describe('full CTF flow', () => {
  it('can be played from the briefing to the official result', async () => {
    renderApp('/');

    // Name and class are both required before the mission starts
    fireEvent.click(screen.getByRole('button', { name: /iniciar missão/i }));
    expect(screen.getByText('Informe seu nome completo.')).toBeInTheDocument();
    expect(screen.getByText('Selecione sua turma.')).toBeInTheDocument();
    expect(server.__attempts()).toHaveLength(0);

    fireEvent.change(screen.getByLabelText('NOME COMPLETO'), { target: { value: 'Agente Teste' } });
    // Names are always in capital letters, already while typing
    expect(screen.getByLabelText('NOME COMPLETO')).toHaveValue('AGENTE TESTE');
    fireEvent.click(screen.getByRole('button', { name: /iniciar missão/i }));
    expect(screen.queryByText('Informe seu nome completo.')).not.toBeInTheDocument();
    expect(screen.getByText('Selecione sua turma.')).toBeInTheDocument();

    // The class is chosen from a fixed list
    const groupField = screen.getByRole('combobox', { name: 'TURMA' });
    expect(groupField).toHaveTextContent('SELECIONE SUA TURMA');
    fireEvent.click(groupField);
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'A1',
      'A2',
      'A3',
      'A4',
      'B1',
      'B2',
      'B3',
      'B4',
    ]);
    fireEvent.click(screen.getByRole('option', { name: 'B2' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(groupField).toHaveTextContent('B2');
    fireEvent.click(screen.getByRole('button', { name: /iniciar missão/i }));

    // 00 · Briefing — wrong answer, near miss, hint and correct answer
    await pageTitle('Briefing');
    // The attempt exists on the server from the very start
    expect(server.__attempts()).toHaveLength(1);

    await submitFlag('errado');
    expect(await screen.findByText('Resposta incorreta')).toBeInTheDocument();
    expect(screen.getByText(/−10 pontos/)).toBeInTheDocument();
    // One mission clock, pinned to the page (not part of the header)
    expect(screen.getByRole('timer')).toHaveTextContent(/^00:0\d$/);
    expect(within(screen.getAllByRole('banner')[0]).queryByRole('timer')).not.toBeInTheDocument();
    // It runs while a challenge is on screen
    expect(screen.getByText(/tempo de missão/i)).toBeInTheDocument();

    await submitFlag('senha');
    expect(await screen.findByText(/não do nome do campo/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ver dica/i }));
    fireEvent.click(screen.getByRole('button', { name: /revelar \(−25\)/i }));
    expect(screen.getByText(/uma tarja preta nem sempre apaga/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ver dica/i })).not.toBeInTheDocument();

    await solveFlag('Começar', 'Acesso liberado');
    // Every step was saved on the server as it happened
    const [saved] = server.__attempts();
    expect(saved.stages.briefing).toMatchObject({ wrong: 2, hintUsed: true, score: 55 });
    expect(saved.finishedAt).toBeNull();
    fireEvent.click(screen.getByRole('link', { name: /próximo: galeria/i }));

    // 01 · Gallery — the viewer opens, has no zoom and closes with Esc
    await pageTitle('Galeria');
    fireEvent.click(screen.getByRole('button', { name: /abrir evidência 01/i }));
    const dialog = screen.getByRole('dialog', { name: /evidência 01 de 04/i });
    expect(within(dialog).queryByRole('button', { name: /zoom/i })).not.toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Próxima evidência' }));
    expect(screen.getByRole('dialog', { name: /evidência 02 de 04/i })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await submitFlag('Van Gogh');
    expect(await screen.findByText(/você reconheceu o artista/i)).toBeInTheDocument();
    await solveFlag('GOGH', 'Marcas identificadas');
    fireEvent.click(screen.getByRole('link', { name: /próximo: sequência/i }));

    // 02 · Sequence — the wrong order is rejected, the right one is accepted
    await pageTitle('Sequência');
    // No letter is shown to the player, neither on the images nor on the panel
    expect(screen.queryByText(/^[A-F]$/)).not.toBeInTheDocument();
    const send = screen.getByRole('button', { name: /enviar sequência/i });
    expect(send).toBeDisabled();

    const order = [/árvore/i, /bolinhas/i, /cachorros/i, /desenho/i, /estrelas/i, /chamas/i];
    const pick = (pattern) =>
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Arquivo: .*${pattern.source}`, 'i') }));

    [...order].reverse().forEach(pick);
    expect(screen.queryByText(/^[A-F]$/)).not.toBeInTheDocument();
    fireEvent.click(send);
    expect(await screen.findByText('Sequência rejeitada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /limpar/i }));
    order.forEach(pick);
    fireEvent.click(screen.getByRole('button', { name: /enviar sequência/i }));
    await screen.findByRole('heading', { name: 'Sequência aceita', level: 2 });
    fireEvent.click(screen.getByRole('link', { name: /próximo: interceptação/i }));

    // 03 · Interception
    await pageTitle('Interceptação');
    await submitFlag('xowlpdwr');
    expect(await screen.findByText(/agora ela precisa ser decifrada/i)).toBeInTheDocument();
    await solveFlag('ultimato', 'Transmissão decifrada');
    fireEvent.click(screen.getByRole('link', { name: /próximo: sala de investigação/i }));

    // Final · Investigation room — a vault and three documents, no text field
    await pageTitle('Sala de Investigação');
    expect(screen.queryByLabelText('Resposta')).not.toBeInTheDocument();
    const confirm = screen.getByRole('button', { name: 'Confirmar combinação' });
    expect(confirm).toBeDisabled();

    // Each document opens in a viewer and is marked as read
    fireEvent.click(screen.getByRole('button', { name: /abrir doc-01/i }));
    let viewer = screen.getByRole('dialog', { name: /doc-01/i });
    expect(within(viewer).getByText(/27\/09\/1982/)).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: /abrir doc-01/i })).toHaveTextContent('LIDO');

    fireEvent.click(screen.getByRole('button', { name: /abrir doc-02/i }));
    viewer = screen.getByRole('dialog', { name: /doc-02/i });
    expect(within(viewer).getByText('CARTREF')).toBeInTheDocument();
    fireEvent.keyDown(document, { key: 'Escape' });

    fireEvent.click(screen.getByRole('button', { name: /abrir doc-03/i }));
    viewer = screen.getByRole('dialog', { name: /doc-03/i });
    expect(within(viewer).getByText('01010111')).toBeInTheDocument();
    expect(within(viewer).getByText('“UM PEQUENO PASSO...”')).toBeInTheDocument();
    // While a document is open, the keyboard does not type on the vault
    fireEvent.keyDown(document, { key: '7' });
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('0 de 4 dígitos inseridos')).toBeInTheDocument();

    // A number taken from the distraction document is refused without detail
    typeCode('1938');
    fireEvent.click(confirm);
    expect(await screen.findByText('Combinação incorreta')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Confirmar combinação' })).toBeDisabled();

    typeCode('1969');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar combinação' }));
    await screen.findByRole('heading', { name: 'Acesso concedido', level: 2 });
    expect(screen.getByText('ACESSO CONCEDIDO')).toBeInTheDocument();
    expect(screen.getByText('MISSÃO CONCLUÍDA.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar combinação' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /ver resultado da missão/i }));

    // Official result
    await pageTitle('Missão cumprida');
    expect(screen.getByText('Sua tentativa oficial está registrada.')).toBeInTheDocument();
    const certificate = screen.getByRole('article', { name: 'AGENTE TESTE' });
    expect(within(certificate).getByText('Mestre do CTF')).toBeInTheDocument();
    expect(certificate).toHaveTextContent('TURMA B2');
    // 1000 − 6 wrong answers (10 each) − 1 hint (25)
    expect(certificate).toHaveTextContent('915 / 1000 pts');
    expect(within(certificate).getByText('Erros').nextSibling).toHaveTextContent('6');
    expect(within(certificate).getByText('Dicas').nextSibling).toHaveTextContent('1');
    expect(await within(certificate).findByText('1º no ranking')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ver ranking/i })).toBeInTheDocument();
    // The result page shows the final time itself: no running clock there
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();

    // The attempt is over: nothing offers to play again
    expect(screen.queryByRole('button', { name: /jogar novamente/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reiniciar/i })).not.toBeInTheDocument();
    expect(server.__attempts()).toHaveLength(1);
    expect(server.__attempts()[0].score).toBe(915);
    // Long on purpose: it plays the whole mission
  }, 60000);
});

describe('one official attempt per player', () => {
  it('resumes the attempt when the same player comes back from another browser', async () => {
    await playOnServer('João da Silva', 'A2', ['briefing']);

    // Nothing saved locally, and the name is typed differently
    renderApp('/');
    identify('  joao   da SILVA ', 'A2');

    // Straight to the stage where the player stopped
    await pageTitle('Galeria');
    expect(server.__attempts()).toHaveLength(1);

    fireEvent.click(screen.getByRole('link', { name: 'Mapa' }));
    await pageTitle('Mapa da missão');
    expect(screen.getByText('1/5 etapas · 100 pts')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /revisar briefing/i })).toBeInTheDocument();
  });

  it('treats another class as another player', async () => {
    await playOnServer('João da Silva', 'A2', ['briefing']);
    renderApp('/');
    identify('João da Silva', 'B1');
    await pageTitle('Briefing');
    expect(server.__attempts()).toHaveLength(2);
  });

  it('does not let a player who finished start again', async () => {
    await playOnServer('Maria Souza', 'B1', Object.keys(ANSWERS));

    renderApp('/');
    identify('maria souza', 'B1');

    // No new attempt: the official result is shown instead
    await pageTitle('Missão cumprida');
    expect(server.__attempts()).toHaveLength(1);
    const certificate = screen.getByRole('article', { name: 'MARIA SOUZA' });
    expect(certificate).toHaveTextContent('1000 / 1000 pts');
    expect(within(certificate).getByText('1º no ranking')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /jogar novamente/i })).not.toBeInTheDocument();

    // Back on the start page there is no form, only the notice
    fireEvent.click(screen.getByRole('link', { name: /página inicial/i }));
    expect(await screen.findByRole('heading', { name: 'CTF concluído' })).toBeInTheDocument();
    expect(screen.getByText('Você já realizou sua tentativa oficial.')).toBeInTheDocument();
    expect(screen.queryByLabelText('NOME COMPLETO')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /iniciar/i })).not.toBeInTheDocument();
  });

  it('keeps the official score when a finished stage is opened again', async () => {
    const runId = await knownPlayer(Object.keys(ANSWERS));
    renderApp('/missao');
    await pageTitle('Mapa da missão');
    fireEvent.click(await screen.findByRole('link', { name: /revisar sala de investigação/i }));
    await pageTitle('Sala de Investigação');
    // A solved stage can be reviewed but not answered
    expect(await screen.findByRole('heading', { name: 'Acesso concedido', level: 2 })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Confirmar combinação' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Resposta')).not.toBeInTheDocument();
    expect(server.__attempts().find((attempt) => attempt.id === runId).score).toBe(1000);
  });

  it('locks the vault after a wrong combination and refuses answers meanwhile', async () => {
    await knownPlayer(['briefing', 'gallery', 'sequence', 'interception']);
    renderApp('/missao');
    fireEvent.click(await screen.findByRole('link', { name: /jogar sala de investigação/i }));
    await pageTitle('Sala de Investigação');

    server.__setLock(15);
    typeCode('1969');
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar combinação' }));
    expect(await screen.findByText(/cofre bloqueado por 1\d s/i)).toBeInTheDocument();
    // Even the right combination is not accepted while locked
    expect(screen.queryByRole('heading', { name: 'Acesso concedido' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '2' })).toBeDisabled();
    expect(server.__attempts()[0].finishedAt).toBeNull();
  });

  it('does not start anything when the server cannot be reached', async () => {
    server.__setFailing(true);
    renderApp('/');
    identify('Agente Teste', 'A1');
    expect(await screen.findByText(/não foi possível iniciar agora/i)).toBeInTheDocument();
    expect(screen.getByLabelText('NOME COMPLETO')).toBeInTheDocument();
    expect(server.__attempts()).toHaveLength(0);
  });

  it('does not accept an answer the server did not confirm', async () => {
    await knownPlayer();
    renderApp('/missao/briefing');
    await pageTitle('Briefing');

    server.__setFailing(true);
    await submitFlag('começar');
    expect(await screen.findByText('Não foi possível verificar')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Acesso liberado' })).not.toBeInTheDocument();

    server.__setFailing(false);
    await solveFlag('começar', 'Acesso liberado');
  });

  it('follows the server when the local data is behind or was tampered with', async () => {
    const runId = await knownPlayer(['briefing', 'gallery']);
    // This browser claims a perfect finished mission
    const fake = { activeMs: 0, resumedAt: null, solvedAt: 5, wrong: 0, hintUsed: false, seconds: 0, score: 9999 };
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: 5,
        codename: 'Coruja',
        group: 'A1',
        runId,
        startedAt: 1,
        finishedAt: 10,
        result: { place: 1, score: 99999, totalSeconds: 1, errors: 0, hints: 0 },
        progress: { briefing: fake, gallery: fake, sequence: fake, interception: fake, vault: fake },
      }),
    );

    renderApp('/missao');
    await pageTitle('Mapa da missão');
    expect(await screen.findByText('2/5 etapas · 300 pts')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /jogar sequência/i })).toBeInTheDocument();
    expect(server.__attempts()[0].finishedAt).toBeNull();
  });

  it('sends the player back to the start when an administrator resets the attempt', async () => {
    const runId = await knownPlayer(['briefing']);
    server.__remove(runId);

    renderApp('/');
    expect(await screen.findByLabelText('NOME COMPLETO')).toBeInTheDocument();
    // Identifying again starts a brand new attempt
    identify('Coruja', 'A1');
    await pageTitle('Briefing');
    expect(server.__attempts()).toHaveLength(1);
    expect(server.__attempts()[0].id).not.toBe(runId);
  });
});

describe('flow protection', () => {
  it('does not open a challenge before name and class are given', async () => {
    renderApp('/missao/briefing');
    expect(await screen.findByLabelText('NOME COMPLETO')).toBeInTheDocument();
    expect(screen.getByLabelText('TURMA')).toBeInTheDocument();
  });

  it('does not allow skipping stages through the URL', async () => {
    await knownPlayer();
    renderApp('/missao/cofre');
    await pageTitle('Mapa da missão');
    expect(screen.getByText('Sala de Investigação: etapa bloqueada')).toBeInTheDocument();
  });

  it('does not unlock the certificate before the mission is complete', async () => {
    renderApp('/conclusao');
    await pageTitle('Mapa da missão');
    expect(screen.getByText(/o certificado ainda está trancado/i)).toBeInTheDocument();
  });

  it('has no way for the player to restart the mission', async () => {
    await knownPlayer(['briefing']);
    renderApp('/missao');
    await pageTitle('Mapa da missão');
    expect(await screen.findByRole('link', { name: /jogar galeria/i })).toBeInTheDocument();
    // Outside a challenge the clock is paused and hidden
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reiniciar/i })).not.toBeInTheDocument();
  });

  it('forgets the player on this browser when leaving, keeping the attempt on the server', async () => {
    await knownPlayer(['briefing']);
    renderApp('/missao');
    await pageTitle('Mapa da missão');
    await screen.findByRole('link', { name: /jogar galeria/i });

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    let dialog = screen.getByRole('dialog', { name: 'Sair do CTF?' });
    expect(within(dialog).getByText(/seu progresso fica salvo/i)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByRole('link', { name: /jogar galeria/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Sair' }));
    dialog = screen.getByRole('dialog', { name: 'Sair do CTF?' });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Sair' }));

    expect(await screen.findByLabelText('NOME COMPLETO')).toHaveValue('');
    expect(screen.getByLabelText('TURMA')).toHaveTextContent('SELECIONE SUA TURMA');
    expect(screen.queryByRole('button', { name: 'Sair' })).not.toBeInTheDocument();
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    expect(saved.codename).toBe('');
    expect(saved.runId).toBeNull();

    // The attempt is still there, with its progress
    expect(server.__attempts()).toHaveLength(1);
    identify('coruja', 'A1');
    await pageTitle('Galeria');
    expect(server.__attempts()).toHaveLength(1);
  });

  it('opens the ranking without starting the mission', async () => {
    renderApp('/ranking');
    await pageTitle('Ranking');
    // No clock before the mission starts
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
  });

  it('lists only completed attempts in the ranking', async () => {
    await playOnServer('Maria Souza', 'B1', Object.keys(ANSWERS));
    await playOnServer('João Silva', 'A2', ['briefing', 'gallery']);
    renderApp('/ranking');
    await pageTitle('Ranking');
    expect(await screen.findByText('MARIA SOUZA')).toBeInTheDocument();
    expect(screen.queryByText('JOÃO SILVA')).not.toBeInTheDocument();
  });

  it('shows a friendly page for unknown routes', async () => {
    renderApp('/rota/que/nao/existe');
    expect(await pageTitle('Esta rota não faz parte da missão')).toBeInTheDocument();
  });

  it('keeps working with corrupted data in storage', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{corrompido');
    renderApp('/');
    expect(await screen.findByRole('button', { name: /iniciar missão/i })).toBeInTheDocument();
  });
});
