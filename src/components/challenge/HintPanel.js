import { useEffect, useRef, useState } from 'react';
import { LuLightbulb } from 'react-icons/lu';
import Button from '../ui/Button';

export default function HintPanel({ challenge, revealed, solved, onReveal }) {
  const [confirming, setConfirming] = useState(false);
  const lastHintRef = useRef(null);
  const previousRevealed = useRef(revealed);

  // Moves focus to the newly revealed hint so it is read right away
  useEffect(() => {
    if (revealed > previousRevealed.current) lastHintRef.current?.focus();
    previousRevealed.current = revealed;
  }, [revealed]);

  const { hints } = challenge;
  const nextHint = hints[revealed];
  const canReveal = !solved && revealed < hints.length;

  if (!canReveal && revealed === 0) return null;

  return (
    <section className="panel p-5" aria-labelledby={`dicas-${challenge.id}`}>
      <h2 id={`dicas-${challenge.id}`} className="flex items-center gap-2 text-lg font-semibold">
        <LuLightbulb className="h-5 w-5 text-warning" aria-hidden="true" />
        Dicas
      </h2>

      {revealed > 0 && (
        <ol className="mt-4 space-y-3">
          {hints.slice(0, revealed).map((hint, index) => (
            <li
              key={index}
              ref={index === revealed - 1 ? lastHintRef : undefined}
              tabIndex={-1}
              className="animate-fade-up rounded-xl border border-warning/30 bg-warning/5 p-3.5 text-sm leading-relaxed"
            >
              {hint.text}
            </li>
          ))}
        </ol>
      )}

      {canReveal && (
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
                Revelar (−{nextHint.cost})
              </Button>
              <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setConfirming(true)}>
              Ver dica {revealed + 1}
              <span className="font-mono text-sm text-warning">−{nextHint.cost} pts</span>
            </Button>
          )}
        </div>
      )}
    </section>
  );
}
