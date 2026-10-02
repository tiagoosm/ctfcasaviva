import { useEffect, useId, useState } from 'react';
import { LuCheck, LuEye, LuEyeOff, LuLoaderCircle, LuTrash2 } from 'react-icons/lu';
import { challenges } from '../challenges';
import { CODENAME_MAX_LENGTH } from '../game/gameReducer';
import { GROUPS, isValidGroup } from '../game/groups';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { cn, formatClock, formatDateTime } from '../utils/format';
import { useAdmin } from './context';
import { deletePlayer, getPlayer, setPlayerHidden, updatePlayer } from './api';

const titles = Object.fromEntries(challenges.map((challenge) => [challenge.id, challenge.title]));

const inputClasses =
  'mt-1 h-11 w-full rounded-xl border border-ink-600 bg-ink-950/70 px-3 text-base focus:border-brand-orange focus:outline-none';

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-fg-subtle">{label}</dt>
      <dd className="font-mono font-semibold">{children}</dd>
    </div>
  );
}

export default function PlayerDialog({ playerId, onClose, onChanged }) {
  const { onExpired } = useAdmin();
  const [player, setPlayer] = useState(null);
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const nameId = useId();
  const groupId = useId();

  function fail(error) {
    if (error.unauthorized) onExpired();
    else setMessage({ tone: 'error', text: 'Não foi possível concluir a ação. Tente de novo.' });
  }

  useEffect(() => {
    setPlayer(null);
    setMessage(null);
    setConfirmingDelete(false);
    if (!playerId) return undefined;

    let active = true;
    getPlayer(playerId)
      .then((data) => {
        if (!active) return;
        if (!data) return onClose();
        setPlayer(data);
        setName(data.name);
        setGroup(data.group);
      })
      .catch((error) => active && fail(error));
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId]);

  async function run(action, after) {
    if (busy) return;
    setBusy(true);
    setMessage(null);
    try {
      await action();
      onChanged();
      after();
    } catch (error) {
      fail(error);
    } finally {
      setBusy(false);
    }
  }

  function handleSave(event) {
    event.preventDefault();
    const nextName = name.replace(/\s+/g, ' ').trim();
    const nextGroup = group.replace(/\s+/g, ' ').trim();
    if (!nextName || !isValidGroup(nextGroup)) {
      setMessage({ tone: 'error', text: 'Informe o nome e escolha uma turma válida.' });
      return;
    }
    run(
      () => updatePlayer(player.id, nextName, nextGroup),
      () => {
        setPlayer((current) => ({ ...current, name: nextName, group: nextGroup }));
        setName(nextName);
        setGroup(nextGroup);
        setMessage({ tone: 'success', text: 'Dados atualizados.' });
      },
    );
  }

  const solved = player?.challenges.filter((item) => item.solvedAt) ?? [];
  const totalScore = solved.reduce((sum, item) => sum + (item.score ?? 0), 0);
  const unchanged = player && name === player.name && group === player.group;

  return (
    <Modal open={Boolean(playerId)} onClose={onClose} size="xl" title={player?.name ?? 'Jogador'}>
      {!player ? (
        <p className="flex items-center gap-2 p-6 text-fg-muted">
          <LuLoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> Carregando…
        </p>
      ) : (
        <div className="space-y-7 p-5 sm:p-6">
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Fact label="Pontuação total">{totalScore}</Fact>
            <Fact label={player.finishedAt ? "Tempo total" : "Tempo decorrido"}>
              {formatClock(player.totalSeconds)}
            </Fact>
            <Fact label="Início">{formatDateTime(player.startedAt)}</Fact>
            <Fact label="Conclusão">
              {player.finishedAt ? formatDateTime(player.finishedAt) : 'Em andamento'}
            </Fact>
          </dl>

          <div className="scrollbar-thin overflow-x-auto rounded-xl border border-ink-600/60">
            <table className="w-full min-w-[32rem] border-collapse text-left">
              <caption className="sr-only">Histórico por fase</caption>
              <thead>
                <tr className="border-b border-ink-600/60 font-mono text-xs uppercase tracking-wider text-fg-subtle">
                  <th scope="col" className="px-4 py-2.5">
                    Fase
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right">
                    Tempo na fase
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-right">
                    Erros
                  </th>
                  <th scope="col" className="px-3 py-2.5 text-center">
                    Dica
                  </th>
                  <th scope="col" className="px-4 py-2.5 text-right">
                    Pontos
                  </th>
                </tr>
              </thead>
              <tbody>
                {player.challenges.map((item) => (
                  <tr key={item.id} className="border-b border-ink-600/30 last:border-0">
                    <th scope="row" className="px-4 py-2.5 font-normal">
                      <span className="flex items-center gap-2">
                        {item.solvedAt ? (
                          <LuCheck className="h-4 w-4 text-success" role="img" aria-label="Concluída" />
                        ) : (
                          <span className="inline-block h-4 w-4" />
                        )}
                        {titles[item.id] ?? item.id}
                      </span>
                      {!item.solvedAt && (
                        <span className="ml-6 text-xs text-fg-subtle">
                          {item.enteredAt ? 'Em andamento' : 'Não iniciada'}
                        </span>
                      )}
                    </th>
                    <td className="px-3 py-2.5 text-right font-mono text-sm">
                      {item.solvedAt ? formatClock(item.seconds) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-sm">{item.wrong}</td>
                    <td className="px-3 py-2.5 text-center text-sm">{item.hintUsed ? 'Sim' : '—'}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-sm">
                      <span className="font-semibold">{item.solvedAt ? item.score : '—'}</span>
                      <span className="text-fg-subtle"> / {item.maxPoints}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <form onSubmit={handleSave} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_auto] sm:items-end">
            <div>
              <label htmlFor={nameId} className="text-sm font-medium text-fg-muted">
                Nome
              </label>
              <input
                id={nameId}
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={CODENAME_MAX_LENGTH}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor={groupId} className="text-sm font-medium text-fg-muted">
                Turma
              </label>
              <select
                id={groupId}
                value={group}
                onChange={(event) => setGroup(event.target.value)}
                className={inputClasses}
              >
                {/* A class saved before the list was fixed stays visible until corrected */}
                {!isValidGroup(group) && <option value={group}>{group}</option>}
                {GROUPS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" disabled={busy || unchanged}>
              Salvar
            </Button>
          </form>

          <div aria-live="polite">
            {message && (
              <p className={cn('text-sm', message.tone === 'error' ? 'text-danger' : 'text-success')}>
                {message.text}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-ink-600/50 pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() =>
                run(
                  () => setPlayerHidden(player.id, !player.hidden),
                  () => {
                    setPlayer((current) => ({ ...current, hidden: !current.hidden }));
                    setMessage({
                      tone: 'success',
                      text: player.hidden
                        ? 'O resultado voltou ao ranking público.'
                        : 'O resultado foi ocultado do ranking público.',
                    });
                  },
                )
              }
            >
              {player.hidden ? (
                <>
                  <LuEye className="h-4 w-4" aria-hidden="true" /> Mostrar no ranking
                </>
              ) : (
                <>
                  <LuEyeOff className="h-4 w-4" aria-hidden="true" /> Ocultar do ranking
                </>
              )}
            </Button>

            {confirmingDelete ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center" role="group" aria-label="Confirmar exclusão">
                <p className="text-sm text-fg-muted">Excluir de vez? Não pode ser desfeito.</p>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    disabled={busy}
                    onClick={() => run(() => deletePlayer(player.id), onClose)}
                  >
                    Excluir definitivamente
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="danger" disabled={busy} onClick={() => setConfirmingDelete(true)}>
                <LuTrash2 className="h-4 w-4" aria-hidden="true" /> Excluir resultado
              </Button>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
