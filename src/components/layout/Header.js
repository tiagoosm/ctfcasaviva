import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LuFlag, LuListOrdered, LuLogOut, LuMap, LuTimer } from 'react-icons/lu';
import { useGame } from '../../game/GameProvider';
import { getSummary, isRegistered } from '../../game/selectors';
import useMissionClock from '../../hooks/useMissionClock';
import { cn, formatClock } from '../../utils/format';
import ConfirmDialog from '../ui/ConfirmDialog';
import BrandMark from './BrandMark';

const itemClasses =
  'inline-flex h-11 items-center gap-2 rounded-xl px-3 font-display text-sm font-semibold transition-colors';

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(itemClasses, isActive ? 'bg-ink-700 text-fg' : 'text-fg-muted hover:bg-ink-800 hover:text-fg')
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only lg:not-sr-only">{children}</span>
    </NavLink>
  );
}

// Mission clock, always at the top right corner: total time since the mission
// started, frozen once the last challenge is solved
function MissionTimer() {
  const { seconds, finished } = useMissionClock();
  if (seconds === null) return null;

  return (
    <p
      className={cn(
        'ml-1 flex h-10 items-center gap-1.5 rounded-full border px-3 font-mono text-base font-bold tabular-nums sm:px-3.5 sm:text-lg',
        finished
          ? 'border-success/50 bg-success/10 text-success'
          : 'border-brand-orange/60 bg-brand-orange/10 text-brand-orange-light shadow-glow',
      )}
    >
      <LuTimer className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only">{finished ? 'Tempo final da missão: ' : 'Tempo de missão: '}</span>
      <span role="timer" aria-live="off">
        {formatClock(seconds)}
      </span>
    </p>
  );
}

export default function Header() {
  const { state, leaveMission } = useGame();
  const summary = getSummary(state);
  const registered = isRegistered(state);
  const navigate = useNavigate();
  const [confirmLeave, setConfirmLeave] = useState(false);

  return (
    <header className="no-print sticky top-0 z-30 border-b border-ink-600/50 bg-ink-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <Link to="/" className="rounded-lg" aria-label="CTF Inatel cas@viva — página inicial">
          <BrandMark compact={summary.hasStarted} />
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-0.5 sm:gap-1.5">
          {summary.hasStarted && (
            <p className="mr-1 hidden items-center gap-2 whitespace-nowrap rounded-full border border-ink-600 bg-ink-850 px-3 py-1.5 font-mono text-sm md:flex">
              <LuFlag className="h-4 w-4 text-brand-orange" aria-hidden="true" />
              <span>
                {summary.solvedCount}/{summary.total}
                <span className="sr-only"> etapas concluídas</span>
              </span>
              <span className="text-ink-600" aria-hidden="true">
                |
              </span>
              <span>
                {summary.score}
                <span className="text-fg-subtle"> pts</span>
              </span>
            </p>
          )}
          {summary.hasStarted && (
            <NavItem to="/missao" icon={LuMap}>
              Mapa
            </NavItem>
          )}
          <NavItem to="/ranking" icon={LuListOrdered}>
            Ranking
          </NavItem>
          {registered && (
            <button
              type="button"
              onClick={() => setConfirmLeave(true)}
              className={cn(itemClasses, 'text-fg-muted hover:bg-ink-800 hover:text-fg')}
            >
              <LuLogOut className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only lg:not-sr-only">Sair</span>
            </button>
          )}
          <MissionTimer />
        </nav>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        title="Sair do CTF?"
        description={
          summary.isComplete
            ? 'Seus dados serão apagados deste navegador. O resultado já enviado ao ranking é mantido.'
            : 'Você perderá todo o progresso desta missão e voltará ao início.'
        }
        confirmLabel="Sair"
        onCancel={() => setConfirmLeave(false)}
        onConfirm={() => {
          setConfirmLeave(false);
          leaveMission();
          navigate('/');
        }}
      />
    </header>
  );
}
