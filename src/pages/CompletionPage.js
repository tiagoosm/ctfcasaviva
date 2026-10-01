import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LuAward, LuPrinter, LuRotateCcw } from 'react-icons/lu';
import Confetti from '../components/Confetti';
import { LOGO_SRC } from '../components/layout/BrandMark';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useGame } from '../game/GameProvider';
import { getRank, getSummary } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatDate, formatDuration } from '../utils/format';

export default function CompletionPage() {
  useDocumentTitle('Missão cumprida');
  const { state, resetMission } = useGame();
  const summary = getSummary(state);
  const navigate = useNavigate();
  const [confirmReset, setConfirmReset] = useState(false);
  const resetting = useRef(false);

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

  const rank = getRank(summary.score, summary.maxScore);
  const name = state.codename || 'Investigador(a)';

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
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-brand-blue">
              Certificado · CTF
            </p>
          </div>

          <p className="mt-8 text-sm uppercase tracking-widest text-paper-ink/70">Concedido a</p>
          <h2 id="certificado-titulo" className="mt-1 break-words text-3xl font-bold sm:text-4xl">
            {name}
          </h2>
          <p className="mt-3 max-w-xl leading-relaxed text-paper-ink/80">
            por concluir todas as etapas do Capture The Flag do Inatel cas@viva.
          </p>

          <div className="mt-8 flex flex-col gap-6 border-t-2 border-dashed border-paper-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white animate-pop">
                <LuAward className="h-9 w-9" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-paper-ink/70">Título</p>
                <p className="font-display text-2xl font-bold text-brand-blue">{rank.title}</p>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-4 text-center sm:text-right">
              <div>
                <dt className="text-xs text-paper-ink/70">Pontos</dt>
                <dd className="font-mono text-lg font-semibold">
                  {summary.score}
                  <span className="text-sm text-paper-ink/60">/{summary.maxScore}</span>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-paper-ink/70">Tempo</dt>
                <dd className="font-mono text-lg font-semibold">{formatDuration(summary.duration)}</dd>
              </div>
              <div>
                <dt className="text-xs text-paper-ink/70">Dicas</dt>
                <dd className="font-mono text-lg font-semibold">{summary.hintsUsed}</dd>
              </div>
            </dl>
          </div>
          {state.finishedAt && (
            <p className="mt-6 text-right text-sm text-paper-ink/70">{formatDate(state.finishedAt)}</p>
          )}
        </div>
      </article>

      <div className="no-print mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Button onClick={() => window.print()} size="lg">
          <LuPrinter className="h-5 w-5" aria-hidden="true" /> Imprimir certificado
        </Button>
        <Button variant="secondary" size="lg" onClick={() => setConfirmReset(true)}>
          <LuRotateCcw className="h-5 w-5" aria-hidden="true" /> Jogar novamente
        </Button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Jogar novamente?"
        description="O certificado e a pontuação atual serão apagados."
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
