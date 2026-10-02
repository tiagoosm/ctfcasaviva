import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { fetchRanking } from '../api/ranking';
import { GameProvider } from '../game/GameProvider';
import { STORAGE_KEY } from '../game/storage';
import RankingPage from './RankingPage';

jest.mock('../api/ranking', () => ({ rankingEnabled: true, fetchRanking: jest.fn() }));

function renderRanking() {
  return render(
    <MemoryRouter>
      <GameProvider>
        <RankingPage />
      </GameProvider>
    </MemoryRouter>,
  );
}

const player = (place, name, score) => ({ place, name, group: 'A2', score, totalSeconds: 600 + place });

describe('RankingPage', () => {
  it('lists players in order and marks the current one', async () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 4, codename: 'maria', group: 'a2', progress: {} }),
    );
    fetchRanking.mockResolvedValue([player(1, 'João', 920), player(2, 'Maria', 870), player(3, 'Pedro', 810)]);
    renderRanking();

    const rows = await screen.findAllByRole('row');
    // Header + 3 players: fewer than 20 is fine
    expect(rows).toHaveLength(4);
    expect(within(rows[1]).getByText('João')).toBeInTheDocument();
    expect(within(rows[1]).getByText('920')).toBeInTheDocument();
    expect(within(rows[2]).getByText('você')).toBeInTheDocument();
    expect(rows[2]).toHaveAttribute('aria-current', 'true');
    expect(rows[3]).not.toHaveAttribute('aria-current');
    expect(fetchRanking).toHaveBeenCalledWith(20);
  });

  it('shows an invitation when nobody has finished yet', async () => {
    fetchRanking.mockResolvedValue([]);
    renderRanking();
    expect(await screen.findByText(/ninguém concluiu a missão ainda/i)).toBeInTheDocument();
  });

  it('degrades gracefully when the ranking cannot be loaded', async () => {
    fetchRanking.mockRejectedValue(new Error('offline'));
    renderRanking();
    expect(await screen.findByText(/indisponível no momento/i)).toBeInTheDocument();
  });
});
