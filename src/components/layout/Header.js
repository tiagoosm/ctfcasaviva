import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { LuListOrdered, LuLogOut, LuMap } from 'react-icons/lu';
import { useGame } from '../../game/GameProvider';
import { getSummary, isRegistered } from '../../game/selectors';
import { cn } from '../../utils/format';
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
      <span className="sr-only sm:not-sr-only">{children}</span>
    </NavLink>
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

        <div className="flex items-center">
          <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
            {summary.hasStarted && (
              <NavItem to="/missao" icon={LuMap}>
                Mapa
              </NavItem>
            )}
            <NavItem to="/ranking" icon={LuListOrdered}>
              Ranking
            </NavItem>
          </nav>

          {/* Leaving is kept apart from navigation so it is not hit by accident */}
          {registered && (
            <div className="ml-4 border-l border-ink-600/60 pl-4 sm:ml-6 sm:pl-6">
              <button
                type="button"
                onClick={() => setConfirmLeave(true)}
                className={cn(itemClasses, 'text-fg-subtle hover:bg-danger/10 hover:text-danger')}
              >
                <LuLogOut className="h-5 w-5" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">Sair</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmLeave}
        title="Sair do CTF?"
        description={
          summary.isComplete
            ? 'Seu resultado oficial continua registrado.'
            : 'Seu progresso fica salvo. Para continuar depois, informe o mesmo nome e turma.'
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
