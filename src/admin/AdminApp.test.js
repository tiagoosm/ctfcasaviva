import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AdminApp from './AdminApp';
import * as api from './api';

jest.mock('./api');

const players = [
  {
    id: 'run-1',
    name: 'João',
    group: 'A2',
    status: 'completed',
    currentChallenge: null,
    startedAt: '2026-10-01T12:00:00Z',
    finishedAt: '2026-10-01T12:20:00Z',
    hidden: false,
    score: 920,
    totalSeconds: 512,
    errors: 2,
    hints: 1,
    solved: 5,
  },
  {
    id: 'run-2',
    name: 'Maria',
    group: 'A1',
    status: 'in_progress',
    currentChallenge: 'sequence',
    startedAt: '2026-10-01T13:00:00Z',
    finishedAt: null,
    hidden: false,
    score: 300,
    totalSeconds: 200,
    errors: 0,
    hints: 0,
    solved: 2,
  },
];

const detail = {
  id: 'run-1',
  name: 'João',
  group: 'A2',
  startedAt: '2026-10-01T12:00:00Z',
  finishedAt: '2026-10-01T12:20:00Z',
  hidden: false,
  totalSeconds: 1200,
  challenges: [
    { id: 'briefing', maxPoints: 100, started: true, solvedAt: 'y', seconds: 40, wrong: 1, hintUsed: true, score: 65 },
    { id: 'gallery', maxPoints: 200, started: false, solvedAt: null, seconds: null, wrong: 0, hintUsed: false, score: null },
  ],
};

function renderAdmin(route = '/admin') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="admin/*" element={<AdminApp />} />
      </Routes>
    </MemoryRouter>,
  );
}

function signedIn() {
  api.getSession.mockReturnValue({ accessToken: 't', email: 'admin@example.com' });
  api.listPlayers.mockResolvedValue(players);
  api.getPlayer.mockResolvedValue(detail);
  api.listChallengeSettings.mockResolvedValue({ briefing: { answer: 'resposta-secreta' } });
}

describe('admin area', () => {
  it('shows only the login form to visitors', () => {
    api.getSession.mockReturnValue(null);
    renderAdmin();
    expect(screen.getByRole('heading', { name: 'Acesso restrito' })).toBeInTheDocument();
    expect(screen.queryByText('Jogadores')).not.toBeInTheDocument();
    expect(api.listPlayers).not.toHaveBeenCalled();
  });

  it('rejects an account that is not an administrator', async () => {
    api.getSession.mockReturnValue(null);
    api.signIn.mockRejectedValue(Object.assign(new Error('no'), { notAdmin: true }));
    renderAdmin();
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'aluno@example.com' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'qualquer' } });
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    expect(await screen.findByText('E-mail ou senha inválidos.')).toBeInTheDocument();
    expect(screen.queryByText('Jogadores')).not.toBeInTheDocument();
  });

  it('goes back to the login when the server refuses the session', async () => {
    api.getSession.mockReturnValue({ accessToken: 'expired', email: 'admin@example.com' });
    api.listPlayers.mockRejectedValue(Object.assign(new Error('unauthorized'), { unauthorized: true }));
    renderAdmin();
    expect(await screen.findByRole('heading', { name: 'Acesso restrito' })).toBeInTheDocument();
  });

  it('lists players and filters by name, class and status', async () => {
    signedIn();
    renderAdmin();
    expect(await screen.findByRole('button', { name: 'João' })).toBeInTheDocument();
    expect(screen.getByText(/2 jogadores · 1 concluiu/)).toBeInTheDocument();
    expect(screen.getByText('08:32')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Em andamento')).toBeInTheDocument();
    // Players who have not finished show the stage they are in
    expect(within(screen.getByRole('table')).getByText('Sequência')).toBeInTheDocument();
    expect(within(screen.getByRole('table')).getByText('Final')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pesquisar por nome'), { target: { value: 'mar' } });
    expect(screen.queryByRole('button', { name: 'João' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maria' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Pesquisar por nome'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Turma'), { target: { value: 'A2' } });
    expect(screen.queryByRole('button', { name: 'Maria' })).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Turma'), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'playing' } });
    expect(screen.queryByRole('button', { name: 'João' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Maria' })).toBeInTheDocument();
  });

  it('shows a player history and edits name and class', async () => {
    signedIn();
    api.updatePlayer.mockResolvedValue(null);
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: 'João' }));

    const dialog = await screen.findByRole('dialog', { name: 'João' });
    expect(await within(dialog).findByText('Briefing')).toBeInTheDocument();
    // Total mission time, and the (hidden to players) time inside the solved stage
    expect(within(dialog).getByText('20:00')).toBeInTheDocument();
    expect(within(dialog).getByText('00:40')).toBeInTheDocument();
    expect(within(dialog).getByText('Não iniciada')).toBeInTheDocument();

    fireEvent.change(within(dialog).getByLabelText('NOME COMPLETO'), { target: { value: ' João  silva ' } });
    // Names are always turned into capital letters, already while typing
    expect(within(dialog).getByLabelText('NOME COMPLETO')).toHaveValue(' JOÃO  SILVA ');
    fireEvent.change(within(dialog).getByLabelText('TURMA'), { target: { value: 'B4' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Salvar' }));
    await waitFor(() => expect(api.updatePlayer).toHaveBeenCalledWith('run-1', 'JOÃO SILVA', 'B4'));
    expect(await within(dialog).findByText('Dados atualizados.')).toBeInTheDocument();
  });

  it('only resets an attempt after an explicit confirmation', async () => {
    signedIn();
    api.deletePlayer.mockResolvedValue(null);
    renderAdmin();
    fireEvent.click(await screen.findByRole('button', { name: 'João' }));
    const dialog = await screen.findByRole('dialog', { name: 'João' });

    fireEvent.click(await within(dialog).findByRole('button', { name: /resetar tentativa/i }));
    expect(api.deletePlayer).not.toHaveBeenCalled();

    // Cancelling keeps the attempt
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancelar' }));
    expect(api.deletePlayer).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: /resetar tentativa/i }));
    fireEvent.click(within(dialog).getByRole('button', { name: 'Confirmar reset' }));
    await waitFor(() => expect(api.deletePlayer).toHaveBeenCalledWith('run-1'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('opens any challenge with its answer, without playing', async () => {
    signedIn();
    renderAdmin('/admin/fases');
    expect(await screen.findByRole('link', { name: /o cofre/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('link', { name: /briefing/i }));

    expect(await screen.findByRole('heading', { name: 'Briefing', level: 1 })).toBeInTheDocument();
    expect(await screen.findByText('resposta-secreta')).toBeInTheDocument();
    expect(screen.getByText(/uma tarja preta nem sempre apaga/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Testar uma resposta'), { target: { value: 'Começar' } });
    fireEvent.click(screen.getByRole('button', { name: 'Testar' }));
    expect(screen.getByText('Correta.')).toBeInTheDocument();
  });
});
