import { useLocation } from 'react-router-dom';
import { LuArrowRight, LuCheck, LuLock, LuTrophy } from 'react-icons/lu';
import { challengePath, challenges } from '../challenges';
import Button from '../components/ui/Button';
import FeedbackMessage from '../components/ui/FeedbackMessage';
import { useGame } from '../game/GameProvider';
import { getChallengeScore, getStatus, getSummary } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { cn } from '../utils/format';

function ChallengeAction({ challenge, status }) {
  if (status === 'locked') {
    return <LuLock className="h-5 w-5 text-fg-subtle" role="img" aria-label="Bloqueado" />;
  }
  if (status === 'solved') {
    return (
      <Button to={challengePath(challenge)} variant="secondary" size="sm">
        Revisar<span className="sr-only"> {challenge.title}</span>
      </Button>
    );
  }
  return (
    <Button to={challengePath(challenge)}>
      Jogar<span className="sr-only"> {challenge.title}</span>
      <LuArrowRight className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}

export default function MissionPage() {
  useDocumentTitle('Mapa da missão');
  const { state } = useGame();
  const location = useLocation();
  const summary = getSummary(state);
  const notice = location.state?.notice;

  const feedback = notice
    ? { key: 'notice', tone: 'info', title: notice.title, message: notice.message }
    : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-4xl font-bold">Mapa da missão</h1>
        {summary.isComplete && (
          <Button to="/conclusao">
            <LuTrophy className="h-5 w-5" aria-hidden="true" /> Ver resultado
          </Button>
        )}
      </div>

      <p className="mt-2 font-mono text-sm text-fg-muted">
        {summary.solvedCount}/{summary.total} etapas · {summary.score} pts
      </p>

      <FeedbackMessage feedback={feedback} className={feedback ? 'mt-6' : undefined} />

      <ol className="mt-8 space-y-3">
        {challenges.map((challenge) => {
          const status = getStatus(state, challenge);
          return (
            <li
              key={challenge.id}
              className={cn(
                'panel flex items-center gap-4 p-4',
                status === 'available' && 'border-brand-orange/50',
                status === 'locked' && 'opacity-60',
              )}
            >
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
              <div className="min-w-0 flex-1">
                <h2 className="truncate text-lg font-semibold">{challenge.title}</h2>
                <p className={cn('font-mono text-xs', status === 'solved' ? 'text-success' : 'text-fg-subtle')}>
                  {status === 'solved'
                    ? `+${getChallengeScore(state, challenge)} pts`
                    : `até ${challenge.points} pts`}
                </p>
              </div>
              <ChallengeAction challenge={challenge} status={status} />
            </li>
          );
        })}
      </ol>
    </div>
  );
}
