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

  // Each stage is a pin on the board: orange once solved, a paper tag while
  // open, a dull grey pin while locked
  const nodeClasses = cn(
    'relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-sm font-semibold shadow-[0_3px_4px_rgba(0,0,0,0.45)] transition-transform',
    status === 'solved' && 'bg-[radial-gradient(circle_at_35%_30%,#FFC28A_0_15%,#E87000_50%,#8F4300_100%)] text-night',
    status === 'available' && 'bg-white text-brand-blue',
    status === 'locked' && 'bg-[#3A5A86] text-[#C9D6E8]',
    isCurrent && 'outline outline-[3px] outline-offset-[3px] outline-white',
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
          isCurrent ? 'font-extrabold text-fg' : 'font-semibold text-fg-subtle',
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
                // The thread between two groups: taut and orange once the
                // earlier group is solved, a dashed slack line before
                <span
                  className={cn(
                    'mx-1 mt-[19px] flex-1 sm:mx-2 md:mx-6',
                    tierDone ? 'h-[3px] bg-board-thread' : 'h-0 border-t-2 border-dashed border-[#8FA9CC]/60',
                  )}
                  aria-hidden="true"
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
