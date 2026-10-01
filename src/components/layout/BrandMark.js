import { cn } from '../../utils/format';

export const MARK_SRC = `${process.env.PUBLIC_URL}/assets/brand/casaviva-mark.png`;
export const LOGO_SRC = `${process.env.PUBLIC_URL}/assets/brand/logo-casaviva.png`;

// "cas@viva" with the @ in the brand orange, as in the official logo
export function Wordmark({ className }) {
  return (
    <span className={cn('font-display font-bold tracking-tight', className)}>
      cas<span className="text-brand-orange">@</span>viva
    </span>
  );
}

export default function BrandMark({ compact = false }) {
  return (
    <span className="flex items-center gap-3">
      <img
        src={MARK_SRC}
        alt=""
        width="40"
        height="40"
        className="h-10 w-10 rounded-lg shadow-glow"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
          Inatel
        </span>
        <span className="flex items-baseline gap-2">
          <Wordmark className="text-lg text-fg" />
          <span
            className={cn(
              'rounded bg-brand-orange/15 px-1.5 py-0.5 font-mono text-[0.7rem] font-semibold text-brand-orange-light',
              compact && 'hidden sm:inline',
            )}
          >
            CTF
          </span>
        </span>
      </span>
    </span>
  );
}
