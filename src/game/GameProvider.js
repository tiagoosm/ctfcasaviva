import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react';
import { challenges } from '../challenges';
import { evaluateAnswer } from '../utils/answers';
import { gameReducer } from './gameReducer';
import { isSolved } from './selectors';
import { loadState, saveState } from './storage';

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const submitAnswer = useCallback(
    (challenge, rawAnswer) => {
      let result;
      try {
        result = evaluateAnswer(challenge, rawAnswer);
      } catch {
        return { status: 'error' };
      }
      if (result.status === 'empty') return result;

      dispatch({ type: 'RECORD_ATTEMPT', id: challenge.id });
      if (result.status === 'correct') {
        const othersSolved = challenges.every(
          (c) => c.id === challenge.id || isSolved(state, c.id),
        );
        dispatch({ type: 'SOLVE', id: challenge.id, now: Date.now(), completesMission: othersSolved });
      }
      return result;
    },
    [state],
  );

  const actions = useMemo(
    () => ({
      startMission: (codename, group) => dispatch({ type: 'START', codename, group, now: Date.now() }),
      revealHint: (challenge) => dispatch({ type: 'REVEAL_HINT', id: challenge.id }),
      resetMission: () => dispatch({ type: 'RESET' }),
    }),
    [],
  );

  const value = useMemo(() => ({ state, submitAnswer, ...actions }), [state, submitAnswer, actions]);

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame precisa estar dentro de <GameProvider>');
  return context;
}
