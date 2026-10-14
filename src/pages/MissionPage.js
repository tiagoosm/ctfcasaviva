import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { LuArrowRight, LuLock, LuTrophy } from 'react-icons/lu';
import { challengePath, tiers } from '../challenges';
import Button from '../components/ui/Button';
import FeedbackMessage from '../components/ui/FeedbackMessage';
import { useGame } from '../game/GameProvider';
import { getChallengeScore, getStatus, getSummary, isSolved } from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { cn } from '../utils/format';

const STATUS_TEXT = { solved: 'Concluída', available: 'Liberada', locked: 'Bloqueada' };

// Each sheet hangs a little crooked, always the same way
const TILT = ['-rotate-1', 'rotate-[1.2deg]', '-rotate-[0.6deg]', 'rotate-[0.8deg]', '-rotate-[1.4deg]'];

// Threads already pulled taut on this browser, so only new ones are animated
const THREADS_KEY = 'casaviva-ctf/threads';

function readThreads() {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(THREADS_KEY)) ?? []);
  } catch {
    return new Set();
  }
}

function saveThreads(ids) {
  try {
    window.localStorage.setItem(THREADS_KEY, JSON.stringify([...ids]));
  } catch {
    // Only decides whether a thread animates: nothing is lost without it
  }
}

function StatusMark({ status }) {
  if (status === 'solved') {
    return <span className="stamp text-sm text-brand-orange-light">{STATUS_TEXT.solved}</span>;
  }
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 font-display text-xs font-extrabold uppercase tracking-wider',
        status === 'available' ? 'text-brand-blue' : 'text-fg-subtle',
      )}
    >
      {status === 'locked' && <LuLock className="h-3.5 w-3.5" aria-hidden="true" />}
      {STATUS_TEXT[status]}
    </span>
  );
}

