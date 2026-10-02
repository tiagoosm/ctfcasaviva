import { createPortal } from 'react-dom';
import { LuPause, LuTimer } from 'react-icons/lu';
import useMissionClock from '../../hooks/useMissionClock';
import { cn, formatClock } from '../../utils/format';

// Mission clock, pinned to the top right corner of the challenge pages (below
// the header, aligned with the content). It is only rendered there: outside a
// challenge the clock is paused, so there is nothing to watch.
export default function MissionTimer() {
  const { seconds, running } = useMissionClock();
  if (seconds === null) return null;

  const Icon = running ? LuTimer : LuPause;
  const label = running ? 'Tempo de missão' : 'Tempo pausado';

  // Rendered on <body>: the page content sits inside an animated (transformed)
  // wrapper, which would otherwise capture `position: fixed`
  return createPortal(
    <div className="no-print pointer-events-none fixed inset-x-0 top-[4.75rem] z-20">
      <div className="mx-auto flex max-w-6xl justify-end px-4 sm:px-6">
        <p
          title={label}
          className={cn(
            'pointer-events-auto flex h-10 items-center gap-1.5 rounded-full border px-3.5 font-mono text-base font-bold tabular-nums shadow-card backdrop-blur-md transition-colors',
            running
              ? 'border-brand-orange/60 bg-ink-900/90 text-brand-orange-light'
              : 'border-ink-600 bg-ink-900/90 text-fg-muted',
          )}
        >
          <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
          <span className="sr-only">{label}: </span>
          <span role="timer" aria-live="off">
            {formatClock(seconds)}
          </span>
        </p>
      </div>
    </div>,
    document.body,
  );
}
