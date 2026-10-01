import { useState } from 'react';
import { LuImageOff, LuScanSearch } from 'react-icons/lu';
import ImageViewer from '../../components/ImageViewer';

const base = `${process.env.PUBLIC_URL}/assets/gallery`;

// The original resolution is kept in the large files: the marks are small
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
        className="group block w-full overflow-hidden rounded-xl border border-ink-600 bg-ink-950 text-left transition-[border-color,transform] hover:-translate-y-0.5 hover:border-brand-orange/70"
        aria-label={`Examinar ${evidence.label}: ${evidence.alt}`}
      >
        <span className="relative block aspect-[4/3] overflow-hidden bg-ink-800">
          {failed ? (
            <span className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center text-sm text-fg-muted">
              <LuImageOff className="h-6 w-6 text-warning" aria-hidden="true" />
              Prévia indisponível — abra para tentar de novo
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
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          )}
        </span>
        <span className="flex items-center justify-between gap-2 px-3.5 py-3">
          <span className="font-mono text-sm font-medium">{evidence.label}</span>
          <span className="flex items-center gap-1.5 text-sm text-brand-orange-light">
            <LuScanSearch className="h-4 w-4" aria-hidden="true" />
            Examinar
          </span>
        </span>
      </button>
    </li>
  );
}

export default function GalleryStage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="panel p-4 sm:p-6" aria-labelledby="evidencias-titulo">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="evidencias-titulo" className="text-xl font-semibold">
          Evidências recuperadas
        </h2>
        <p className="font-mono text-xs text-fg-subtle">4 arquivos · ordem de catalogação</p>
      </div>
      <p className="mt-1 text-sm text-fg-muted">
        Abra cada evidência para examiná-la em detalhe. Amplie, mova e observe com atenção.
      </p>

      <ul className="mt-5 grid grid-cols-2 gap-3 sm:gap-4">
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
