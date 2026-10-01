import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef } from 'react';
import * as api from '../api/ranking';
import { challenges } from '../challenges';
import { evaluateAnswer } from '../utils/answers';
import { gameReducer } from './gameReducer';
import { hasProgress, isSolved } from './selectors';
import { loadState, saveState } from './storage';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState);
  const stateRef = useRef(state);
  stateRef.current = state;
  const runIdRef = useRef(state.runId);
  const queueRef = useRef(Promise.resolve());

  useEffect(() => {
    saveState(state);
  }, [state]);

  // Server calls run one at a time and in order (start → enter → submit…).
  // A failed call never breaks the game: it keeps working from local state.
  const enqueue = useCallback((task) => {
    const next = queueRef.current.then(task).catch(() => null);
    queueRef.current = next;
    return next;
  }, []);

  // A server run is only opened for a fresh mission: one that already has local
  // progress the server did not witness could never be validated for the ranking.
  const getRunId = useCallback(async () => {
    if (runIdRef.current) return runIdRef.current;
    const current = stateRef.current;
    if (!api.rankingEnabled || !current.codename || !current.group || hasProgress(current)) {
      return null;
    }
    const runId = await api.startRun(current.codename, current.group);
    runIdRef.current = runId;
    dispatch({ type: 'SET_RUN', runId });
    return runId;
  }, []);

  const submitAnswer = useCallback(
    (challenge, rawAnswer) => {
      let result;
      try {
        result = evaluateAnswer(challenge, rawAnswer);
      } catch {
        return { status: 'error' };
      }
      if (result.status === 'empty') return result;

      if (result.status === 'correct') {
        const othersSolved = challenges.every(
          (c) => c.id === challenge.id || isSolved(state, c.id),
        );
        dispatch({ type: 'SOLVE', challenge, now: Date.now(), completesMission: othersSolved });
      } else {
        dispatch({ type: 'WRONG', id: challenge.id });
      }

      // The server checks the answer again by itself and keeps its own count
      // of errors and time: that record is what the ranking uses.
      enqueue(async () => {
        const runId = await getRunId();
        if (!runId) return;
        const confirmed = await api.submitAnswer(runId, challenge.id, rawAnswer);
        if (confirmed?.status === 'correct') {
          dispatch({
            type: 'SERVER_SCORE',
            id: challenge.id,
            score: confirmed.score,
            seconds: confirmed.seconds,
          });
        }
      });

      return result;
    },
    [state, enqueue, getRunId],
  );

  const actions = useMemo(
    () => ({
      startMission: (codename, group) => dispatch({ type: 'START', codename, group, now: Date.now() }),

      enterChallenge: (challenge) => {
        dispatch({ type: 'ENTER', id: challenge.id, now: Date.now() });
        enqueue(async () => {
          const runId = await getRunId();
          if (runId) await api.enterChallenge(runId, challenge.id);
        });
      },

      revealHint: (challenge) => {
        dispatch({ type: 'REVEAL_HINT', id: challenge.id });
        enqueue(async () => {
          const runId = await getRunId();
          if (runId) await api.revealHint(runId, challenge.id);
        });
      },

      // Asks the server for the final result and ranking place of this run
      refreshResult: () =>
        enqueue(async () => {
          if (!runIdRef.current) return null;
          const result = await api.fetchResult(runIdRef.current);
          if (result) dispatch({ type: 'RESULT', result });
          return result;
        }),

      resetMission: () => {
        runIdRef.current = null;
        dispatch({ type: 'RESET' });
      },
    }),
    [enqueue, getRunId],
  );

  const value = useMemo(() => ({ state, submitAnswer, ...actions }), [state, submitAnswer, actions]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame precisa estar dentro de <GameProvider>');
  return context;
}
