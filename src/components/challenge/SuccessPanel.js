import { useEffect, useRef } from 'react';
import { LuArrowRight, LuBookOpen, LuCircleCheck, LuMap, LuTrophy } from 'react-icons/lu';
import { challengePath } from '../../challenges';
import useReducedMotion from '../../hooks/useReducedMotion';
import Button from '../ui/Button';
import { challengeLabel } from './ChallengeHeader';

export default function SuccessPanel({ challenge, earned, nextChallenge, justSolved }) {
  const sectionRef = useRef(null);
  const headingRef = useRef(null);
  const reducedMotion = useReducedMotion();

  // On a correct answer the panel takes focus: the player sees and hears the win right away
  useEffect(() => {
    if (!justSolved) return;
    sectionRef.current?.scrollIntoView?.({
      behavior: reducedMotion ? 'auto' : 'smooth',
      block: 'start',
    });
    headingRef.current?.focus({ preventScroll: true });
  }, [justSolved, reducedMotion]);

  const { success } = challenge;

  return (
    <section
      ref={sectionRef}
      aria-labelledby={`sucesso-${challenge.id}`}
      className="panel scroll-mt-24 overflow-hidden border-success/40 animate-fade-up"
    >
      <div className="h-1 bg-gradient-to-r from-success via-brand-orange to-brand-blue-light" />
      <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-[auto_minmax(0,1fr)]">
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl bg-success/15 text-success animate-pop"
          aria-hidden="true"
        >
          <LuCircleCheck className="h-9 w-9" />
        </div>

        <div className="min-w-0">
          <p className="eyebrow text-success">{challengeLabel(challenge)} concluído</p>
          <div className="mt-1 flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2
              id={`sucesso-${challenge.id}`}
              ref={headingRef}
              tabIndex={-1}
              className="text-2xl font-bold sm:text-3xl"
            >
              {success.title}
            </h2>
            <p className="font-mono text-lg font-semibold text-brand-orange-light">
              +{earned} pts
            </p>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl bg-ink-800/70 p-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-fg-muted">
                <LuBookOpen className="h-4 w-4" aria-hidden="true" /> O que você aprendeu
              </h3>
              <p className="mt-2 leading-relaxed">{success.lesson}</p>
            </div>
            {success.nextClue && (
              <div className="rounded-xl border-l-4 border-brand-orange bg-brand-orange/10 p-4">
                <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-brand-orange-light">
                  Pista para a próxima fase
                </h3>
                <p className="mt-2 leading-relaxed">{success.nextClue}</p>
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {nextChallenge ? (
              <Button to={challengePath(nextChallenge)} size="lg">
                Próximo: {nextChallenge.title}
                <LuArrowRight className="h-5 w-5" aria-hidden="true" />
              </Button>
            ) : (
              <Button to="/conclusao" size="lg">
                <LuTrophy className="h-5 w-5" aria-hidden="true" />
                Ver resultado da missão
              </Button>
            )}
            <Button to="/missao" variant="secondary" size="lg">
              <LuMap className="h-5 w-5" aria-hidden="true" /> Mapa da missão
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
