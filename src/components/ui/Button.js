import { Link } from 'react-router-dom';
import { cn } from '../../utils/format';

const base =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl font-display font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-45 select-none';

const variants = {
  // Texto azul-escuro sobre laranja: 6:1 de contraste (branco sobre laranja não passa no AA)
  primary: 'bg-brand-orange text-ink-950 hover:bg-brand-orange-light hover:shadow-glow',
  secondary: 'border border-ink-600 bg-ink-800/70 text-fg hover:border-fg-subtle hover:bg-ink-700',
  ghost: 'text-fg-muted hover:bg-ink-800 hover:text-fg',
  danger: 'border border-danger/50 bg-danger/10 text-danger hover:bg-danger/20',
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
