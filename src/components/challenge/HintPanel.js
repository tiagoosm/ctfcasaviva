import { useEffect, useRef, useState } from 'react';
import { LuLightbulb } from 'react-icons/lu';
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
    <section className="panel p-5" aria-labelledby={`dica-${challenge.id}`}>
      <h2 id={`dica-${challenge.id}`} className="flex items-center gap-2 text-lg font-semibold">
        <LuLightbulb className="h-5 w-5 text-warning" aria-hidden="true" />
        Dica
      </h2>

      {revealed ? (
        <p
          ref={hintRef}
          tabIndex={-1}
          className="mt-4 animate-fade-up rounded-xl border border-warning/30 bg-warning/5 p-3.5 text-sm leading-relaxed"
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
                Revelar (−{hint.cost})
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setConfirming(true)}>
              Ver dica
              <span className="font-mono text-sm text-warning">−{hint.cost} pts</span>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
