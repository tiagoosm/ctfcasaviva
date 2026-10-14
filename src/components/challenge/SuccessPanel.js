import { useEffect, useRef } from 'react';
import { LuArrowRight, LuMap, LuTrophy } from 'react-icons/lu';
import { challengePath } from '../../challenges';
import useReducedMotion from '../../hooks/useReducedMotion';
import { cn } from '../../utils/format';
import Button from '../ui/Button';

// nextChallenge: a stage that just opened (the final one); otherwise the player
// goes back to the map to choose, or to the result once everything is solved
export default function SuccessPanel({ challenge, earned, nextChallenge, complete, justSolved }) {
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
      className="panel scroll-mt-36 overflow-hidden border-l-[6px] border-success p-5 animate-fade-up sm:p-7"
    >
      {/* Stamped on the sheet: hit when the stage is solved, already there when reviewed */}
      <span
        className={cn(
          'stamp pointer-events-none absolute right-4 top-4 text-lg text-brand-orange-light sm:right-6 sm:top-6 sm:text-2xl',
          justSolved && 'animate-stamp',
        )}
        aria-hidden="true"
      >
        Concluída
      </span>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 pr-28 sm:pr-48">
        <h2
          id={`sucesso-${challenge.id}`}
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-extrabold text-success sm:text-3xl"
        >
          {success.title}
        </h2>
        <p className="font-mono text-lg font-semibold text-brand-orange-light">+{earned} pts</p>
      </div>

      <p className="mt-3 max-w-3xl leading-relaxed">{success.lesson}</p>
      {success.nextClue && (
        <p className="mt-3 max-w-3xl border-l-4 border-brand-orange pl-3 leading-relaxed text-fg-muted">
          {success.nextClue}
        </p>
      )}

      <div className="mt-5">
        {complete ? (
          <Button to="/conclusao" size="lg">
            <LuTrophy className="h-5 w-5" aria-hidden="true" />
            Ver resultado da missão
          </Button>
        ) : nextChallenge ? (
          <Button to={challengePath(nextChallenge)} size="lg">
            Liberado: {nextChallenge.title}
            <LuArrowRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        ) : (
          <Button to="/missao" size="lg">
            <LuMap className="h-5 w-5" aria-hidden="true" />
            Escolher próxima investigação
          </Button>
        )}
      </div>
    </section>
  );
}
