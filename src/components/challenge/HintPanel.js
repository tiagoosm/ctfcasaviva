import { useEffect, useRef, useState } from 'react';
import { SCORING } from '../../game/scoring';
import Button from '../ui/Button';

export default function HintPanel({ challenge, revealed, solved, onReveal }) {
  const [confirming, setConfirming] = useState(false);
  const hintRef = useRef(null);
  const wasRevealed = useRef(revealed);

  // Moves focus to the newly revealed hint so it is read right away
  useEffect(() => {
    if (revealed && !wasRevealed.current) hintRef.current?.focus();
    wasRevealed.current = revealed;
  }, [revealed]);

  const { hint } = challenge;

  if (solved && !revealed) return null;

  return (
    // A sticky note: the hint is the investigator's own scribble
    <section className="note rotate-[0.8deg] p-5" aria-labelledby={`dica-${challenge.id}`}>
      <span
        className="absolute -top-2.5 left-1/2 h-5 w-16 -translate-x-1/2 -rotate-2 bg-white/60 shadow-sm"
        aria-hidden="true"
      />
      <h2 id={`dica-${challenge.id}`} className="font-hand text-2xl font-bold leading-none">
        Dica
      </h2>

      {revealed ? (
        <p
          ref={hintRef}
          tabIndex={-1}
          className="mt-3 animate-fade-in leading-relaxed"
        >
          {hint.text}
        </p>
      ) : (
        <div className="mt-4">
          {confirming ? (
            <div className="flex gap-2 animate-fade-in">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => {
                  setConfirming(false);
                  onReveal();
                }}
              >
                Revelar (−{SCORING.hintPenalty})
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setConfirming(true)}>
              Ver dica
              <span className="font-mono text-sm text-warning">−{SCORING.hintPenalty} pts</span>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
