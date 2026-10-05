import { challenges } from '../challenges';
import { useGame } from '../game/GameProvider';
import { formatPlayerName } from '../game/names';
import { getRank, getStatus, getSummary } from '../game/selectors';
import { cn } from '../utils/format';
import { LOGO_SRC } from './layout/BrandMark';

// Investigation badge: ties the mission to cas@viva's real visual identity
export default function Credential({ codename, group }) {
  const { state } = useGame();
  const summary = getSummary(state);
  const level = summary.isComplete ? getRank(summary.score).title : 'Recruta';

  return (
    <div className="relative mx-auto w-full max-w-sm">
      <span
        className="pointer-events-none absolute -right-6 -top-16 select-none font-display text-[12rem] font-bold leading-none text-brand-orange/10 sm:text-[14rem]"
        aria-hidden="true"
      >
        @
      </span>
      <div className="relative rotate-[1.5deg] overflow-hidden rounded-2xl bg-paper text-paper-ink shadow-paper transition-transform duration-500 hover:rotate-0">
        <div className="flex items-center justify-between bg-white px-5 py-4">
          <img src={LOGO_SRC} alt="Inatel cas@viva" width="132" height="44" className="h-10 w-auto" />
          <span className="h-3 w-12 rounded-full bg-paper-line" aria-hidden="true" />
        </div>
        <div className="h-1.5 bg-gradient-to-r from-brand-orange to-brand-blue" aria-hidden="true" />
        <div className="space-y-4 px-5 py-5">
          <p className="font-mono text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-brand-blue">
            Credencial de investigação
          </p>
          <div>
            <p className="text-xs text-paper-ink/70">NOME COMPLETO</p>
            <p className="truncate font-display text-2xl font-bold">
              {formatPlayerName(codename) || '—'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="min-w-0">
              <p className="text-xs text-paper-ink/70">TURMA</p>
              <p className="truncate font-semibold">{group?.trim() || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-paper-ink/70">NÍVEL</p>
              <p className="font-semibold">{level}</p>
            </div>
            <div>
              <p className="text-xs text-paper-ink/70">PONTUAÇÃO</p>
              <p className="font-mono font-semibold">{summary.score} pts</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-paper-ink/70">
              Flags capturadas: {summary.solvedCount} de {summary.total}
            </p>
            <div className="mt-2 flex gap-1.5" aria-hidden="true">
              {challenges.map((challenge) => (
                <span
                  key={challenge.id}
                  className={cn(
                    'h-2 flex-1 rounded-full',
                    getStatus(state, challenge) === 'solved' ? 'bg-brand-orange' : 'bg-paper-line',
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
