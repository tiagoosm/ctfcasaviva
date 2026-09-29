import { useMemo } from 'react';
import useReducedMotion from '../hooks/useReducedMotion';

const COLORS = ['#E87000', '#FF9A3D', '#5B9BF0', '#004898', '#3DD68C', '#F5F2EA'];
const PIECES = 48;

// Celebração curta (uma única queda) — não fica em loop distraindo o jogador
export default function Confetti() {
  const reducedMotion = useReducedMotion();

  const pieces = useMemo(
    () =>
      Array.from({ length: PIECES }, (_, i) => ({
        left: Math.random() * 100,
        size: 6 + Math.random() * 7,
        color: COLORS[i % COLORS.length],
        round: Math.random() > 0.5,
        duration: 2.6 + Math.random() * 2.4,
        delay: Math.random() * 1.2,
      })),
    [],
  );

  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden="true">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="absolute -top-4 block"
          style={{
            left: `${piece.left}%`,
            width: piece.size,
            height: piece.size,
            background: piece.color,
            borderRadius: piece.round ? '50%' : '2px',
            opacity: 0,
            animation: `confetti-fall ${piece.duration}s ${piece.delay}s cubic-bezier(0.3, 0.6, 0.6, 1) 1 forwards`,
          }}
        />
      ))}
    </div>
  );
}
