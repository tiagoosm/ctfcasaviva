import { useEffect, useState } from 'react';
import { LuChevronLeft, LuChevronRight, LuImageOff, LuLoaderCircle } from 'react-icons/lu';
import { cn } from '../utils/format';
import Modal from './ui/Modal';

// Shows the image at a single, fixed size: there is deliberately no zoom of any kind
export default function ImageViewer({ images, index, onIndexChange, onClose }) {
  const open = index !== null;
  const image = open ? images[index] : null;

  const [loadState, setLoadState] = useState('loading');
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    setLoadState('loading');
    setRetry(0);
  }, [index]);

  const goTo = (delta) => onIndexChange((index + delta + images.length) % images.length);

  function onKeyDown(event) {
    if (event.key === 'ArrowLeft') goTo(-1);
    else if (event.key === 'ArrowRight') goTo(1);
  }

  const navButton =
    'inline-flex h-11 w-11 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 text-fg hover:bg-ink-700';

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={image ? `${image.label} de ${String(images.length).padStart(2, '0')}` : ''}
    >
      {image && (
        <div className="flex h-full flex-col" onKeyDown={onKeyDown}>
          <div
            role="img"
            aria-label={image.alt}
            onContextMenu={(event) => event.preventDefault()}
            className="relative h-[calc(100dvh-9rem)] touch-none select-none overflow-hidden bg-black sm:h-[64dvh]"
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
                  'pointer-events-none h-full w-full object-contain',
                  loadState === 'loading' && 'opacity-0',
                )}
              />
            )}

            {loadState === 'loading' && (
              <div className="absolute inset-0 flex items-center justify-center gap-2 text-fg-muted">
                <LuLoaderCircle className="h-6 w-6 animate-spin" aria-hidden="true" />
                Carregando…
              </div>
            )}

            {loadState === 'error' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
                <LuImageOff className="h-10 w-10 text-warning" aria-hidden="true" />
                <p>Não foi possível carregar esta imagem.</p>
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

          <div className="flex items-center justify-center gap-3 border-t border-ink-600/60 px-4 py-3">
            <button type="button" className={navButton} onClick={() => goTo(-1)} aria-label="Evidência anterior">
              <LuChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <span className="min-w-[3.5rem] text-center font-mono text-sm text-fg-muted">
              {index + 1} / {images.length}
            </span>
            <button type="button" className={navButton} onClick={() => goTo(1)} aria-label="Próxima evidência">
              <LuChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
