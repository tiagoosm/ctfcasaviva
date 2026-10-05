import { LuCheck, LuFolderClosed } from 'react-icons/lu';
import Modal from '../../components/ui/Modal';
import { cn } from '../../utils/format';

// Static "damage" between the sections of the mission record (decoration only)
function Corruption() {
  return (
    <p className="select-none font-mono text-sm tracking-[0.3em] text-paper-ink/25" aria-hidden="true">
      ▓▒░ ░▒▓▓▒ ░░▒ ▓▒░▒
    </p>
  );
}

function DocumentBody({ document }) {
  const mission = document.tone === 'mission';

  return (
    <article
      className={cn(
        'relative overflow-hidden rounded-xl px-5 py-6 text-base leading-relaxed text-paper-ink shadow-paper sm:px-8 sm:py-8',
        mission ? 'bg-[#E6ECF5]' : 'bg-paper',
      )}
      aria-label={document.title}
    >
      <span
        className="pointer-events-none absolute right-4 top-4 rotate-[-6deg] rounded border-2 border-[#C0392B]/80 px-2 py-0.5 font-mono text-xs font-bold tracking-widest text-[#C0392B]/80"
        aria-hidden="true"
      >
        CONFIDENCIAL
      </span>

      <p className="font-mono text-xs tracking-widest text-paper-ink/60">{document.code}</p>
      <h3 className="mt-1 pr-28 font-display text-lg font-bold leading-snug sm:text-xl">{document.title}</h3>

      <div className="mt-5 space-y-4 border-t-2 border-dashed border-paper-line pt-5">
        {document.banner && (
          <p className="inline-block rounded bg-paper-ink px-2 py-1 font-mono text-xs font-semibold tracking-widest text-paper">
            {document.banner}
          </p>
        )}

        {document.paragraphs.map((text) => (
          <p key={text}>{text}</p>
        ))}

        {document.list && (
          <section>
            <h4 className="font-mono text-xs font-bold tracking-widest">{document.listTitle}</h4>
            <ul className="mt-2 space-y-1 font-mono text-sm sm:text-base">
              {document.list.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        )}

        {document.words && (
          <ul className="flex flex-wrap gap-2" aria-label="Palavras preservadas">
            {document.words.map((word) => (
              <li
                key={word}
                className="rounded border border-paper-line bg-white/60 px-3 py-1 font-mono text-base font-bold tracking-widest"
              >
                {word}
              </li>
            ))}
          </ul>
        )}

        {document.closing?.map((text) => (
          <p key={text}>{text}</p>
        ))}

        {document.facts && (
          <>
            <Corruption />
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 font-mono text-sm sm:text-base">
              {document.facts.map(([term, value]) => (
                <div key={term} className="contents">
                  <dt className="font-semibold">{term}:</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <Corruption />
          </>
        )}

        {document.signal && (
          <section className="space-y-2">
            <p>{document.signalIntro}</p>
            <p
              className="flex flex-wrap gap-x-3 gap-y-1 rounded-lg bg-paper-ink px-3 py-3 font-mono text-sm tracking-wider text-[#9FE8B8] sm:text-base"
              aria-label="Sequência recuperada"
            >
              {document.signal.map((group, index) => (
                <span key={index}>{group}</span>
              ))}
            </p>
            <p>{document.signalOutro}</p>
          </section>
        )}

        {document.quote && (
          <section className="space-y-2">
            <p>{document.quoteIntro}</p>
            <blockquote className="border-l-4 border-paper-ink/40 pl-3 font-display text-lg font-semibold italic">
              {document.quote}
            </blockquote>
          </section>
        )}
      </div>

      <div className="mt-6 space-y-0.5 border-t border-paper-line pt-4 font-mono text-xs font-semibold tracking-widest text-paper-ink/70">
        {document.footer.map((line) => (
          <p key={line}>{line}</p>
        ))}
      </div>
    </article>
  );
}

// A folder on the table: opens its document in a viewer
export default function CaseFile({ document, read, open, onOpen, onClose, tilt }) {
  const mission = document.tone === 'mission';

  return (
    <>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Abrir ${document.code}: ${document.label}`}
        className={cn('group relative block w-full pt-3 text-left transition-transform hover:-translate-y-1', tilt)}
      >
        <span
          className={cn(
            'absolute left-4 top-0 h-4 w-20 rounded-t-md',
            mission ? 'bg-[#C9D5E6]' : 'bg-[#E3D8BF]',
          )}
          aria-hidden="true"
        />
        <span
          className={cn(
            'relative block rounded-xl rounded-tl-none px-4 py-4 text-paper-ink shadow-paper transition-shadow group-hover:shadow-glow',
            mission ? 'bg-[#DCE4F0]' : 'bg-[#EFE6D2]',
          )}
        >
          <span className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 font-mono text-xs font-semibold tracking-widest text-paper-ink/70">
              <LuFolderClosed className="h-4 w-4" aria-hidden="true" />
              {document.code}
            </span>
            {read ? (
              <span className="flex items-center gap-1 font-mono text-[0.65rem] font-semibold tracking-widest text-paper-ink/60">
                <LuCheck className="h-3.5 w-3.5" aria-hidden="true" /> LIDO
              </span>
            ) : (
              <span className="rounded border border-[#C0392B]/70 px-1.5 font-mono text-[0.6rem] font-bold tracking-widest text-[#C0392B]/80">
                CONFIDENCIAL
              </span>
            )}
          </span>
          <span className="mt-2 block font-display text-lg font-bold">{document.label}</span>
          <span className="mt-3 block space-y-1.5" aria-hidden="true">
            <span className="block h-1.5 w-11/12 rounded bg-paper-ink/15" />
            <span className="block h-1.5 w-3/4 rounded bg-paper-ink/15" />
            <span className="block h-1.5 w-5/6 rounded bg-paper-ink/10" />
          </span>
        </span>
      </button>

      <Modal open={open} onClose={onClose} size="xl" title={`${document.code} · ${document.label}`}>
        <div className="p-4 sm:p-6">
          <DocumentBody document={document} />
        </div>
      </Modal>
    </>
  );
}
