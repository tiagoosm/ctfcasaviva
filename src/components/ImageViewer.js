import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LuChevronLeft,
  LuChevronRight,
  LuImageOff,
  LuLoaderCircle,
  LuRotateCcw,
  LuZoomIn,
  LuZoomOut,
} from 'react-icons/lu';
import { cn } from '../utils/format';
import Modal from './ui/Modal';

const MIN_SCALE = 1;
const MAX_SCALE = 6;
const ZOOM_STEP = 1.5;
const PAN_STEP = 60;
const RESET_VIEW = { scale: 1, x: 0, y: 0 };

const EMPTY_RECT = { width: 0, height: 0, left: 0, top: 0 };
const rectOf = (element) => element?.getBoundingClientRect() ?? EMPTY_RECT;

const clampNumber = (value, min, max) => Math.min(max, Math.max(min, value));

// Mantém a imagem sempre cobrindo a área visível (sem "fugir" para fora)
function clampView(view, rect) {
  const scale = clampNumber(view.scale, MIN_SCALE, MAX_SCALE);
  const maxX = (rect.width * (scale - 1)) / 2;
  const maxY = (rect.height * (scale - 1)) / 2;
  return { scale, x: clampNumber(view.x, -maxX, maxX), y: clampNumber(view.y, -maxY, maxY) };
}

// Amplia mantendo fixo o ponto sob o cursor/dedos (coordenadas relativas ao centro)
function zoomAround(view, nextScale, point, rect) {
  const scale = clampNumber(nextScale, MIN_SCALE, MAX_SCALE);
  const ratio = scale / view.scale;
  return clampView(
    { scale, x: point.x - (point.x - view.x) * ratio, y: point.y - (point.y - view.y) * ratio },
    rect,
  );
}

