import { useState } from 'react';
import CaseFile from './CaseFile';
import { DOCUMENTS } from './documents';
import VaultPanel from './VaultPanel';

// Slight tilts so the folders look dropped on a table rather than laid out in a grid
const TILTS = ['rotate-[-1.5deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]'];

// The investigation room: a vault and three case files. Only one of the files
// leads to the combination; finding out which is part of the challenge.
export default function VaultStage({ challenge, solved, onSubmitAnswer, preview = false }) {
  const [openId, setOpenId] = useState(null);
  const [read, setRead] = useState(() => new Set());

  function openDocument(id) {
    setOpenId(id);
    setRead((current) => new Set(current).add(id));
  }

  return (
    <section
      className="relative overflow-hidden rounded-3xl border border-ink-600/60 bg-ink-950/70 p-4 sm:p-6"
      aria-label="Sala de investigação"
    >
      {/* Desk lamp glow over the table */}
      <span
        className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-brand-orange/10 blur-3xl"
        aria-hidden="true"
      />

      <p className="relative font-mono text-xs uppercase tracking-[0.25em] text-fg-subtle">
        Arquivo final · acesso restrito
      </p>

      <div className="relative mt-5 grid items-start gap-6 md:grid-cols-[minmax(0,19rem)_minmax(0,1fr)]">
        <VaultPanel
          codeLength={challenge.codeLength}
          solved={solved}
          onSubmitAnswer={onSubmitAnswer}
          preview={preview}
        />

        <ul className="space-y-5" aria-label="Documentos encontrados">
          {DOCUMENTS.map((document, index) => (
            <li key={document.id}>
              <CaseFile
                document={document}
                tilt={TILTS[index]}
                read={read.has(document.id)}
                open={openId === document.id}
                onOpen={() => openDocument(document.id)}
                onClose={() => setOpenId(null)}
              />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