function ChallengeAction({ challenge, status }) {
  if (status === 'locked') return null;
  if (status === 'solved') {
    return (
      <Button to={challengePath(challenge)} variant="secondary" size="sm">
        Revisar<span className="sr-only"> {challenge.title}</span>
      </Button>
    );
  }
  return (
    <Button to={challengePath(challenge)} size="sm">
      Jogar<span className="sr-only"> {challenge.title}</span>
      <LuArrowRight className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}

// A sheet pinned to the board for one challenge
function EvidenceCard({ challenge, status, earned, tilt, cardRef, children }) {
  return (
    <li
      ref={cardRef}
      className={cn(
        'panel pin flex flex-col gap-3 p-4 pt-5 transition-transform duration-300',
        tilt,
        // Sealed: grey card stock, the secondary text a shade darker for contrast
        status === 'locked' && 'bg-[#D5DDE8] shadow-none [--fg-subtle:72_83_100]',
        status !== 'locked' && 'hover:rotate-0',
      )}
    >
      <div className="min-w-0">
        <p className="font-mono text-xs font-semibold text-fg-subtle">
          {challenge.code === 'FINAL' ? 'FINAL' : `EVIDÊNCIA ${challenge.code}`}
        </p>
        <h3 className="display-wide mt-0.5 break-words text-xl font-extrabold leading-tight text-fg">
          {challenge.title}
        </h3>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <StatusMark status={status} />
        <span className={cn('font-mono text-xs', status === 'solved' ? 'font-semibold text-success' : 'text-fg-subtle')}>
          {status === 'solved' ? `+${earned} pts` : `até ${challenge.points} pts`}
        </span>
      </div>
      {children}
      <div className="mt-auto">
        <ChallengeAction challenge={challenge} status={status} />
      </div>
    </li>
  );
}

// Orange thread between the pins: taut once the link is open, slack before.
// Rendered after the cards, so their refs are set when it measures them.
function Threads({ links, cardRefs }) {
  const svgRef = useRef(null);
  const [paths, setPaths] = useState([]);
  const seen = useRef(readThreads());

  const measure = useCallback(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const origin = svg.getBoundingClientRect();
    const point = (id, edge) => {
      const box = cardRefs.current[id]?.getBoundingClientRect();
      if (!box) return null;
      return {
        x: box.left + box.width / 2 - origin.left,
        y: (edge === 'top' ? box.top + 1 : box.bottom - 10) - origin.top,
      };
    };
    // Threads leaving the same sheet start side by side, not from one point
    const spread = (link) => {
      const siblings = links.filter((other) => other.from === link.from);
      return (siblings.indexOf(link) - (siblings.length - 1) / 2) * 22;
    };
    setPaths(
      links
        .map((link) => {
          const from = point(link.from, 'bottom');
          if (from) from.x += spread(link);
          const to = point(link.to, 'top');
          if (!from || !to) return null;
          const bend = Math.max(24, (to.y - from.y) * 0.55);
          return {
            ...link,
            d: `M ${from.x} ${from.y} C ${from.x} ${from.y + bend}, ${to.x} ${to.y - bend}, ${to.x} ${to.y}`,
          };
        })
        .filter(Boolean),
    );
  }, [links, cardRefs]);

  useLayoutEffect(() => {
    measure();
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    observer?.observe(svgRef.current);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [measure]);

  // Remember the taut threads after they have been drawn once
  useLayoutEffect(() => {
    const taut = links.filter((link) => link.taut).map((link) => link.id);
    if (taut.some((id) => !seen.current.has(id))) saveThreads(new Set([...seen.current, ...taut]));
  }, [links]);

  return (
    <svg
      ref={svgRef}
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      aria-hidden="true"
    >
      {paths.map((path) => {
        const fresh = path.taut && !seen.current.has(path.id);
        return path.taut ? (
          <path
            key={path.id}
            d={path.d}
            pathLength="1"
            fill="none"
            stroke="#E87000"
            strokeWidth="2.5"
            strokeLinecap="round"
            className={fresh ? 'animate-thread' : undefined}
            style={fresh ? { strokeDasharray: 1, '--thread-length': 1 } : undefined}
          />
        ) : (
          <path
            key={path.id}
            d={path.d}
            fill="none"
            stroke="#8FA9CC"
            strokeOpacity="0.55"
            strokeWidth="2"
            strokeDasharray="5 6"
          />
        );
      })}
    </svg>
  );
}

export default function MissionPage() {
  useDocumentTitle('Mapa da missão');
  const { state } = useGame();
  const location = useLocation();
  const summary = getSummary(state);
  const notice = location.state?.notice;
  const [opening, investigations, finale] = tiers;
  const cardRefs = useRef({});

  const feedback = notice
    ? { key: 'notice', tone: 'info', title: notice.title, message: notice.message }
    : null;

  let tiltIndex = 0;
  const card = (challenge, props) => (
    <EvidenceCard
      key={challenge.id}
      challenge={challenge}
      status={getStatus(state, challenge)}
      earned={getChallengeScore(state, challenge)}
      tilt={TILT[tiltIndex++ % TILT.length]}
      cardRef={(node) => {
        cardRefs.current[challenge.id] = node;
      }}
      {...props}
    />
  );

  const investigationsDone = investigations.filter((challenge) => isSolved(state, challenge.id)).length;
  const links = [
    ...opening.flatMap((from) =>
      investigations.map((to) => ({ id: `${from.id}-${to.id}`, from: from.id, to: to.id, taut: isSolved(state, from.id) })),
    ),
    ...investigations.flatMap((from) =>
      finale.map((to) => ({ id: `${from.id}-${to.id}`, from: from.id, to: to.id, taut: isSolved(state, from.id) })),
    ),
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="tape-title -rotate-1">Mapa da missão</h1>
        {summary.isComplete && (
          <Button to="/conclusao">
            <LuTrophy className="h-5 w-5" aria-hidden="true" /> Ver resultado
          </Button>
        )}
      </div>

      <p className="mt-4 font-mono text-sm text-fg-muted">
        {summary.solvedCount}/{summary.total} fases · {summary.score} pts
      </p>

      <FeedbackMessage feedback={feedback} className={feedback ? 'mt-6' : undefined} />

      {/* The investigation board: the sheets are linked by a thread */}
      <div className="relative isolate mt-8">

        <section className="relative z-10" aria-labelledby="mapa-inicio">
          <h2 id="mapa-inicio" className="font-hand text-xl text-fg-muted">
            Ponto de partida
          </h2>
          <ul className="mx-auto mt-2 max-w-xs px-2 sm:px-0">{opening.map((challenge) => card(challenge))}</ul>
        </section>

        <section className="relative z-10 mt-14" aria-labelledby="mapa-investigacoes">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="mapa-investigacoes" className="font-hand text-xl text-fg-muted [text-shadow:0_0_4px_#0B2F5E,0_0_8px_#0B2F5E]">
              Investigações · escolha por onde começar
            </h2>
            <p className="font-hand text-lg text-fg-muted [text-shadow:0_0_4px_#0B2F5E,0_0_8px_#0B2F5E]">
              {investigationsDone}/{investigations.length} concluídas
            </p>
          </div>
          <ul className="mt-2 grid grid-cols-1 gap-8 px-2 sm:grid-cols-3 sm:gap-6 sm:px-0">
            {investigations.map((challenge) => card(challenge))}
          </ul>
        </section>

        <section className="relative z-10 mt-14" aria-labelledby="mapa-final">
          <h2 id="mapa-final" className="font-hand text-xl text-fg-muted">
            Fase final
          </h2>
          <div className="mt-2 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-center">
            <ul className="w-full max-w-xs px-2 sm:px-0">{finale.map((challenge) => card(challenge))}</ul>
            {finale.some((challenge) => getStatus(state, challenge) === 'locked') && (
              // Sticky note left next to the sealed vault
              <p className="note w-full max-w-[13rem] rotate-2 px-4 py-3 font-hand text-lg leading-snug sm:mt-6">
                Conclua as {investigations.length} investigações para liberar o cofre
              </p>
            )}
          </div>
        </section>

        <Threads links={links} cardRefs={cardRefs} />
      </div>
    </div>
  );
}
