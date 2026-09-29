import { cn } from '../../utils/format';

const tones = {
  neutral: 'border-ink-600 bg-ink-800 text-fg-muted',
  orange: 'border-brand-orange/40 bg-brand-orange/10 text-brand-orange-light',
  blue: 'border-brand-blue-light/40 bg-brand-blue/25 text-brand-blue-light',
  success: 'border-success/40 bg-success/10 text-success',
};

export default function Badge({ tone = 'neutral', className, children }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-xs font-medium',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
