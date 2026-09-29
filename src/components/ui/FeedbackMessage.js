import { LuCircleCheck, LuCircleX, LuInfo } from 'react-icons/lu';
import { cn } from '../../utils/format';

const tones = {
  error: { icon: LuCircleX, classes: 'border-danger/40 bg-danger/10 text-danger' },
  success: { icon: LuCircleCheck, classes: 'border-success/40 bg-success/10 text-success' },
  info: { icon: LuInfo, classes: 'border-brand-blue-light/40 bg-brand-blue/20 text-brand-blue-light' },
};

// A região viva fica sempre montada: leitores de tela só anunciam mudanças
// em regiões que já existiam no DOM antes do conteúdo aparecer.
export default function FeedbackMessage({ id, feedback, className }) {
  const tone = feedback ? tones[feedback.tone] : null;
  const Icon = tone?.icon;

  return (
    <div id={id} aria-live="polite" aria-atomic="true" className={className}>
      {feedback && (
        <div
          key={feedback.key}
          className={cn('flex animate-fade-in gap-3 rounded-xl border p-3.5', tone.classes)}
        >
          <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <p className="font-display font-semibold">{feedback.title}</p>
            {feedback.message && <p className="mt-0.5 text-sm text-fg-muted">{feedback.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
