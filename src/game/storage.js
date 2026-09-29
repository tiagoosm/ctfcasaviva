import { createInitialState, sanitizeCodename, STATE_VERSION } from './gameReducer';

export const STORAGE_KEY = 'casaviva-ctf/progress';

const isTimestamp = (value) => (Number.isFinite(value) && value > 0 ? value : null);
const isCount = (value) => (Number.isInteger(value) && value >= 0 ? value : 0);

// Dados do localStorage podem estar corrompidos, editados à mão ou em formato
// antigo: aceitamos só o que tem a forma esperada e descartamos o resto.
export function parseState(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || data.version !== STATE_VERSION || typeof data.progress !== 'object') return null;

    const progress = {};
    for (const [id, entry] of Object.entries(data.progress ?? {})) {
      if (!entry || typeof entry !== 'object') continue;
      progress[id] = {
        attempts: isCount(entry.attempts),
        hintsRevealed: isCount(entry.hintsRevealed),
        solvedAt: isTimestamp(entry.solvedAt),
      };
    }

    return {
      ...createInitialState(sanitizeCodename(data.codename)),
      startedAt: isTimestamp(data.startedAt),
      finishedAt: isTimestamp(data.finishedAt),
      progress,
    };
  } catch {
    return null;
  }
}

// Em aba anônima, modo de economia ou com cookies bloqueados o acesso ao
// storage pode lançar erro — o jogo continua funcionando, só não persiste.
export function loadState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return (raw && parseState(raw)) || createInitialState();
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Sem persistência disponível: o progresso fica apenas nesta sessão
  }
}
