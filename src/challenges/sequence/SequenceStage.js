import { useState } from 'react';
import { LuEraser, LuLockOpen, LuSend } from 'react-icons/lu';
import Button from '../../components/ui/Button';
import FeedbackMessage from '../../components/ui/FeedbackMessage';
import { cn } from '../../utils/format';

const base = `${process.env.PUBLIC_URL}/assets/sequence`;

// Ids and file names are neutral so the source code does not give the order away
const FILES = [
  { id: 'k', alt: 'Chamas de fogo azul e laranja sobre uma superfície escura' },
  { id: 'r', alt: 'Dois cachorros sentados na grama olhando para cima' },
  { id: 'm', alt: 'Céu noturno repleto de estrelas' },
  { id: 't', alt: 'Desenho de uma mulher de vestido preto, com lápis ao lado' },
  { id: 'q', alt: 'Três bolinhas de gude coloridas' },
  { id: 'w', alt: 'Uma árvore frondosa isolada em um campo ao entardecer' },
].map((file) => ({ ...file, src: `${base}/arquivo-${file.id}.webp` }));

const SLOTS = ['A', 'B', 'C', 'D', 'E', 'F'];
const byId = Object.fromEntries(FILES.map((file) => [file.id, file]));

export default function SequenceStage({ onSubmitAnswer, solved }) {
  const [selection, setSelection] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [shaking, setShaking] = useState(false);

  const isComplete = selection.length === SLOTS.length;

  function toggle(id) {
    if (solved) return;
    setFeedback(null);
    setSelection((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      return current.length < SLOTS.length ? [...current, id] : current;
    });
  }

  function submit() {
    if (!isComplete || solved) return;
    const result = onSubmitAnswer(selection.join('-'));
    if (result.status === 'incorrect') {
      setShaking(true);
      setFeedback({
        key: Date.now(),
        tone: 'error',
        title: 'Sequência rejeitada',
        message: 'Tente outra ordem.',
      });
    } else if (result.status === 'error') {
      setFeedback({
        key: Date.now(),
        tone: 'error',
        title: 'Não foi possível verificar',
        message: 'Tente enviar de novo.',
      });
    }
  }

  return (
    <section className="panel p-4 sm:p-6" aria-label="Arquivos">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {FILES.map((file) => {
          const position = selection.indexOf(file.id);
          const selected = position !== -1;
          return (
            <li key={file.id}>
              <button
                type="button"
                onClick={() => toggle(file.id)}
                disabled={solved}
                aria-pressed={selected}
                aria-label={`Arquivo: ${file.alt}${selected ? ` — no espaço ${SLOTS[position]}` : ''}`}
                className={cn(
                  'relative block w-full overflow-hidden rounded-xl border-2 bg-ink-950 transition-[border-color,transform,opacity]',
                  selected
                    ? 'border-brand-orange shadow-glow'
                    : 'border-ink-600 hover:-translate-y-0.5 hover:border-fg-subtle',
                  solved && 'border-success/60 opacity-90',
                )}
              >
                <img
                  src={file.src}
                  alt=""
                  width="600"
                  height="450"
                  loading="lazy"
                  decoding="async"
                  className={cn(
                    'aspect-[4/3] w-full object-cover transition-opacity',
                    selected && 'opacity-45',
                  )}
                />
                {selected && (
                  <span
                    className="absolute inset-0 flex items-center justify-center animate-pop"
                    aria-hidden="true"
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange font-mono text-xl font-bold text-ink-950">
                      {SLOTS[position]}
                    </span>
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-6 rounded-xl border border-ink-600 bg-ink-950/60 p-4">
        <div className="flex items-baseline justify-between gap-2">
          <h3 className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-fg-subtle">
            Painel de ativação
          </h3>
          <p className="font-mono text-xs text-fg-subtle" aria-live="polite">
            {selection.length}/{SLOTS.length}
          </p>
        </div>
        <ol
          className={cn('mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6', shaking && 'animate-shake')}
          onAnimationEnd={() => setShaking(false)}
        >
          {SLOTS.map((slot, index) => {
            const file = byId[selection[index]];
            return (
              <li key={slot} className="flex flex-col items-center gap-1.5">
                <span className="font-mono text-sm font-semibold text-brand-orange-light">{slot}</span>
                {file ? (
                  <button
                    type="button"
                    onClick={() => toggle(file.id)}
                    disabled={solved}
                    className="aspect-square w-full max-w-[5rem] overflow-hidden rounded-lg border-2 border-brand-orange/70"
                    aria-label={`Espaço ${slot}: ${file.alt}. Remover`}
                  >
                    <img src={file.src} alt="" className="h-full w-full object-cover" />
                  </button>
                ) : (
                  <span
                    className="flex aspect-square w-full max-w-[5rem] items-center justify-center rounded-lg border-2 border-dashed border-ink-600 text-fg-subtle"
                    aria-label={`Espaço ${slot}: vazio`}
                    role="img"
                  >
                    ·
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {solved ? (
        <p className="mt-5 flex items-center gap-2 font-semibold text-success">
          <LuLockOpen className="h-5 w-5" aria-hidden="true" /> O sistema aceitou a sequência.
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button size="lg" onClick={submit} disabled={!isComplete} className="sm:order-last sm:ml-auto">
            <LuSend className="h-5 w-5" aria-hidden="true" /> Enviar sequência
          </Button>
          <Button
            variant="secondary"
              onClick={() => {
                setFeedback(null);
                setSelection([]);
              }}
              disabled={selection.length === 0}
            >
              <LuEraser className="h-4 w-4" aria-hidden="true" /> Limpar
          </Button>
        </div>
      )}

      <FeedbackMessage feedback={feedback} className="mt-4" />
    </section>
  );
}
