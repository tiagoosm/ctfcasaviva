import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import { GameProvider } from './game/GameProvider';
import { STORAGE_KEY } from './game/storage';

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
  fireEvent.change(screen.getByLabelText('Resposta'), { target: { value } });
  fireEvent.click(screen.getByRole('button', { name: 'Enviar' }));
}

async function solveFlag(value, successTitle) {
  await submitFlag(value);
  return screen.findByRole('heading', { name: successTitle, level: 2 });
}

const pageTitle = (name) => screen.findByRole('heading', { name, level: 1 });

function seedState(progress = {}) {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      version: 2,
      codename: 'Coruja',
      group: 'T1',
      startedAt: 1,
      finishedAt: null,
      progress,
    }),
  );
}

describe('full CTF flow', () => {
  it('can be played from the briefing to the certificate', async () => {
    renderApp('/');

    // Name and class are both required before the mission starts
    fireEvent.click(screen.getByRole('button', { name: /iniciar missão/i }));
    expect(screen.getByText('Informe seu nome.')).toBeInTheDocument();
    expect(screen.getByText('Informe sua turma.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nome'), { target: { value: 'Agente Teste' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar missão/i }));
    expect(screen.queryByText('Informe seu nome.')).not.toBeInTheDocument();
    expect(screen.getByText('Informe sua turma.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Turma'), { target: { value: 'T1' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar missão/i }));

    // 00 · Briefing — wrong answer, near miss, hint and correct answer
    await pageTitle('Briefing');
    await submitFlag('errado');
    expect(await screen.findByText('Resposta incorreta')).toBeInTheDocument();

    await submitFlag('senha');
    expect(await screen.findByText(/não do nome do campo/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /ver dica/i }));
    fireEvent.click(screen.getByRole('button', { name: /revelar \(−10\)/i }));
    expect(screen.getByText(/uma tarja preta nem sempre apaga/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /ver dica/i })).not.toBeInTheDocument();

    await solveFlag('Começar', 'Acesso liberado');
    expect(JSON.parse(window.localStorage.getItem(STORAGE_KEY)).progress.briefing.solvedAt).toEqual(
      expect.any(Number),
    );
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
    const send = screen.getByRole('button', { name: /enviar sequência/i });
    expect(send).toBeDisabled();

    const order = [/árvore/i, /bolinhas/i, /cachorros/i, /desenho/i, /estrelas/i, /chamas/i];
    const pick = (pattern) =>
      fireEvent.click(screen.getByRole('button', { name: new RegExp(`^Arquivo: .*${pattern.source}`, 'i') }));

    [...order].reverse().forEach(pick);
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
    fireEvent.click(screen.getByRole('link', { name: /próximo: o cofre/i }));

    // Final · The Vault
    await pageTitle('O Cofre');
    await submitFlag('gogh');
    expect(await screen.findByText(/essa é a chave!/i)).toBeInTheDocument();
    await solveFlag('conquista', 'Cofre aberto');
    fireEvent.click(screen.getByRole('link', { name: /ver resultado da missão/i }));

    // Certificate
    await pageTitle('Missão cumprida');
    const certificate = screen.getByRole('article', { name: 'Agente Teste' });
    expect(within(certificate).getByText('Mestre do CTF')).toBeInTheDocument();
    expect(certificate).toHaveTextContent('Turma T1');
    expect(certificate).toHaveTextContent('790/800');
  }, 30000);
});

describe('flow protection', () => {
  it('does not open a challenge before name and class are given', async () => {
    renderApp('/missao/briefing');
    expect(await screen.findByLabelText('Nome')).toBeInTheDocument();
    expect(screen.getByLabelText('Turma')).toBeInTheDocument();
  });

  it('does not allow skipping stages through the URL', async () => {
    seedState();
    renderApp('/missao/cofre');
    await pageTitle('Mapa da missão');
    expect(screen.getByText('O Cofre ainda está bloqueado')).toBeInTheDocument();
  });

  it('does not unlock the certificate before the mission is complete', async () => {
    renderApp('/conclusao');
    await pageTitle('Mapa da missão');
    expect(screen.getByText(/o certificado ainda está trancado/i)).toBeInTheDocument();
  });

  it('shows a friendly page for unknown routes', async () => {
    renderApp('/rota/que/nao/existe');
    expect(await pageTitle('Esta rota não faz parte da missão')).toBeInTheDocument();
  });

  it('resumes saved progress and allows restarting the mission', async () => {
    seedState({ briefing: { attempts: 1, hintsRevealed: 0, solvedAt: 2 } });
    renderApp('/missao');
    await pageTitle('Mapa da missão');
    expect(screen.getByRole('link', { name: /jogar galeria/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /reiniciar missão/i }));
    const dialog = screen.getByRole('dialog', { name: /reiniciar a missão\?/i });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Reiniciar' }));

    expect(await screen.findByText('Missão reiniciada')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /jogar briefing/i })).toBeInTheDocument();
  });

  it('keeps working with corrupted data in storage', async () => {
    window.localStorage.setItem(STORAGE_KEY, '{corrompido');
    renderApp('/');
    expect(await screen.findByRole('button', { name: /iniciar missão/i })).toBeInTheDocument();
  });
});
