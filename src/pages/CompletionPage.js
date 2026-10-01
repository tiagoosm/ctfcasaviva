import { useEffect, useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LuAward, LuListOrdered, LuPrinter, LuRotateCcw } from 'react-icons/lu';
import Confetti from '../components/Confetti';
import { LOGO_SRC } from '../components/layout/BrandMark';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useGame } from '../game/GameProvider';
import { getRank, getSummary } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatDate, formatDuration } from '../utils/format';

function Stat({ label, children }) {
  return (
    <div>
      <dt className="text-xs text-paper-ink/70">{label}</dt>
      <dd className="font-mono text-lg font-semibold">{children}</dd>
    </div>
  );
}

export default function CompletionPage() {
  useDocumentTitle('Missão cumprida');
  const { state, resetMission, refreshResult } = useGame();
  const summary = getSummary(state);
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const resetting = useRef(false);

  // The ranking place comes from the server, once it has confirmed the last answer
  useEffect(() => {
    if (summary.isComplete) refreshResult();
  }, [summary.isComplete, refreshResult]);

  // During "play again" the state resets before navigation finishes:
  // we do not want the guard below to redirect to the map in the meantime.
  if (resetting.current) return null;

  if (!summary.isComplete) {
    return (
      <Navigate
        to="/missao"
        replace
        state={{
          notice: {
            title: 'O certificado ainda está trancado',
            message: 'Conclua todas as etapas para liberá-lo.',
          },
        }}
      />
    );
  }

  // Server-confirmed numbers win over the local estimate
  const { result } = state;
  const score = result?.score ?? summary.score;
  const totalSeconds = result?.totalSeconds ?? summary.totalSeconds;
  const errors = result?.errors ?? summary.errors;
  const hints = result?.hints ?? summary.hintsUsed;
  const rank = getRank(score, summary.maxScore);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <Confetti />

      <h1 className="text-center text-4xl font-bold sm:text-6xl">
        Missão <span className="text-brand-orange">cumprida</span>
      </h1>

      <article
        className="relative mx-auto mt-10 max-w-3xl overflow-hidden rounded-2xl bg-paper text-paper-ink shadow-paper animate-fade-up"
        aria-labelledby="certificado-titulo"
      >
        <div className="h-2 bg-gradient-to-r from-brand-orange via-brand-orange-light to-brand-blue" />
        <div className="px-6 py-8 sm:px-12 sm:py-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <img src={LOGO_SRC} alt="Inatel cas@viva" width="150" height="50" className="h-11 w-auto" />
            {result?.place && (
              <p className="rounded-full bg-brand-blue px-4 py-1.5 font-mono text-sm font-semibold text-white">
                {result.place}º no ranking
              </p>
            )}
          </div>

          <h2 id="certificado-titulo" className="mt-8 break-words text-3xl font-bold sm:text-4xl">
            {state.codename}
          </h2>
          <p className="mt-1 font-mono text-sm text-paper-ink/70">Turma {state.group}</p>

          <div className="mt-8 flex flex-col gap-6 border-t-2 border-dashed border-paper-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white animate-pop">
                <LuAward className="h-9 w-9" aria-hidden="true" />
              </span>
              <div>
                <p className="font-mono text-3xl font-bold text-brand-blue">
                  {score}
                  <span className="text-base font-medium text-paper-ink/60"> / {summary.maxScore} pts</span>
                </p>
                <p className="font-display font-semibold">{rank.title}</p>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-5 text-center sm:text-right">
              <Stat label="Tempo">{formatDuration(totalSeconds * 1000)}</Stat>
              <Stat label="Erros">{errors}</Stat>
              <Stat label="Dicas">{hints}</Stat>
            </dl>
          </div>
          {state.finishedAt && (
            <p className="mt-6 text-right text-sm text-paper-ink/70">{formatDate(state.finishedAt)}</p>
          )}
        </div>
      </article>

      <div className="no-print mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button to="/ranking" size="lg">
          <LuListOrdered className="h-5 w-5" aria-hidden="true" /> Ver ranking
        </Button>
        <Button variant="secondary" size="lg" onClick={() => window.print()}>
          <LuPrinter className="h-5 w-5" aria-hidden="true" /> Imprimir
        </Button>
        <Button variant="secondary" size="lg" onClick={() => setConfirmReset(true)}>
          <LuRotateCcw className="h-5 w-5" aria-hidden="true" /> Jogar novamente
        </Button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Jogar novamente?"
        description="Você recomeça do zero. No ranking, vale o seu melhor resultado."
        confirmLabel="Recomeçar"
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          resetting.current = true;
          resetMission();
          navigate('/');
        }}
      />
    </div>
  );
}
