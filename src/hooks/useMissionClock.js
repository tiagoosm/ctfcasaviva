import { useEffect, useState } from 'react';
import { useGame } from '../game/GameProvider';
import { getMissionSeconds, isClockRunning } from '../game/selectors';

// The mission clock. There is no counter to keep in sync: the time is always
// derived from the persisted game state (the periods already spent inside
// challenges plus the one in progress), so reloading or changing page cannot
// reset it. It only advances while the player is inside a challenge.
export default function useMissionClock() {
  const { state } = useGame();
  const running = isClockRunning(state);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running) return undefined;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [running]);

  return { seconds: getMissionSeconds(state, now), running, finished: Boolean(state.finishedAt) };
}
