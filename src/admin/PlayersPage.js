import { useId, useMemo, useState } from 'react';
import { LuEyeOff, LuLoaderCircle, LuRefreshCw, LuSearch } from 'react-icons/lu';
import { challenges } from '../challenges';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { cn, formatClock, formatDateTime } from '../utils/format';
import { useAdminData } from './context';
import { listPlayers } from './api';
import PlayerDialog from './PlayerDialog';

const SORTS = {
  score: {
    label: 'Maior pontuação',
    compare: (a, b) => b.score - a.score || a.totalSeconds - b.totalSeconds,
  },
  recent: {
    label: 'Mais recentes',
    compare: (a, b) => new Date(b.startedAt) - new Date(a.startedAt),
  },
  name: { label: 'Nome', compare: (a, b) => a.name.localeCompare(b.name, 'pt-BR') },
};

const STATUSES = { all: 'Todos', finished: 'Concluído', playing: 'Em andamento' };

const fieldClasses =
  'h-11 rounded-xl border border-ink-600 bg-ink-950/70 px-3 text-base focus:border-brand-orange focus:outline-none';

const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

export default function PlayersPage() {
  useDocumentTitle('Jogadores · Administração');
  const { data, loading, failed, reload } = useAdminData(listPlayers);
  const [search, setSearch] = useState('');
  const [group, setGroup] = useState('');
  const [status, setStatus] = useState('all');
  const [sort, setSort] = useState('score');
  const [openId, setOpenId] = useState(null);
  const searchId = useId();
  const groupId = useId();
  const statusId = useId();
  const sortId = useId();

  const players = useMemo(() => data ?? [], [data]);
  const groups = useMemo(
    () => [...new Set(players.map((player) => player.group))].sort((a, b) => a.localeCompare(b, 'pt-BR')),
    [players],
  );

  const visible = useMemo(() => {
    const term = normalize(search.trim());
    return players
      .filter((player) => !term || normalize(player.name).includes(term))
      .filter((player) => !group || player.group === group)
      .filter(
        (player) =>
          status === 'all' || (status === 'finished' ? player.finishedAt : !player.finishedAt),
      )
      .sort(SORTS[sort].compare);
  }, [players, search, group, status, sort]);

  const finishedCount = players.filter((player) => player.finishedAt).length;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold sm:text-4xl">Jogadores</h1>
          {data && (
            <p className="mt-1 text-fg-muted">
              {players.length} {players.length === 1 ? 'participação' : 'participações'} ·{' '}
              {finishedCount} {finishedCount === 1 ? 'concluída' : 'concluídas'}
            </p>
          )}
        </div>
        <Button variant="secondary" onClick={reload} disabled={loading}>
          <LuRefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} aria-hidden="true" />
          Atualizar
        </Button>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
        <div className="relative">
          <label htmlFor={searchId} className="sr-only">
            Pesquisar por nome
          </label>
          <LuSearch
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Pesquisar por nome"
            className={cn(fieldClasses, 'w-full pl-9 placeholder:text-fg-subtle/70')}
          />
        </div>
        <div>
          <label htmlFor={groupId} className="sr-only">
            Turma
          </label>
          <select
            id={groupId}
            value={group}
            onChange={(event) => setGroup(event.target.value)}
            className={cn(fieldClasses, 'w-full')}
          >
            <option value="">Todas as turmas</option>
            {groups.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={statusId} className="sr-only">
            Status
          </label>
          <select
            id={statusId}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={cn(fieldClasses, 'w-full')}
          >
            {Object.entries(STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {value === 'all' ? 'Todos os status' : label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={sortId} className="sr-only">
            Ordenar por
          </label>
          <select
            id={sortId}
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            className={cn(fieldClasses, 'w-full')}
          >
            {Object.entries(SORTS).map(([value, option]) => (
              <option key={value} value={value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6">
        {!data && loading && (
          <p className="flex items-center gap-2 text-fg-muted">
            <LuLoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> Carregando…
          </p>
        )}
        {failed && <p className="panel p-5 text-fg-muted">Não foi possível carregar os jogadores.</p>}
        {data && visible.length === 0 && (
          <p className="panel p-5 text-fg-muted">
            {players.length === 0 ? 'Ninguém jogou ainda.' : 'Nenhum jogador com esses filtros.'}
          </p>
        )}

        {visible.length > 0 && (
          <div className="panel scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[46rem] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink-600/60 font-mono text-xs uppercase tracking-wider text-fg-subtle">
                  <th scope="col" className="px-4 py-3">
                    Nome
                  </th>
                  <th scope="col" className="px-3 py-3">
                    Turma
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Pontos
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Tempo
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Erros
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Dicas
                  </th>
                  <th scope="col" className="px-3 py-3 text-right">
                    Fases
                  </th>
                  <th scope="col" className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((player) => (
                  <tr
                    key={player.id}
                    className="border-b border-ink-600/30 last:border-0 hover:bg-ink-800/60"
                  >
                    <th scope="row" className="max-w-[16rem] px-4 py-2 font-normal">
                      <button
                        type="button"
                        onClick={() => setOpenId(player.id)}
                        className="flex min-h-11 w-full items-center gap-2 text-left font-semibold hover:text-brand-orange-light"
                      >
                        <span className="truncate">{player.name}</span>
                        {player.hidden && (
                          <LuEyeOff
                            className="h-4 w-4 shrink-0 text-warning"
                            role="img"
                            aria-label="Oculto do ranking"
                          />
                        )}
                      </button>
                    </th>
                    <td className="max-w-[10rem] truncate px-3 py-2 text-fg-muted">{player.group}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">{player.score}</td>
                    <td className="px-3 py-2 text-right font-mono text-sm">
                      {formatClock(player.totalSeconds)}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-sm">{player.errors}</td>
                    <td className="px-3 py-2 text-right font-mono text-sm">{player.hints}</td>
                    <td className="px-3 py-2 text-right font-mono text-sm">
                      {player.solved}/{challenges.length}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 text-sm">
                      {player.finishedAt ? (
                        <>
                          <span className="font-semibold text-success">Concluído</span>
                          <span className="block text-xs text-fg-subtle">
                            {formatDateTime(player.finishedAt)}
                          </span>
                        </>
                      ) : (
                        <span className="text-warning">Em andamento</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <PlayerDialog playerId={openId} onClose={() => setOpenId(null)} onChanged={reload} />
    </>
  );
}
