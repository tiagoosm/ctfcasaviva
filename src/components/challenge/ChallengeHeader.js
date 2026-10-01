import { useEffect, useState } from 'react';
import { LuTimer } from 'react-icons/lu';
import { formatClock } from '../../utils/format';

export function challengeLabel(challenge) {
  return challenge.code === 'FINAL' ? 'Desafio final' : `Desafio ${challenge.code}`;
}

// Time spent in this challenge: runs from the first visit until it is solved
function Stopwatch({ progress }) {
  const running = Boolean(progress.enteredAt) && !progress.solvedAt;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  let seconds = null;
  if (progress.solvedAt) seconds = progress.seconds;
  else if (running) seconds = Math.max(0, Math.floor((now - progress.enteredAt) / 1000));
  if (seconds === null) return null;

  return (
    <p className="flex items-center gap-1.5 font-mono text-sm text-fg-subtle">
      <LuTimer className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Tempo neste desafio: </span>
      <span role="timer">{formatClock(seconds)}</span>
    </p>
  );
}

export default function ChallengeHeader({ challenge, progress }) {
  return (
    <header className="max-w-3xl">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">
          {challengeLabel(challenge)} · até {challenge.points} pts
        </p>
        <Stopwatch progress={progress} />
      </div>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{challenge.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-fg-muted">{challenge.objective}</p>
    </header>
  );
}
