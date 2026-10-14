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

// Photos pinned to the board, each one a little crooked
const TILT = ['-rotate-[1.5deg]', 'rotate-1', 'rotate-[0.6deg]', '-rotate-1'];

function EvidenceCard({ evidence, tilt, onOpen }) {
  const [failed, setFailed] = useState(false);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className={`pin relative block w-full bg-white p-2.5 pb-1 text-left shadow-card transition-transform duration-200 hover:z-10 hover:rotate-0 hover:scale-[1.02] ${tilt}`}
        aria-label={`Abrir ${evidence.label}: ${evidence.alt}`}
      >
        <span className="relative block aspect-[4/3] overflow-hidden bg-[#DDE3EA]">
          {failed ? (
            <span className="flex h-full items-center justify-center text-[#5C6778]">
              <LuImageOff className="h-6 w-6" aria-hidden="true" />
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
        <span className="block px-1 pt-1.5 font-hand text-lg text-paper-ink">{evidence.label}</span>
      </button>
    </li>
  );
}

export default function GalleryStage() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section aria-label="Evidências">
      <ul className="grid grid-cols-2 gap-x-4 gap-y-6 pt-2 sm:gap-x-6 sm:gap-y-8">
        {EVIDENCE.map((evidence, index) => (
          <EvidenceCard
            key={evidence.src}
            evidence={evidence}
            tilt={TILT[index % TILT.length]}
            onOpen={() => setOpenIndex(index)}
          />
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
