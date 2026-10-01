import { Link, NavLink } from 'react-router-dom';
import { LuFlag, LuListOrdered, LuMap } from 'react-icons/lu';
import { useGame } from '../../game/GameProvider';
import { getSummary } from '../../game/selectors';
import { cn } from '../../utils/format';
import BrandMark from './BrandMark';

function NavItem({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        cn(
          'inline-flex h-11 items-center gap-2 rounded-xl px-3 font-display text-sm font-semibold transition-colors',
          isActive ? 'bg-ink-700 text-fg' : 'text-fg-muted hover:bg-ink-800 hover:text-fg',
        )
      }
    >
      <Icon className="h-5 w-5" aria-hidden="true" />
      <span className="sr-only sm:not-sr-only">{children}</span>
    </NavLink>
  );
}

export default function Header() {
  const { state } = useGame();
  const summary = getSummary(state);

  return (
    <header className="no-print sticky top-0 z-30 border-b border-ink-600/50 bg-ink-900/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link to="/" className="rounded-lg" aria-label="CTF Inatel cas@viva — página inicial">
          <BrandMark compact={summary.hasStarted} />
        </Link>

        <nav aria-label="Principal" className="flex items-center gap-1 sm:gap-2">
          {summary.hasStarted && (
            <p className="mr-1 flex items-center gap-2 whitespace-nowrap rounded-full border border-ink-600 bg-ink-850 px-3 py-1.5 font-mono text-xs sm:text-sm">
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
        </nav>
      </div>
    </header>
  );
}
