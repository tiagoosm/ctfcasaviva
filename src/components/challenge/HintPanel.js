import { useEffect, useRef, useState } from 'react';
import { LuLightbulb } from 'react-icons/lu';
import Button from '../ui/Button';

const LEVELS = ['sutil', 'direta', 'decisiva'];

export default function HintPanel({ challenge, revealed, solved, onReveal }) {
  const [confirming, setConfirming] = useState(false);
  const lastHintRef = useRef(null);
  const previousRevealed = useRef(revealed);

  // Leva o foco à dica recém-revelada para que ela seja lida imediatamente
  useEffect(() => {
    if (revealed > previousRevealed.current) lastHintRef.current?.focus();
    previousRevealed.current = revealed;
  }, [revealed]);

  const { hints } = challenge;
  const nextHint = hints[revealed];
  const canReveal = !solved && revealed < hints.length;

  return (
    <section className="panel p-5" aria-labelledby={`dicas-${challenge.id}`}>
      <div className="flex items-center justify-between gap-3">
        <h2 id={`dicas-${challenge.id}`} className="flex items-center gap-2 text-lg font-semibold">
          <LuLightbulb className="h-5 w-5 text-warning" aria-hidden="true" />
          Dicas
        </h2>
        <span className="font-mono text-xs text-fg-subtle">
          {revealed}/{hints.length} usadas
        </span>
      </div>

      {!solved && (
        <p className="mt-2 text-sm text-fg-muted">
          Travou? As dicas ajudam, mas cada uma reduz a pontuação deste desafio.
        </p>
      )}

      {revealed > 0 && (
        <ol className="mt-4 space-y-3">
          {hints.slice(0, revealed).map((hint, index) => (
            <li
              key={index}
              ref={index === revealed - 1 ? lastHintRef : undefined}
              tabIndex={-1}
              className="animate-fade-up rounded-xl border border-warning/30 bg-warning/5 p-3.5"
            >
              <p className="font-mono text-xs uppercase tracking-wider text-warning">
                Dica {index + 1} · {LEVELS[index] ?? 'extra'}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-fg">{hint.text}</p>
            </li>
          ))}
        </ol>
      )}

      {canReveal && (
        <div className="mt-4">
          {confirming ? (
            <div className="animate-fade-in rounded-xl border border-ink-600 bg-ink-800/70 p-3.5">
              <p className="text-sm">
                Revelar a dica {revealed + 1} custa{' '}
                <strong className="text-warning">{nextHint.cost} pontos</strong> deste desafio.
              </p>
              <div className="mt-3 flex gap-2">
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
            </div>
          ) : (
            <Button variant="secondary" className="w-full" onClick={() => setConfirming(true)}>
              Ver dica {revealed + 1}
              <span className="font-mono text-sm text-warning">−{nextHint.cost} pts</span>
            </Button>
          )}
        </div>
      )}

      {solved && revealed === 0 && (
        <p className="mt-2 text-sm text-success">Resolvido sem usar dicas. Excelente!</p>
      )}
    </section>
  );
}
