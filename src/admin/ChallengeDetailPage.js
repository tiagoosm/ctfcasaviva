import { useId, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LuArrowLeft, LuArrowRight } from 'react-icons/lu';
import { challenges, getChallengeBySlug } from '../challenges';
import { challengeLabel } from '../components/challenge/ChallengeHeader';
import Button from '../components/ui/Button';
import { SCORING } from '../game/scoring';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { evaluateAnswer } from '../utils/answers';
import { cn, formatDuration } from '../utils/format';
import { useAdminData } from './context';
import { listChallengeSettings } from './api';

const MODES = { flag: 'Resposta digitada', interactive: 'Interação na própria fase' };

function Row({ label, children }) {
  return (
    <div className="px-4 py-3">
      <dt className="text-xs uppercase tracking-wider text-fg-subtle">{label}</dt>
      <dd className="mt-1 break-words">{children}</dd>
    </div>
  );
}

// Checks an answer exactly as the game does, without touching any player data
function AnswerTester({ challenge }) {
  const [value, setValue] = useState('');
  const [result, setResult] = useState(null);
  const inputId = useId();

  function handleSubmit(event) {
    event.preventDefault();
    setResult(evaluateAnswer(challenge, value));
  }

  return (
    <form onSubmit={handleSubmit} className="panel space-y-3 p-4">
      <label htmlFor={inputId} className="block font-display font-semibold">
        Testar uma resposta
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setResult(null);
          }}
          autoComplete="off"
          spellCheck={false}
          className="h-11 min-w-0 flex-1 rounded-xl border border-ink-600 bg-ink-950/70 px-3 font-mono text-base focus:border-brand-orange focus:outline-none"
        />
        <Button type="submit" variant="secondary">
          Testar
        </Button>
      </div>
      <p aria-live="polite" className="min-h-5 text-sm">
        {result?.status === 'correct' && <span className="text-success">Correta.</span>}
        {result?.status === 'incorrect' && (
          <span className="text-danger">
            Incorreta.{result.message && <span className="text-fg-muted"> Aviso exibido: “{result.message}”</span>}
          </span>
        )}
        {result?.status === 'empty' && <span className="text-fg-muted">Digite algo para testar.</span>}
      </p>
    </form>
  );
}

export default function ChallengeDetailPage() {
  const { slug } = useParams();
  const challenge = getChallengeBySlug(slug);
  const { data: settings, failed } = useAdminData(listChallengeSettings);
  const [lastSubmission, setLastSubmission] = useState(null);

  useDocumentTitle(challenge ? `${challenge.title} · Administração` : 'Fases · Administração');

  if (!challenge) {
    return (
      <p className="panel p-5 text-fg-muted">
        Fase não encontrada. <Link to="/admin/fases" className="text-brand-orange-light underline">Voltar às fases</Link>
      </p>
    );
  }

  const index = challenges.indexOf(challenge);
  const previous = challenges[index - 1];
  const next = challenges[index + 1];
  const server = settings?.[challenge.id];
  const base = Math.round(challenge.points * SCORING.baseShare);
  const { Stage } = challenge;

  // The stage runs in preview mode: answers are checked but nothing is recorded
  function handlePreviewSubmit(answer) {
    // Stages checked by the server alone are compared with the stored answer
    const expected = server?.answer?.split(/\s/)[0];
    const result =
      challenge.serverOnly && expected
        ? { status: answer.trim() === expected ? 'correct' : 'incorrect' }
        : evaluateAnswer(challenge, answer);
    setLastSubmission(result.status);
    return result;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/fases"
          className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-fg-muted hover:text-fg"
        >
          <LuArrowLeft className="h-4 w-4" aria-hidden="true" /> Fases
        </Link>
        <div className="flex gap-2">
          {previous && (
            <Button to={`/admin/fases/${previous.slug}`} variant="secondary" size="sm">
              <LuArrowLeft className="h-4 w-4" aria-hidden="true" /> {previous.title}
            </Button>
          )}
          {next && (
            <Button to={`/admin/fases/${next.slug}`} variant="secondary" size="sm">
              {next.title} <LuArrowRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </div>

      <header className="mt-4 max-w-3xl">
        <p className="eyebrow">{challengeLabel(challenge)}</p>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{challenge.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-fg-muted">{challenge.objective}</p>
      </header>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <section className="min-w-0" aria-label="Conteúdo da fase">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-fg-subtle">
            Pré-visualização · nada é registrado
            {lastSubmission && challenge.answerMode === 'interactive' && (
              <span className={cn('ml-2', lastSubmission === 'correct' ? 'text-success' : 'text-danger')}>
                · último envio: {lastSubmission === 'correct' ? 'correto' : 'incorreto'}
              </span>
            )}
          </p>
          <Stage
            key={challenge.id}
            challenge={challenge}
            solved={false}
            preview
            onSubmitAnswer={handlePreviewSubmit}
          />
        </section>

        <aside className="space-y-4" aria-label="Configuração da fase">
          <dl className="panel divide-y divide-ink-600/40">
            <Row label="Resposta">
              {server ? (
                <span className="font-mono font-semibold text-brand-orange-light">
                  {server.answer ?? 'Não cadastrada'}
                </span>
              ) : (
                <span className="text-fg-subtle">{failed ? 'Indisponível' : 'Carregando…'}</span>
              )}
            </Row>
            <Row label="Dica">{challenge.hint.text}</Row>
            <Row label="Pontuação">
              Até <strong>{challenge.points}</strong> pontos: {base} por resolver e até{' '}
              {challenge.points - base} de bônus de velocidade.
            </Row>
            <Row label="Bônus de velocidade">
              Completo até {formatDuration(challenge.fastSeconds * 1000)}; zera em{' '}
              {formatDuration(challenge.slowSeconds * 1000)}.
            </Row>
            <Row label="Penalidades">
              −{SCORING.wrongPenalty} por erro (até {SCORING.maxChargedWrong}) e −{SCORING.hintPenalty}{' '}
              pela dica.
            </Row>
            <Row label="Ao acertar">
              <strong>{challenge.success.title}</strong>. {challenge.success.lesson}
              {challenge.success.nextClue && (
                <span className="mt-1 block text-fg-muted">Pista: {challenge.success.nextClue}</span>
              )}
            </Row>
            {challenge.nearMisses?.length > 0 && (
              <Row label="Avisos de quase-acerto">
                <ul className="list-disc space-y-1 pl-5 text-sm text-fg-muted">
                  {challenge.nearMisses.map((rule) => (
                    <li key={rule.message}>{rule.message}</li>
                  ))}
                </ul>
              </Row>
            )}
            <Row label="Configuração">
              <span className="font-mono text-sm text-fg-muted">
                id {challenge.id} · rota /missao/{challenge.slug}
                <br />
                {MODES[challenge.answerMode]}
              </span>
            </Row>
          </dl>

          {challenge.serverOnly ? (
            <p className="panel p-4 text-sm text-fg-muted">
              A resposta desta fase é conferida apenas pelo servidor. Teste-a no próprio teclado da
              pré-visualização.
            </p>
          ) : (
            <AnswerTester key={challenge.id} challenge={challenge} />
          )}
        </aside>
      </div>
    </>
  );
}
