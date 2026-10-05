import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import * as api from '../api/ranking';
import { evaluateAnswer } from '../utils/answers';
import { gameReducer } from './gameReducer';
import { isClockRunning } from './selectors';
import { loadState, saveState } from './storage';

const GameContext = createContext(null);

const newActionId = () =>
  window.crypto?.randomUUID?.() ??
  '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, (c) =>
    (Number(c) ^ ((Math.random() * 16) >> (Number(c) / 4))).toString(16),
  );

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Server calls run one at a time and in order (enter → hint → answer…)
  const enqueue = useCallback((task) => {
    const next = queueRef.current.then(task).catch(() => null);
    queueRef.current = next;
    return next;
  }, []);

  const hydrate = useCallback(
    (attempt) => dispatch({ type: 'HYDRATE', attempt, now: Date.now() }),
    [],
  );

  // Asks the server for the attempt and rebuilds the local state from it. If
  // the attempt no longer exists (an administrator reset it), the player is
  // sent back to the start.
  const refreshState = useCallback(
    () =>
      enqueue(async () => {
        const { runId } = stateRef.current;
        if (!runId) return null;
        const attempt = await api.fetchState(runId);
        if (attempt) hydrate(attempt);
        else dispatch({ type: 'SIGN_OUT' });
        return attempt;
      }),
    [enqueue, hydrate],
  );

  // What this browser has saved is only a cache: sync it when the app opens
  useEffect(() => {
    refreshState();
  }, [refreshState]);

  // Starts the attempt of this player. If one already exists for the same name
  // and class, the server returns it instead (in progress or completed).
  const startMission = useCallback(
    async (name, group) => {
      const attempt = await api.startRun(name, group);
      hydrate(attempt);
      return attempt;
    },
    [hydrate],
  );

  // The server decides whether an answer is right. The local check only tells
  // an empty answer apart and picks the "you are close" message.
  const submitAnswer = useCallback(
    (challenge, rawAnswer) => {
      let local;
      try {
        local = evaluateAnswer(challenge, rawAnswer);
      } catch {
        local = { status: 'incorrect' };
      }
      if (local.status === 'empty') return Promise.resolve(local);

      const actionId = newActionId();
      return enqueue(async () => {
        const { runId } = stateRef.current;
        try {
          const confirmed = await api.submitAnswer(runId, challenge.id, rawAnswer, actionId);
          if (confirmed.status === 'correct') {
            dispatch({
              type: 'SOLVED',
              id: challenge.id,
              score: confirmed.score,
              seconds: confirmed.seconds,
              finished: confirmed.finished,
              now: Date.now(),
            });
            if (confirmed.finished) {
              // Official result
              const attempt = await api.fetchState(runId).catch(() => null);
              if (attempt) hydrate(attempt);
            }
            return { status: 'correct' };
          }
          if (confirmed.status === 'incorrect') {
            dispatch({ type: 'WRONG', id: challenge.id });
            return { status: 'incorrect', message: local.message, wait: confirmed.wait ?? 0 };
          }
          // Refused without being checked: the stage is locked after a wrong answer
          if (confirmed.status === 'locked') return { status: 'locked', wait: confirmed.wait };
          return { status: 'empty' };
        } catch (error) {
          if (error.gone) dispatch({ type: 'SIGN_OUT' });
          return { status: 'error' };
        }
      });
    },
    [enqueue, hydrate],
  );

  const actions = useMemo(
    () => ({
      enterChallenge: (challenge) => {
        dispatch({ type: 'ENTER', id: challenge.id, now: Date.now() });
        enqueue(() => api.enterChallenge(stateRef.current.runId, challenge.id));
      },

      // Tells the server the player is still inside the challenge
      keepAlive: (challenge) => {
        enqueue(() => api.enterChallenge(stateRef.current.runId, challenge.id));
      },

      // The player left the challenge page: its clock pauses
      leaveChallenge: (challenge) => {
        dispatch({ type: 'LEAVE', id: challenge.id, now: Date.now() });
        const { runId } = stateRef.current;
        if (runId) enqueue(() => api.leaveChallenge(runId, challenge.id));
      },

      revealHint: (challenge) => {
        dispatch({ type: 'REVEAL_HINT', id: challenge.id });
        enqueue(() => api.revealHint(stateRef.current.runId, challenge.id));
      },

      // Forgets the player on this browser. The attempt stays on the server and
      // is resumed when the same name and class are given again.
      leaveMission: () => {
        const { runId, progress } = stateRef.current;
        Object.entries(progress).forEach(([id, entry]) => {
          if (entry.resumedAt && runId) api.leaveChallenge(runId, id).catch(() => null);
        });
        dispatch({ type: 'SIGN_OUT' });
      },
    }),
    [enqueue],
  );

  // The page is being closed or reloaded while a clock is running: pause it.
  // The state is saved right here because effects may not run again.
  useEffect(() => {
    function onPageHide() {
      const current = stateRef.current;
      if (!isClockRunning(current)) return;
      saveState(gameReducer(current, { type: 'PAUSE_ALL', now: Date.now() }));
      dispatch({ type: 'PAUSE_ALL', now: Date.now() });
      Object.entries(current.progress).forEach(([id, entry]) => {
        if (entry.resumedAt && current.runId) {
          api.leaveChallenge(current.runId, id).catch(() => null);
        }
      });
    }
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, []);

  const value = useMemo(
    () => ({ state, startMission, submitAnswer, refreshState, ...actions }),
    [state, startMission, submitAnswer, refreshState, actions],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame precisa estar dentro de <GameProvider>');
  return context;
}