export default function ImageViewer({ images, index, onIndexChange, onClose }) {
  const open = index !== null;
  const image = open ? images[index] : null;

  const [view, setView] = useState(RESET_VIEW);
  const [dragging, setDragging] = useState(false);
  const [loadState, setLoadState] = useState('loading');
  const [retry, setRetry] = useState(0);
  const viewportRef = useRef(null);
  const pointers = useRef(new Map());
  const pinch = useRef(null);

  useEffect(() => {
    setView(RESET_VIEW);
    setLoadState('loading');
    setRetry(0);
  }, [index]);

  const getRect = () => rectOf(viewportRef.current);

  const toCenterPoint = (clientX, clientY) => {
    const rect = getRect();
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  };

  const zoomBy = useCallback((factor, point = { x: 0, y: 0 }) => {
    setView((current) =>
      zoomAround(current, current.scale * factor, point, rectOf(viewportRef.current)),
    );
  }, []);

  const panBy = (dx, dy) =>
    setView((current) => clampView({ ...current, x: current.x + dx, y: current.y + dy }, getRect()));

  const goTo = (delta) => onIndexChange((index + delta + images.length) % images.length);

  // A roda do mouse precisa de listener não-passivo para impedir o scroll da página
  useEffect(() => {
    const element = viewportRef.current;
    if (!element) return undefined;
    function onWheel(event) {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      const point = {
        x: event.clientX - rect.left - rect.width / 2,
        y: event.clientY - rect.top - rect.height / 2,
      };
      zoomBy(Math.exp(-event.deltaY * 0.0015), point);
    }
    element.addEventListener('wheel', onWheel, { passive: false });
    return () => element.removeEventListener('wheel', onWheel);
  }, [open, zoomBy]);

  function onPointerDown(event) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    setDragging(true);
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      pinch.current = { distance: Math.hypot(a.x - b.x, a.y - b.y), scale: view.scale };
    }
  }

  function onPointerMove(event) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const currentPoint = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, currentPoint);

    if (pointers.current.size === 1) {
      panBy(currentPoint.x - previous.x, currentPoint.y - previous.y);
    } else if (pointers.current.size === 2 && pinch.current?.distance) {
      const [a, b] = [...pointers.current.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const midpoint = toCenterPoint((a.x + b.x) / 2, (a.y + b.y) / 2);
      const targetScale = pinch.current.scale * (distance / pinch.current.distance);
      setView((current) => zoomAround(current, targetScale, midpoint, getRect()));
    }
  }

  function onPointerEnd(event) {
    pointers.current.delete(event.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (pointers.current.size === 0) setDragging(false);
  }

  function onDoubleClick(event) {
    const point = toCenterPoint(event.clientX, event.clientY);
    setView((current) =>
      current.scale > 1 ? RESET_VIEW : zoomAround(current, 3, point, getRect()),
    );
  }

  function onKeyDown(event) {
    const zoomed = view.scale > 1;
    const actions = {
      '+': () => zoomBy(ZOOM_STEP),
      '=': () => zoomBy(ZOOM_STEP),
      '-': () => zoomBy(1 / ZOOM_STEP),
      0: () => setView(RESET_VIEW),
      ArrowLeft: () => (zoomed ? panBy(PAN_STEP, 0) : goTo(-1)),
      ArrowRight: () => (zoomed ? panBy(-PAN_STEP, 0) : goTo(1)),
      ArrowUp: () => zoomed && panBy(0, PAN_STEP),
      ArrowDown: () => zoomed && panBy(0, -PAN_STEP),
    };
    const action = actions[event.key];
    if (action) {
      event.preventDefault();
      action();
    }
  }

  const zoomPercent = Math.round(view.scale * 100);
  const toolButton =
    'inline-flex h-11 w-11 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-fg hover:bg-ink-700 disabled:opacity-40';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={image ? `${image.label} de ${String(images.length).padStart(2, '0')}` : ''}
      description="Arraste para mover. Use a roda do mouse, o gesto de pinça ou os botões para ampliar."
    >
      {image && (
        <div className="flex h-full flex-col">
          <div
            ref={viewportRef}
            role="group"
            aria-roledescription="visualizador de imagem"
            aria-label={`${image.alt}. Ampliação atual: ${zoomPercent}%. Use + e − para ampliar, 0 para restaurar e as setas para mover.`}
            tabIndex={0}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerEnd}
            onPointerCancel={onPointerEnd}
            onDoubleClick={onDoubleClick}
            className={cn(
              'relative h-[calc(100dvh-11rem)] touch-none select-none overflow-hidden bg-black sm:h-[64dvh]',
              view.scale > 1 ? (dragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in',
            )}
          >
            {loadState !== 'error' && (
              <img
                key={`${image.src}-${retry}`}
                src={retry ? `${image.src}?tentativa=${retry}` : image.src}
                alt=""
                draggable={false}
                onLoad={() => setLoadState('loaded')}
                onError={() => setLoadState('error')}
                className={cn(
                  'pointer-events-none h-full w-full object-contain will-change-transform',
                  !dragging && 'transition-transform duration-150 ease-out',
                  loadState === 'loading' && 'opacity-0',
                )}
                style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}
              />
            )}

            {loadState === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-fg-muted">
                <LuLoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
                Carregando evidência…
              </div>
            )}

            {loadState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <LuImageOff className="h-10 w-10 text-warning" aria-hidden="true" />
                <p>Não foi possível carregar esta evidência.</p>
                <button
                  type="button"
                  className="min-h-11 rounded-xl bg-brand-orange px-5 font-display font-semibold text-ink-950"
                  onClick={() => {
                    setRetry((count) => count + 1);
                    setLoadState('loading');
                  }}
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-ink-600/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <button type="button" className={toolButton} onClick={() => goTo(-1)} aria-label="Evidência anterior">
                <LuChevronLeft className="h-5 w-5" aria-hidden="true" />
              </button>
              <span className="hidden min-w-[3.5rem] text-center font-mono text-sm text-fg-muted sm:inline">
                {index + 1} / {images.length}
              </span>
              <button type="button" className={toolButton} onClick={() => goTo(1)} aria-label="Próxima evidência">
                <LuChevronRight className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className={toolButton}
                onClick={() => zoomBy(1 / ZOOM_STEP)}
                disabled={view.scale <= MIN_SCALE}
                aria-label="Reduzir zoom"
              >
                <LuZoomOut className="h-5 w-5" aria-hidden="true" />
              </button>
              <output className="hidden min-w-[3.5rem] text-center font-mono text-sm sm:inline">
                {zoomPercent}%
              </output>
              <button
                type="button"
                className={toolButton}
                onClick={() => zoomBy(ZOOM_STEP)}
                disabled={view.scale >= MAX_SCALE}
                aria-label="Ampliar zoom"
              >
                <LuZoomIn className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                className={toolButton}
                onClick={() => setView(RESET_VIEW)}
                disabled={view.scale === 1}
                aria-label="Restaurar enquadramento"
              >
                <LuRotateCcw className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
