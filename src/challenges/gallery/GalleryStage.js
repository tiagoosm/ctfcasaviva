import { useState } from 'react';
import { LuImageOff } from 'react-icons/lu';
import ImageViewer from '../../components/ImageViewer';

const base = `${process.env.PUBLIC_URL}/assets/gallery`;

const EVIDENCE = [
  {
    alt: 'Pintura de uma igreja de pedra sob um céu azul-escuro agitado, com uma mulher caminhando por uma trilha de terra',
  },
  {
    alt: 'Pintura noturna de um rio que reflete as luzes da cidade, com um céu estrelado e um casal à margem',
  },
  {
    alt: 'Pintura de um quarto simples com cama de madeira amarela, cadeiras, uma mesa e quadros pendurados na parede',
  },
  {
    alt: 'Pintura de um céu noturno em redemoinhos, com lua, estrelas brilhantes, um cipreste escuro e um pequeno vilarejo',
  },
].map((item, index) => ({
  ...item,
  label: `Evidência ${String(index + 1).padStart(2, '0')}`,
  src: `${base}/evidencia-${index + 1}.webp`,
  thumb: `${base}/evidencia-${index + 1}-thumb.webp`,
}));

function EvidenceCard({ evidence, onOpen }) {
  const [failed, setFailed] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="block w-full overflow-hidden rounded-xl border border-ink-600 bg-ink-950 text-left transition-colors hover:border-brand-orange/70"
        aria-label={`Abrir ${evidence.label}: ${evidence.alt}`}
      >
        <span className="relative block aspect-[4/3] overflow-hidden bg-ink-800">
          {failed ? (
            <span className="flex h-full items-center justify-center text-fg-muted">
              <LuImageOff className="h-6 w-6 text-warning" aria-hidden="true" />
            </span>
          ) : (
            <img
              src={evidence.thumb}
              alt=""
              width="640"
              height="480"
              loading="lazy"
              decoding="async"
              onError={() => setFailed(true)}
              className="h-full w-full object-cover"
            />
          )}
        </span>
        <span className="block px-3.5 py-2.5 font-mono text-sm font-medium">{evidence.label}</span>
      </button>
    </li>
  );
}

export default function GalleryStage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section aria-label="Evidências">
      <ul className="grid grid-cols-2 gap-3 sm:gap-4">
        {EVIDENCE.map((evidence, index) => (
          <EvidenceCard key={evidence.src} evidence={evidence} onOpen={() => setOpenIndex(index)} />
        ))}
      </ul>

      <ImageViewer
        images={EVIDENCE}
        index={openIndex}
        onIndexChange={setOpenIndex}
        onClose={() => setOpenIndex(null)}
      />
    </section>
  );
}
