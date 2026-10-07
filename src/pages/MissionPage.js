import { useLocation } from 'react-router-dom';
import { LuArrowRight, LuCheck, LuLock, LuLockOpen, LuTrophy } from 'react-icons/lu';
import { challengePath, tiers } from '../challenges';
import Button from '../components/ui/Button';
import FeedbackMessage from '../components/ui/FeedbackMessage';
import { useGame } from '../game/GameProvider';
import { getChallengeScore, getStatus, getSummary, isSolved } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { cn } from '../utils/format';

const STATUS_TEXT = { solved: 'Concluída', available: 'Liberada', locked: 'Bloqueada' };

function StatusTag({ status }) {
  const Icon = { solved: LuCheck, available: LuLockOpen, locked: LuLock }[status];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-mono text-xs font-semibold uppercase tracking-wider',
        status === 'solved' && 'text-success',
        status === 'available' && 'text-brand-orange-light',
        status === 'locked' && 'text-fg-subtle',
      )}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {STATUS_TEXT[status]}
    </span>
  );
}

function ChallengeAction({ challenge, status }) {
  if (status === 'locked') return null;
  if (status === 'solved') {
    return (
      <Button to={challengePath(challenge)} variant="secondary" size="sm">
        Revisar<span className="sr-only"> {challenge.title}</span>
      </Button>
    );
  }
  return (
    <Button to={challengePath(challenge)} size="sm">
      Jogar<span className="sr-only"> {challenge.title}</span>
      <LuArrowRight className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}

function ChallengeCard({ challenge, status, earned, stacked, children }) {
  return (
    <li
      className={cn(
        'panel flex gap-4 p-4',
        stacked ? 'flex-col' : 'flex-col sm:flex-row sm:items-center',
        status === 'available' && 'border-brand-orange/50',
        status === 'solved' && 'border-success/40',
      )}
    >
      <div className={cn('flex min-w-0 flex-1 items-center gap-3', status === 'locked' && 'opacity-60')}>
        <span
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold',
            status === 'solved' && 'border-success text-success',
            status === 'available' && 'border-brand-orange text-brand-orange-light',
            status === 'locked' && 'border-ink-600 text-fg-subtle',
          )}
          aria-hidden="true"
        >
          {status === 'solved' ? (
            <LuCheck className="h-5 w-5" />
          ) : challenge.code === 'FINAL' ? (
            <LuTrophy className="h-4 w-4" />
          ) : (
            challenge.code
          )}
        </span>
        <div className="min-w-0">
          <h3 className="text-lg font-semibold leading-tight">{challenge.title}</h3>
          <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <StatusTag status={status} />
            <span className={cn('font-mono text-xs', status === 'solved' ? 'text-success' : 'text-fg-subtle')}>
              {status === 'solved' ? `+${earned} pts` : `até ${challenge.points} pts`}
            </span>
          </p>
        </div>
      </div>
      {children}
      <div className={cn('shrink-0', stacked && 'mt-auto')}>
        <ChallengeAction challenge={challenge} status={status} />
      </div>
    </li>
  );
}

// Vertical link between two groups of the map
function Connector({ done }) {
  return (
    <div className="flex justify-center py-1.5" aria-hidden="true">
      <span className={cn('h-7 w-0.5 rounded', done ? 'bg-success' : 'bg-ink-600')} />
    </div>
  );
}

export default function MissionPage() {
  useDocumentTitle('Mapa da missão');
  const { state } = useGame();
  const location = useLocation();
  const summary = getSummary(state);
  const notice = location.state?.notice;
  const [opening, investigations, finale] = tiers;

  const feedback = notice
    ? { key: 'notice', tone: 'info', title: notice.title, message: notice.message }
    : null;

  const card = (challenge, props) => (
    <ChallengeCard
      key={challenge.id}
      challenge={challenge}
      status={getStatus(state, challenge)}
      earned={getChallengeScore(state, challenge)}
      {...props}
    />
  );

  const openingDone = opening.every((challenge) => isSolved(state, challenge.id));
  const investigationsDone = investigations.filter((challenge) => isSolved(state, challenge.id)).length;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">Mapa da missão</h1>
        {summary.isComplete && (
          <Button to="/conclusao">
            <LuTrophy className="h-5 w-5" aria-hidden="true" /> Ver resultado
          </Button>
        )}
      </div>

      <p className="mt-2 font-mono text-sm text-fg-muted">
        {summary.solvedCount}/{summary.total} fases · {summary.score} pts
      </p>

      <FeedbackMessage feedback={feedback} className={feedback ? 'mt-6' : undefined} />

      <section className="mt-8" aria-labelledby="mapa-inicio">
        <h2 id="mapa-inicio" className="eyebrow">
          Ponto de partida
        </h2>
        <ul className="mt-3">{opening.map((challenge) => card(challenge))}</ul>
      </section>

      <Connector done={openingDone} />

      <section aria-labelledby="mapa-investigacoes">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="mapa-investigacoes" className="eyebrow">
            Investigações · escolha por onde começar
          </h2>
          <p className="font-mono text-xs text-fg-subtle">
            {investigationsDone}/{investigations.length} concluídas
          </p>
        </div>
        <ul className="mt-3 grid gap-3 sm:grid-cols-3">
          {investigations.map((challenge) => card(challenge, { stacked: true }))}
        </ul>
      </section>

      <Connector done={investigationsDone === investigations.length} />

      <section aria-labelledby="mapa-final">
        <h2 id="mapa-final" className="eyebrow">
          Fase final
        </h2>
        <ul className="mt-3">
          {finale.map((challenge) =>
            card(challenge, {
              children: getStatus(state, challenge) === 'locked' && (
                <p className="font-mono text-xs font-semibold uppercase tracking-wider text-fg-subtle sm:text-right">
                  Conclua as {investigations.length} investigações para liberar o cofre
                </p>
              ),
            }),
          )}
        </ul>
      </section>
    </div>
  );
}
