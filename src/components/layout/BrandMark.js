import { cn } from '../../utils/format';

export const MARK_SRC = `${process.env.PUBLIC_URL}/assets/brand/casaviva-mark.png`;
export const LOGO_SRC = `${process.env.PUBLIC_URL}/assets/brand/logo-casaviva.png`;

// "cas@viva" with the @ in the brand orange, as in the official logo
export function Wordmark({ className }) {
  return (
    <span className={cn('font-display font-bold', className)}>
      cas<span className="text-brand-orange">@</span>viva
    </span>
  );
}

// The official logo, as it is printed: on a white strip. A strip of label-maker
// tape marks this as the CTF. Always used on paper (header, admin sign-in).
export default function BrandMark({ compact = false }) {
  return (
    <span className="flex items-center gap-3">
      <img src={LOGO_SRC} alt="" width="132" height="44" className="h-9 w-auto sm:h-10" />
      <span className={cn('eyebrow -rotate-2', compact && 'hidden sm:inline-block')}>CTF</span>
    </span>
  );
}
