import { Link } from 'react-router-dom';
import { cn } from '../../utils/format';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-sm font-display font-bold transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 select-none';

const variants = {
  // Navy text on orange: 6:1 contrast (white on orange fails AA)
  primary: 'bg-brand-orange text-night shadow-tape hover:bg-[#FF8A1F]',
  secondary: 'border-2 border-ink-600 bg-transparent text-fg hover:border-fg-muted hover:bg-ink-800/60',
  ghost: 'text-fg-muted hover:bg-ink-800 hover:text-fg',
  danger: 'border-2 border-danger/60 bg-danger/10 text-danger hover:bg-danger/20',
};

const sizes = {
  sm: 'px-3 text-sm',
  md: 'px-5 text-base',
  lg: 'min-h-12 px-6 text-lg',
  icon: 'w-11 px-0',
};

export default function Button({
  to,
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  children,
  ...props
}) {
  const classes = cn(base, variants[variant], sizes[size], className);

  if (to) {
    return (
      <Link to={to} className={classes} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props}>
      {children}
    </button>
  );
}
