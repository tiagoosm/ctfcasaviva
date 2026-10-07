import { Link } from 'react-router-dom';
import { LuCheck, LuLock, LuTrophy } from 'react-icons/lu';
import { challengePath, tiers } from '../../challenges';
import { useGame } from '../../game/GameProvider';
import { getStatus } from '../../game/selectors';
import { cn } from '../../utils/format';

const STATUS_LABEL = { solved: 'concluído', available: 'disponível', locked: 'bloqueado' };

function NodeContent({ challenge, status }) {
  if (status === 'solved') return <LuCheck className="h-5 w-5" aria-hidden="true" />;
  if (status === 'locked') return <LuLock className="h-4 w-4" aria-hidden="true" />;
  if (challenge.code === 'FINAL') return <LuTrophy className="h-5 w-5" aria-hidden="true" />;
  return <span aria-hidden="true">{challenge.code}</span>;
}

function Node({ challenge, status, isCurrent }) {
  const label = `${challenge.code === 'FINAL' ? 'Final' : `Desafio ${challenge.code}`}: ${
    challenge.title
  } — ${isCurrent ? 'você está aqui' : STATUS_LABEL[status]}`;

  const nodeClasses = cn(
    'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-mono text-sm font-semibold transition-colors',
    status === 'solved' && 'border-success bg-success/15 text-success',
    status === 'available' && 'border-brand-orange bg-brand-orange/15 text-brand-orange-light',
    status === 'locked' && 'border-ink-600 bg-ink-850 text-fg-subtle',
    isCurrent && 'ring-4 ring-brand-orange/25',
    isCurrent && status === 'available' && 'animate-pulse-ring',
  );

  return (
    <li className="flex w-10 flex-col items-center">
      {status === 'locked' ? (
        <span className={nodeClasses} aria-label={label} role="img">
          <NodeContent challenge={challenge} status={status} />
        </span>
      ) : (
        <Link
          to={challengePath(challenge)}
          className={cn(nodeClasses, 'hover:scale-105')}
          aria-label={label}
          aria-current={isCurrent ? 'step' : undefined}
        >
          <NodeContent challenge={challenge} status={status} />
        </Link>
      )}
      <span
        className={cn(
          'mt-2 hidden whitespace-nowrap text-center font-display text-xs md:block',
          isCurrent ? 'font-semibold text-fg' : 'text-fg-subtle',
        )}
        aria-hidden="true"
      >
        {challenge.title}
      </span>
    </li>
  );
}

// The mission as tiers: the opening stage, the investigations that can be
// played in any order (side by side), then the final stage
export default function ProgressTrack({ currentId }) {
  const { state } = useGame();

  return (
    <nav aria-label="Progresso da missão">
      <ol className="flex items-start">
        {tiers.map((tier, index) => {
          const isLast = index === tiers.length - 1;
          const tierDone = tier.every((challenge) => getStatus(state, challenge) === 'solved');
          return (
            // `grow` (not flex-1) shares only the spare width, so both connectors
            // get the same length however many nodes a tier has
            <li key={tier[0].id} className={cn('flex items-start', !isLast && 'grow')}>
              <ul
                className={cn(
                  'flex items-start',
                  tier.length > 1 && 'gap-2 sm:gap-4 md:gap-14',
                )}
              >
                {tier.map((challenge) => (
                  <Node
                    key={challenge.id}
                    challenge={challenge}
                    status={getStatus(state, challenge)}
                    isCurrent={challenge.id === currentId}
                  />
                ))}
              </ul>
              {!isLast && (
                <span
                  className="mx-1 mt-[19px] h-0.5 flex-1 overflow-hidden rounded bg-ink-600 sm:mx-2 md:mx-6"
                  aria-hidden="true"
                >
                  <span
                    className={cn(
                      'block h-full origin-left bg-success transition-transform duration-700',
                      tierDone ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
