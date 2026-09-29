import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LuArrowRight, LuCheck, LuLock, LuRotateCcw, LuTrophy } from 'react-icons/lu';
import { challengePath, challenges } from '../challenges';
import { challengeLabel } from '../components/challenge/ChallengeHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DifficultyMeter from '../components/ui/DifficultyMeter';
import FeedbackMessage from '../components/ui/FeedbackMessage';
import { useGame } from '../game/GameProvider';
import { getChallengeScore, getProgress, getStatus, getSummary } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { cn } from '../utils/format';

function Stat({ label, value, detail }) {
  return (
    <div className="panel px-4 py-3.5">
      <dt className="text-sm text-fg-subtle">{label}</dt>
      <dd className="mt-1 font-display text-2xl font-bold">
        {value}
        {detail && <span className="ml-1 text-base font-medium text-fg-subtle">{detail}</span>}
      </dd>
    </div>
  );
}

function ChallengeAction({ challenge, status }) {
  if (status === 'locked') {
    return (
      <p className="flex items-center gap-2 text-sm text-fg-subtle">
        <LuLock className="h-4 w-4" aria-hidden="true" /> Conclua a etapa anterior para liberar
      </p>
    );
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
  const { state, resetMission } = useGame();
  const location = useLocation();
  const summary = getSummary(state);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const notice = location.state?.notice;
  const percent = Math.round((summary.solvedCount / summary.total) * 100);

  const feedback = resetDone
    ? { key: 'reset', tone: 'info', title: 'Missão reiniciada', message: 'Todo o progresso foi apagado. Boa sorte na nova tentativa!' }
    : notice
      ? { key: 'notice', tone: 'info', title: notice.title, message: notice.message }
      : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="eyebrow">Operação cas@viva</p>
      <h1 className="mt-2 text-4xl font-bold">Mapa da missão</h1>
      <p className="mt-2 text-lg text-fg-muted">
        Acompanhe seu progresso e retome de onde parou. As etapas são liberadas em sequência.
      </p>

      <FeedbackMessage feedback={feedback} className={feedback ? 'mt-6' : undefined} />

      <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Flags" value={summary.solvedCount} detail={`/ ${summary.total}`} />
        <Stat label="Pontuação" value={summary.score} detail={`/ ${summary.maxScore}`} />
        <Stat label="Dicas usadas" value={summary.hintsUsed} />
        <Stat label="Envios" value={summary.attempts} />
      </dl>

      <div className="mt-5">
        <div className="flex justify-between text-sm text-fg-muted">
          <span id="progresso-label">Progresso da missão</span>
          <span className="font-mono">{percent}%</span>
        </div>
        <div
          className="mt-2 h-2.5 overflow-hidden rounded-full bg-ink-700"
          role="progressbar"
          aria-labelledby="progresso-label"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-orange to-brand-orange-light transition-[width] duration-700"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {summary.isComplete && (
        <div className="panel mt-8 flex flex-col items-start gap-4 border-brand-orange/50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3 font-display text-lg font-semibold">
            <LuTrophy className="h-6 w-6 text-brand-orange" aria-hidden="true" />
            Todas as flags capturadas!
          </p>
          <Button to="/conclusao">Ver certificado</Button>
        </div>
      )}

      <ol className="relative mt-10 space-y-4 before:absolute before:bottom-6 before:left-[1.1875rem] before:top-6 before:w-0.5 before:bg-ink-600">
        {challenges.map((challenge) => {
          const status = getStatus(state, challenge);
          const progress = getProgress(state, challenge.id);
          return (
            <li key={challenge.id} className="relative flex gap-4">
              <span
                className={cn(
                  'relative z-10 mt-5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 font-mono text-xs font-semibold',
                  status === 'solved' && 'border-success bg-ink-900 text-success',
                  status === 'available' && 'border-brand-orange bg-ink-900 text-brand-orange-light animate-pulse-ring',
                  status === 'locked' && 'border-ink-600 bg-ink-900 text-fg-subtle',
                )}
                aria-hidden="true"
              >
                {status === 'solved' ? <LuCheck className="h-5 w-5" /> : challenge.code === 'FINAL' ? <LuTrophy className="h-4 w-4" /> : challenge.code}
              </span>

              <article
                className={cn(
                  'panel min-w-0 flex-1 p-5',
                  status === 'available' && 'border-brand-orange/50',
                  status === 'locked' && 'opacity-70',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-mono text-xs uppercase tracking-wider text-fg-subtle">
                      {challengeLabel(challenge)} · {challenge.category}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{challenge.title}</h2>
                  </div>
                  {status === 'solved' ? (
                    <Badge tone="success">
                      +{getChallengeScore(state, challenge)} pts
                    </Badge>
                  ) : (
                    <Badge tone={status === 'available' ? 'orange' : 'neutral'}>
                      {challenge.points} pts
                    </Badge>
                  )}
                </div>
                <p className="mt-2 text-fg-muted">{challenge.summary}</p>
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <DifficultyMeter level={challenge.difficulty} />
                    {progress.hintsRevealed > 0 && (
                      <span className="font-mono text-xs text-warning">
                        {progress.hintsRevealed} {progress.hintsRevealed === 1 ? 'dica' : 'dicas'}
                      </span>
                    )}
                  </div>
                  <ChallengeAction challenge={challenge} status={status} />
                </div>
              </article>
            </li>
          );
        })}
      </ol>

      {summary.hasStarted && (
        <div className="mt-12 border-t border-ink-600/40 pt-6">
          <Button variant="ghost" onClick={() => setConfirmReset(true)}>
            <LuRotateCcw className="h-4 w-4" aria-hidden="true" /> Reiniciar missão
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reiniciar a missão?"
        description="Todas as flags, pontos e dicas serão apagados, e você voltará ao Briefing. Esta ação não pode ser desfeita."
        confirmLabel="Reiniciar"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetMission();
          setConfirmReset(false);
          setResetDone(true);
        }}
      />
    </div>
  );
}
