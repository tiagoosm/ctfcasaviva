import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuArrowRight, LuMap, LuTrophy } from 'react-icons/lu';
import { challengePath, challenges } from '../challenges';
import Credential from '../components/Credential';
import Button from '../components/ui/Button';
import { useGame } from '../game/GameProvider';
import { CODENAME_MAX_LENGTH } from '../game/gameReducer';
import { getCurrentChallenge, getSummary } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';

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
    <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:pb-24">
      <div>
        <p className="eyebrow">Operação cas@viva</p>
        <div className="mt-4">
          <Title />
        </div>
        <p className="mt-6 max-w-xl text-lg leading-relaxed text-fg-muted sm:text-xl">
          Uma investigação digital em {challenges.length} etapas. Observe, deduza e decifre.
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
                className="h-12 min-w-0 flex-1 rounded-xl border-2 border-ink-600 bg-ink-950/70 px-4 text-base hover:border-fg-subtle focus:border-brand-orange focus:outline-none"
              />
              <Button type="submit" size="lg">
                Iniciar missão <LuArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
          </form>
        )}

        {summary.hasStarted && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
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
        )}
      </div>

      <Credential codename={summary.hasStarted ? state.codename : codename} />
    </section>
  );
}
