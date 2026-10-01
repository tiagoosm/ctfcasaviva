import { useEffect, useId, useRef, useState } from 'react';
import { LuFlag, LuLoaderCircle, LuSend } from 'react-icons/lu';
import { cn } from '../../utils/format';
import Button from '../ui/Button';
import FeedbackMessage from '../ui/FeedbackMessage';
import { incorrectFeedback, systemErrorFeedback } from './feedback';

// Short "verification" pause: gives the submission weight and prevents double clicks
const VERIFY_DELAY = 350;

export default function FlagForm({ onSubmit }) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const inputId = useId();
  const helpId = useId();
  const feedbackId = useId();

  useEffect(() => () => clearTimeout(timerRef.current), []);

  function handleSubmit(event) {
    event.preventDefault();
    if (verifying) return;

    if (!value.trim()) {
      setFeedback({
        key: Date.now(),
        tone: 'info',
        title: 'Campo vazio',
        message: 'Escreva a flag que você encontrou antes de enviar.',
      });
      inputRef.current?.focus();
      return;
    }

    setVerifying(true);
    setFeedback(null);
    timerRef.current = setTimeout(() => {
      const result = onSubmit(value);
      setVerifying(false);

      if (result.status === 'incorrect') {
        setFeedback(incorrectFeedback(result, wrongCount));
        setWrongCount((count) => count + 1);
        setShaking(true);
        inputRef.current?.select();
      } else if (result.status === 'error') {
        setFeedback(systemErrorFeedback());
      }
    }, VERIFY_DELAY);
  }

  const isError = feedback?.tone === 'error';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <label htmlFor={inputId} className="block font-display text-lg font-semibold">
        Capturar flag
      </label>
      <p id={helpId} className="text-sm text-fg-subtle">
        Formato <code className="font-mono text-fg-muted">casaviva{'{resposta}'}</code> ou apenas a
        resposta. Maiúsculas e acentos não importam.
      </p>

      <div
        className={cn('relative', shaking && 'animate-shake')}
        onAnimationEnd={() => setShaking(false)}
      >
        <LuFlag
          className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-fg-subtle"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          maxLength={120}
          placeholder="casaviva{...}"
          aria-invalid={isError || undefined}
          aria-describedby={`${helpId} ${feedbackId}`}
          className={cn(
            'h-12 w-full rounded-xl border-2 bg-ink-950/70 pl-11 pr-3 font-mono text-base text-fg placeholder:text-fg-subtle/70 transition-colors focus:outline-none focus-visible:outline-none',
            isError
              ? 'border-danger/70 focus:border-danger'
              : 'border-ink-600 hover:border-fg-subtle focus:border-brand-orange',
          )}
        />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={verifying}>
        {verifying ? (
          <>
            <LuLoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> Verificando…
          </>
        ) : (
          <>
            <LuSend className="h-5 w-5" aria-hidden="true" /> Enviar flag
          </>
        )}
      </Button>

      <FeedbackMessage id={feedbackId} feedback={feedback} />
    </form>
  );
}
