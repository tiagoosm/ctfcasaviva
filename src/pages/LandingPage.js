import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LuArrowRight,
  LuFlag,
  LuLightbulb,
  LuLock,
  LuMap,
  LuScanSearch,
  LuTrophy,
} from 'react-icons/lu';
import { challengePath, challenges } from '../challenges';
import Credential from '../components/Credential';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { useGame } from '../game/GameProvider';
import { CODENAME_MAX_LENGTH } from '../game/gameReducer';
import { getCurrentChallenge, getStatus, getSummary } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';

const STEPS = [
  {
    icon: LuScanSearch,
    title: 'Investigue',
    text: 'Cada desafio esconde uma flag. Observe detalhes, leia com atenção e teste hipóteses.',
  },
  {
    icon: LuFlag,
    title: 'Capture a flag',
    text: 'Envie a resposta no formato casaviva{...}. Errar não custa pontos.',
  },
  {
    icon: LuLightbulb,
    title: 'Use dicas com estratégia',
    text: 'Travou? Há dicas em dois níveis, mas cada uma reduz a pontuação do desafio.',
  },
  {
    icon: LuTrophy,
    title: 'Avance até o cofre',
    text: 'Cada fase libera a próxima e deixa uma pista. No final, tudo se conecta.',
  },
];

function Title() {
  const initial = (letter) => <span className="text-brand-orange">{letter}</span>;
  return (
    <h1 className="text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl">
      {initial('C')}apture <br className="hidden sm:block" />
      {initial('T')}he {initial('F')}lag
    </h1>
  );
}

export default function LandingPage() {
  useDocumentTitle('');
  const { state, startMission } = useGame();
  const summary = getSummary(state);
  const current = getCurrentChallenge(state);
  const [codename, setCodename] = useState(state.codename);
  const navigate = useNavigate();
  const inputId = useId();

  function handleStart(event) {
    event.preventDefault();
    startMission(codename);
    navigate(challengePath(challenges[0]));
  }

  return (
    <>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-24">
        <div>
          <p className="eyebrow">Inatel cas@viva apresenta</p>
          <div className="mt-4">
            <Title />
          </div>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted sm:text-xl">
            Uma missão de investigação digital em {challenges.length} etapas. Observe, deduza e
            decifre para capturar as flags escondidas — e conquistar o título de mestre do CTF.
          </p>

          {!summary.hasStarted && (
            <form onSubmit={handleStart} className="mt-8 max-w-md space-y-3">
              <label htmlFor={inputId} className="block font-display font-semibold">
                Seu codinome <span className="font-normal text-fg-subtle">(opcional)</span>
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  id={inputId}
                  type="text"
                  value={codename}
                  onChange={(event) => setCodename(event.target.value)}
                  maxLength={CODENAME_MAX_LENGTH}
                  autoComplete="nickname"
                  placeholder="Ex.: Agente Coruja"
                  className="h-12 min-w-0 flex-1 rounded-xl border-2 border-ink-600 bg-ink-950/70 px-4 text-base placeholder:text-fg-subtle/70 hover:border-fg-subtle focus:border-brand-orange focus:outline-none"
                />
                <Button type="submit" size="lg">
                  Iniciar missão <LuArrowRight className="h-5 w-5" aria-hidden="true" />
                </Button>
              </div>
              <p className="text-sm text-fg-subtle">
                Ele aparece na sua credencial e no certificado final. Seu progresso fica salvo neste
                navegador.
              </p>
            </form>
          )}

          {summary.hasStarted && (
            <div className="mt-8 space-y-4">
              <p className="text-fg-muted">
                {summary.isComplete ? 'Missão cumprida' : 'Bem-vindo(a) de volta'}
                {state.codename ? `, ${state.codename}` : ''}.{' '}
                {summary.isComplete
                  ? 'Seu certificado está pronto.'
                  : `Você capturou ${summary.solvedCount} de ${summary.total} flags.`}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                {summary.isComplete ? (
                  <Button to="/conclusao" size="lg">
                    <LuTrophy className="h-5 w-5" aria-hidden="true" /> Ver certificado
                  </Button>
                ) : (
                  <Button to={challengePath(current)} size="lg">
                    Continuar: {current.title} <LuArrowRight className="h-5 w-5" aria-hidden="true" />
                  </Button>
                )}
                <Button to="/missao" variant="secondary" size="lg">
                  <LuMap className="h-5 w-5" aria-hidden="true" /> Mapa da missão
                </Button>
              </div>
            </div>
          )}
        </div>

        <Credential codename={summary.hasStarted ? state.codename : codename} />
      </section>

      <section className="border-y border-ink-600/40 bg-ink-950/40" aria-labelledby="como-funciona">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <h2 id="como-funciona" className="text-3xl font-bold">
            Como funciona
          </h2>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ icon: Icon, title, text }, index) => (
              <li key={title} className="panel p-5">
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-orange/15 text-brand-orange-light">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-sm text-fg-subtle" aria-hidden="true">
                    0{index + 1}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-fg-muted">{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="etapas">
        <h2 id="etapas" className="text-3xl font-bold">
          As etapas da missão
        </h2>
        <p className="mt-2 max-w-2xl text-fg-muted">
          A dificuldade cresce a cada fase. O que você aprende em uma etapa será útil nas seguintes.
        </p>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {challenges.map((challenge) => {
            const locked = getStatus(state, challenge) === 'locked';
            return (
              <li key={challenge.id} className="panel flex flex-col p-5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-semibold text-brand-orange-light">
                    {challenge.code}
                  </span>
                  {locked && <LuLock className="h-4 w-4 text-fg-subtle" role="img" aria-label="Bloqueado" />}
                </div>
                <h3 className="mt-3 text-lg font-semibold">{challenge.title}</h3>
                <p className="mt-1 flex-1 text-sm text-fg-muted">{challenge.summary}</p>
                <Badge className="mt-4 self-start">{challenge.category}</Badge>
              </li>
            );
          })}
        </ol>
      </section>
    </>
  );
}
