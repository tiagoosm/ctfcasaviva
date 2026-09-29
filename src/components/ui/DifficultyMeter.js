import { cn } from '../../utils/format';

const LABELS = ['', 'Iniciante', 'Intermediário', 'Avançado', 'Desafiador'];

export default function DifficultyMeter({ level, max = 4 }) {
  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs text-fg-muted">
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className={cn('h-2 w-4 rounded-sm', i < level ? 'bg-brand-orange' : 'bg-ink-600')}
          />
        ))}
      </span>
      <span>
        <span className="sr-only">Dificuldade: </span>
        {LABELS[level]}
      </span>
    </span>
  );
}
