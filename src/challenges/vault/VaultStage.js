import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LuCheck, LuDelete, LuLock, LuLockOpen } from 'react-icons/lu';
import FeedbackMessage from '../../components/ui/FeedbackMessage';
import { SCORING } from '../../game/scoring';
import { cn } from '../../utils/format';

// Clue 1: a mark engraved on each bolt, to be read in the order of the numerals.
// The marks are only half of the way: see the note and the plate.
const BOLTS = [
  { numeral: 'I', mark: 'F', position: 'left-3 top-3' },
  { numeral: 'II', mark: 'D', position: 'right-3 top-3' },
  { numeral: 'III', mark: 'I', position: 'bottom-3 left-3' },
  { numeral: 'IV', mark: 'H', position: 'bottom-3 right-3' },
];

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

// Time for the opening animation before moving on to the result
const OPEN_DELAY = 2600;

function Bolt({ numeral, mark, position }) {
  return (
    <span
      className={cn('absolute flex flex-col items-center gap-0.5', position)}
      role="img"
      aria-label={`Parafuso ${numeral}, gravação ${mark}`}
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-600 bg-ink-700 font-mono text-[0.7rem] font-semibold text-[#35548c] shadow-inner">
        {mark}
      </span>
      <span className="font-mono text-[0.6rem] tracking-widest text-fg-subtle">{numeral}</span>
    </span>
  );
}

export default function VaultStage({ challenge, solved, onSubmitAnswer, preview = false }) {
  const { codeLength } = challenge;
  const [digits, setDigits] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [shaking, setShaking] = useState(false);
  const [sending, setSending] = useState(false);
  const [lockedUntil, setLockedUntil] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [justOpened, setJustOpened] = useState(false);
  const navigate = useNavigate();
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Countdown while the vault is locked after a wrong combination
  const waitSeconds = Math.max(0, Math.ceil((lockedUntil - now) / 1000));
  useEffect(() => {
    if (lockedUntil <= Date.now()) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [lockedUntil]);

  // Opening the vault ends the mission: show it, then go to the result
  useEffect(() => {
    if (!justOpened || preview) return undefined;
    const timer = setTimeout(() => navigate('/conclusao'), OPEN_DELAY);
    return () => clearTimeout(timer);
  }, [justOpened, preview, navigate]);

  const locked = waitSeconds > 0;
  // In the game `solved` comes from the server; the admin preview only has the local result
  const opened = solved || justOpened;
  const disabled = opened || sending || locked;
  const complete = digits.length === codeLength;

  const press = useCallback(
    (digit) => {
      if (disabled) return;
      setFeedback(null);
      setDigits((current) => (current.length < codeLength ? current + digit : current));
    },
    [disabled, codeLength],
  );

  const erase = useCallback(() => {
    if (!disabled) setDigits((current) => current.slice(0, -1));
  }, [disabled]);

  const confirm = useCallback(async () => {
    if (disabled || !complete) return;
    setSending(true);
    const result = (await onSubmitAnswer(digits)) ?? { status: 'error' };
    if (!mounted.current) return;
    setSending(false);

    if (result.status === 'correct') {
      setJustOpened(true);
      return;
    }

    setDigits('');
    if (result.wait > 0) setLockedUntil(Date.now() + result.wait * 1000);

    // Nothing here says which digit is wrong, or how close the attempt was
    if (result.status === 'incorrect') {
      setShaking(true);
      setFeedback({
        key: Date.now(),
        tone: 'error',
        title: 'Combinação incorreta',
        message: `−${SCORING.wrongPenalty} pontos. Revise as pistas antes de tentar de novo.`,
      });
    } else if (result.status === 'error') {
      setFeedback({
        key: Date.now(),
        tone: 'error',
        title: 'Não foi possível verificar',
        message: 'Tente enviar de novo.',
      });
    }
  }, [disabled, complete, digits, onSubmitAnswer]);

  // The keypad also answers to the physical keyboard
  useEffect(() => {
    if (opened) return undefined;
    function onKeyDown(event) {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName)) return;
      if (/^\d$/.test(event.key)) press(event.key);
      else if (event.key === 'Backspace') erase();
      else if (event.key === 'Enter' && event.target.tagName !== 'BUTTON') confirm();
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [opened, press, erase, confirm]);

  const keyClasses =
    'flex h-12 items-center justify-center rounded-xl border border-ink-600 bg-ink-800 font-mono text-xl font-semibold transition-colors hover:bg-ink-700 active:scale-95 disabled:pointer-events-none disabled:opacity-40';

  return (
    <div className="grid items-start gap-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <section
        className={cn(
          'relative mx-auto w-full max-w-sm rounded-3xl border-2 bg-ink-850 px-6 pb-12 pt-12 shadow-card transition-colors duration-700 sm:px-8',
          opened ? 'border-success/70 shadow-[0_0_40px_-8px_rgba(61,214,140,0.5)]' : 'border-ink-600',
        )}
        aria-label="Cofre"
      >
        {BOLTS.map((bolt) => (
          <Bolt key={bolt.numeral} {...bolt} />
        ))}

        <div
          className={cn(
            'mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 transition-all duration-1000',
            opened
              ? 'rotate-[360deg] border-success bg-success/15 text-success'
              : 'border-ink-600 bg-ink-800 text-brand-orange-light',
          )}
          aria-hidden="true"
        >
          {opened ? <LuLockOpen className="h-7 w-7" /> : <LuLock className="h-7 w-7" />}
        </div>

        <div
          className={cn('mt-5', shaking && 'animate-shake')}
          onAnimationEnd={() => setShaking(false)}
        >
          <p className="sr-only" aria-live="polite">
            {opened
              ? 'Cofre aberto'
              : `${digits.length} de ${codeLength} dígitos inseridos`}
          </p>
          <div
            className={cn(
              'flex h-16 items-center justify-center gap-3 rounded-xl border bg-ink-950 font-mono text-3xl font-bold tracking-widest',
              opened ? 'border-success/60 text-success' : 'border-ink-600 text-brand-orange-light',
            )}
            aria-hidden="true"
          >
            {opened ? (
              <span className="animate-pop text-2xl tracking-[0.3em]">ABERTO</span>
            ) : locked ? (
              <span className="text-lg tracking-normal text-warning">Bloqueado · {waitSeconds} s</span>
            ) : (
              Array.from({ length: codeLength }, (_, index) => (
                <span key={index} className={cn('w-6 text-center', !digits[index] && 'text-ink-600')}>
                  {digits[index] ?? '–'}
                </span>
              ))
            )}
          </div>
        </div>

        {/* Clue 3 */}
        <p className="mt-4 rounded-lg border border-ink-600/70 bg-ink-900/60 px-3 py-2 text-center font-mono text-xs leading-relaxed text-fg-muted">
          Este teclado só entende posições.
          <br />A primeira é a posição zero.
        </p>

        {!opened && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {KEYS.map((key) => (
              <button key={key} type="button" className={keyClasses} disabled={disabled} onClick={() => press(key)}>
                {key}
              </button>
            ))}
            <button
              type="button"
              className={keyClasses}
              disabled={disabled || digits.length === 0}
              onClick={erase}
              aria-label="Apagar"
            >
              <LuDelete className="h-5 w-5" aria-hidden="true" />
            </button>
            <button type="button" className={keyClasses} disabled={disabled} onClick={() => press('0')}>
              0
            </button>
            <button
              type="button"
              className={cn(
                keyClasses,
                'border-brand-orange bg-brand-orange text-ink-950 hover:bg-brand-orange-light',
              )}
              disabled={disabled || !complete}
              onClick={confirm}
              aria-label="Confirmar combinação"
            >
              <LuCheck className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
        )}

        {locked && (
          <p className="mt-3 text-center text-sm text-warning" role="status">
            Cofre bloqueado por {waitSeconds} s.
          </p>
        )}
      </section>

      <div className="space-y-4">
        {/* Clue 2 */}
        <figure className="mx-auto max-w-sm rotate-[-1.5deg] rounded-lg bg-paper px-5 py-4 text-paper-ink shadow-paper md:mx-0">
          <figcaption className="font-mono text-[0.65rem] uppercase tracking-widest text-paper-ink/60">
            Bilhete preso à porta
          </figcaption>
          <blockquote className="mt-2 font-display text-lg leading-snug">
            “Nada aqui está escrito como deveria. O general mandaria voltar três casas.”
          </blockquote>
        </figure>

        <FeedbackMessage feedback={feedback} />

        {justOpened && !preview && (
          <p className="animate-fade-up font-display text-lg font-semibold text-success" role="status">
            Cofre aberto. Calculando o resultado…
          </p>
        )}
      </div>
    </div>
  );
}
