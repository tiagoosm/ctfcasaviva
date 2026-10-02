import { useEffect, useId, useRef, useState } from 'react';
import { LuLoaderCircle, LuSend } from 'react-icons/lu';
import { cn } from '../../utils/format';
import Button from '../ui/Button';
import FeedbackMessage from '../ui/FeedbackMessage';
import { incorrectFeedback, systemErrorFeedback } from './feedback';

// `onSubmit` may be asynchronous: the answer is checked by the server
export default function FlagForm({ onSubmit }) {
  const [value, setValue] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [shaking, setShaking] = useState(false);
  const inputRef = useRef(null);
  const mounted = useRef(true);
  const inputId = useId();
  const feedbackId = useId();

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    if (verifying) return;

    if (!value.trim()) {
      setFeedback({
        key: Date.now(),
        tone: 'info',
        title: 'Campo vazio',
        message: 'Digite uma resposta antes de enviar.',
      });
      inputRef.current?.focus();
      return;
    }

    setVerifying(true);
    setFeedback(null);
    const result = (await onSubmit(value)) ?? { status: 'error' };
    // On a correct answer the form is removed from the page
    if (!mounted.current) return;
    setVerifying(false);

    if (result.status === 'incorrect') {
      setFeedback(incorrectFeedback(result));
      setShaking(true);
      inputRef.current?.select();
    } else if (result.status === 'error') {
      setFeedback(systemErrorFeedback());
    }
  }

  const isError = feedback?.tone === 'error';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-3">
      <label htmlFor={inputId} className="block font-display text-lg font-semibold">
        Resposta
      </label>

      <div className={cn(shaking && 'animate-shake')} onAnimationEnd={() => setShaking(false)}>
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
          aria-invalid={isError || undefined}
          aria-describedby={feedbackId}
          className={cn(
            'h-12 w-full rounded-xl border-2 bg-ink-950/70 px-4 font-mono text-base text-fg transition-colors focus:outline-none focus-visible:outline-none',
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
            <LuSend className="h-5 w-5" aria-hidden="true" /> Enviar
          </>
        )}
      </Button>

      <FeedbackMessage id={feedbackId} feedback={feedback} />
    </form>
  );
}
