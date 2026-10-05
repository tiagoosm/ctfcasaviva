import { useEffect, useState } from 'react';
import { LuLoaderCircle } from 'react-icons/lu';
import { fetchRanking, rankingEnabled } from '../api/ranking';
import { useGame } from '../game/GameProvider';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { cn, formatDuration } from '../utils/format';

const LIMIT = 20;
const REFRESH_INTERVAL = 30000;

// Subtle medal tones for the podium; everyone else gets a neutral marker
const PLACE_STYLES = {
  1: 'bg-brand-orange text-ink-950',
  2: 'bg-fg-muted text-ink-950',
  3: 'bg-[#B8773A] text-ink-950',
};

const sameText = (a, b) => String(a).trim().toLowerCase() === String(b).trim().toLowerCase();

export default function RankingPage() {
  useDocumentTitle('Ranking');
  const { state } = useGame();
  const [rows, setRows] = useState(null);
  const [failed, setFailed] = useState(!rankingEnabled);

  useEffect(() => {
    if (!rankingEnabled) return undefined;
    let active = true;

    function load() {
      fetchRanking(LIMIT)
        .then((data) => {
          if (!active) return;
          setRows(data);
          setFailed(false);
        })
        .catch(() => active && setFailed(true));
    }

    load();
    const timer = setInterval(load, REFRESH_INTERVAL);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const isMine = (row) => sameText(row.name, state.codename) && sameText(row.group, state.group);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow">Top {LIMIT}</p>
      <h1 className="mt-2 text-4xl font-bold">Ranking</h1>
      <p className="mt-2 text-fg-muted">
        Pontuação atual de todos os jogadores, atualizada durante a missão. Empates são decididos
        pelo menor tempo.
      </p>

      <div className="mt-8">
        {rows === null && !failed && (
          <p className="flex items-center gap-2 text-fg-muted">
            <LuLoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> Carregando…
          </p>
        )}

        {rows === null && failed && (
          <p className="panel p-5 text-fg-muted">O ranking está indisponível no momento.</p>
        )}

        {rows?.length === 0 && (
          <p className="panel p-5 text-fg-muted">
            Ninguém começou a missão ainda. O primeiro lugar está vago.
          </p>
        )}

        {rows?.length > 0 && (
          <div className="panel overflow-hidden">
            {/* Fixed layout: the name takes all the width the other columns leave */}
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="border-b border-ink-600/60 font-mono text-xs uppercase tracking-wider text-fg-subtle">
                  <th scope="col" className="w-14 px-3 py-3 text-center sm:px-4">
                    #
                  </th>
                  <th scope="col" className="px-2 py-3">
                    Nome
                  </th>
                  <th scope="col" className="hidden w-20 px-2 py-3 sm:table-cell">
                    Turma
                  </th>
                  <th scope="col" className="hidden w-32 px-2 py-3 text-right sm:table-cell">
                    Tempo
                  </th>
                  <th scope="col" className="w-20 px-3 py-3 text-right sm:w-24 sm:px-4">
                    Pontos
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const mine = isMine(row);
                  return (
                    <tr
                      key={row.place}
                      aria-current={mine ? 'true' : undefined}
                      className={cn(
                        'border-b border-ink-600/30 last:border-0',
                        row.place === 1 && 'bg-brand-orange/[0.07]',
                        mine && 'outline outline-2 -outline-offset-2 outline-brand-orange/60',
                      )}
                    >
                      <td className="px-3 py-3 text-center sm:px-4">
                        <span
                          className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm font-semibold',
                            PLACE_STYLES[row.place] ?? 'text-fg-subtle',
                          )}
                        >
                          {row.place}
                        </span>
                      </td>
                      <td className="max-w-0 px-2 py-3">
                        {/* Full names wrap instead of being cut, so nobody is unrecognizable */}
                        <p className={cn('break-words', row.place <= 3 && 'font-semibold')}>
                          {row.name}
                          {mine && <span className="ml-2 text-sm font-normal text-brand-orange-light">você</span>}
                        </p>
                        <p className="truncate text-sm text-fg-subtle">
                          <span className="sm:hidden">{row.group} · </span>
                          {/* Discreet: the ranking includes players who have not finished yet */}
                          <span className="font-mono text-[0.65rem] uppercase tracking-wider">
                            {row.completed ? 'Concluído' : 'Em andamento'}
                          </span>
                        </p>
                      </td>
                      <td className="hidden max-w-[10rem] truncate px-2 py-3 text-fg-muted sm:table-cell">
                        {row.group}
                      </td>
                      <td className="hidden whitespace-nowrap px-2 py-3 text-right font-mono text-sm text-fg-subtle sm:table-cell">
                        {formatDuration(row.totalSeconds * 1000)}
                      </td>
                      <td className="whitespace-nowrap px-3 py-3 text-right font-mono font-semibold sm:px-4">
                        {row.score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
