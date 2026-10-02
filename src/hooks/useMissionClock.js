import { useEffect, useState } from 'react';
import { useGame } from '../game/GameProvider';
import { getMissionSeconds } from '../game/selectors';

// The mission clock. There is no counter to keep in sync: the elapsed time is
// always derived from the moment the mission started, which is persisted, so
// reloading, changing page or reopening the site cannot reset or pause it.
export default function useMissionClock() {
  const { state } = useGame();
  const running = Boolean(state.startedAt) && !state.finishedAt;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  return { seconds: getMissionSeconds(state, now), running, finished: Boolean(state.finishedAt) };
}
