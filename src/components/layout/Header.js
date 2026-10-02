import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LuListOrdered, LuLogOut, LuMap, LuPause, LuTimer } from 'react-icons/lu';
import { useGame } from '../../game/GameProvider';
import { getSummary, isRegistered } from '../../game/selectors';
import useMissionClock from '../../hooks/useMissionClock';
import { cn, formatClock } from '../../utils/format';
import ConfirmDialog from '../ui/ConfirmDialog';
import BrandMark from './BrandMark';

const itemClasses =
  'inline-flex h-10 items-center gap-2 rounded-lg px-2.5 font-display text-sm font-semibold transition-colors md:px-3';

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(itemClasses, isActive ? 'text-brand-orange-light' : 'text-fg-muted hover:text-fg')
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only md:not-sr-only">{children}</span>
    </NavLink>
  );
}

// Mission clock, always at the top right corner. It only runs while the player
// is inside a challenge, and freezes once the last one is solved.
function MissionTimer() {
  const { seconds, running, finished } = useMissionClock();
  if (seconds === null) return null;

  const Icon = running || finished ? LuTimer : LuPause;
  const label = finished ? 'Tempo final da missão' : running ? 'Tempo de missão' : 'Tempo pausado';

  return (
    <p
      title={label}
      className={cn(
        'flex h-10 items-center gap-1.5 rounded-full border px-3 font-mono text-base font-bold tabular-nums transition-colors sm:px-3.5',
        finished && 'border-success/50 bg-success/10 text-success',
        running && 'border-brand-orange/60 bg-brand-orange/10 text-brand-orange-light',
        !running && !finished && 'border-ink-600 bg-ink-850 text-fg-muted',
      )}
    >
      <Icon className="h-[1.125rem] w-[1.125rem]" aria-hidden="true" />
      <span className="sr-only">{label}: </span>
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
    <header className="no-print sticky top-0 z-30 border-b border-ink-600/40 bg-ink-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="rounded-lg" aria-label="CTF Inatel cas@viva — página inicial">
          <BrandMark compact={summary.hasStarted} />
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav aria-label="Principal" className="flex items-center sm:gap-1">
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
                className={cn(itemClasses, 'text-fg-muted hover:text-fg')}
              >
                <LuLogOut className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only md:not-sr-only">Sair</span>
              </button>
            )}
          </nav>
          <MissionTimer />
        </div>
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
