import { useRef, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LuAward, LuMap, LuPrinter, LuRotateCcw } from 'react-icons/lu';
import { challenges } from '../challenges';
import { challengeLabel } from '../components/challenge/ChallengeHeader';
import Confetti from '../components/Confetti';
import { LOGO_SRC } from '../components/layout/BrandMark';
import Button from '../components/ui/Button';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { useGame } from '../game/GameProvider';
import { getChallengeScore, getProgress, getRank, getSummary } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { formatDate, formatDuration, pluralize } from '../utils/format';

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
            message: 'Capture todas as flags para liberar o resultado final da missão.',
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

      <header className="text-center">
        <p className="eyebrow">Operação cas@viva concluída</p>
        <h1 className="mt-3 text-4xl font-bold sm:text-6xl">
          Missão <span className="text-brand-orange">cumprida</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-fg-muted">
          Você observou o que estava escondido, encontrou o padrão, quebrou duas cifras e abriu o
          cofre. Esse é o raciocínio de quem trabalha com segurança da informação.
        </p>
      </header>

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
            por concluir todas as etapas do Capture The Flag do Inatel cas@viva, aplicando
            observação, lógica e criptografia.
          </p>

          <div className="mt-8 flex flex-col gap-6 border-t-2 border-dashed border-paper-line pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-orange text-white animate-pop">
                <LuAward className="h-9 w-9" aria-hidden="true" />
              </span>
              <div>
                <p className="text-xs uppercase tracking-widest text-paper-ink/70">Título conquistado</p>
                <p className="font-display text-2xl font-bold text-brand-blue">{rank.title}</p>
                <p className="text-sm text-paper-ink/75">{rank.description}</p>
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
        <Button to="/missao" variant="secondary" size="lg">
          <LuMap className="h-5 w-5" aria-hidden="true" /> Rever desafios
        </Button>
      </div>

      <section className="no-print mt-16" aria-labelledby="recapitulacao">
        <h2 id="recapitulacao" className="text-2xl font-bold sm:text-3xl">
          O que você aprendeu
        </h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-2">
          {challenges.map((challenge) => {
            const progress = getProgress(state, challenge.id);
            return (
              <li key={challenge.id} className="panel p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-xs uppercase tracking-wider text-brand-orange-light">
                    {challengeLabel(challenge)} · {challenge.skill}
                  </p>
                  <span className="font-mono text-sm text-success">
                    +{getChallengeScore(state, challenge)}
                  </span>
                </div>
                <h3 className="mt-2 text-lg font-semibold">{challenge.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{challenge.success.lesson}</p>
                <p className="mt-3 font-mono text-xs text-fg-subtle">
                  {pluralize(progress.attempts, 'envio', 'envios')} ·{' '}
                  {pluralize(progress.hintsRevealed, 'dica', 'dicas')}
                </p>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="no-print mt-12 text-center">
        <Button variant="ghost" onClick={() => setConfirmReset(true)}>
          <LuRotateCcw className="h-4 w-4" aria-hidden="true" /> Jogar novamente
        </Button>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Jogar novamente?"
        description="Seu certificado e toda a pontuação atual serão apagados para começar uma nova missão do zero."
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
