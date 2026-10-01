import { useRef, useState } from 'react';
import { LuKeyRound, LuLock, LuLockOpen } from 'react-icons/lu';
import CipherTool from '../../components/CipherTool';
import { cn } from '../../utils/format';

// Colors + number: color helps, but is never the only way to identify the key letter
const KEY_COLORS = [
  'border-brand-orange text-brand-orange-light',
  'border-brand-blue-light text-brand-blue-light',
  'border-success text-success',
  'border-warning text-warning',
];

export default function VaultStage({ challenge, solved }) {
  const { ciphertext, keyLength } = challenge;
  const letters = ciphertext.split('');
  const [draft, setDraft] = useState(() => letters.map(() => ''));
  const inputsRef = useRef([]);

  function updateDraft(index, value) {
    const letter = value.replace(/[^a-zA-Z]/g, '').slice(-1).toUpperCase();
    setDraft((current) => current.map((item, i) => (i === index ? letter : item)));
    if (letter) inputsRef.current[index + 1]?.focus();
  }

  function onDraftKeyDown(index, event) {
    if (event.key === 'Backspace' && !draft[index]) inputsRef.current[index - 1]?.focus();
  }

  return (
    <div className="space-y-6">
      <section
        className={cn('panel overflow-hidden', solved && 'border-success/50')}
        aria-labelledby="cofre-titulo"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink-600/60 bg-ink-950/50 px-5 py-3 sm:px-7">
          <h2 id="cofre-titulo" className="flex items-center gap-2 font-mono text-sm text-fg-muted">
            {solved ? (
              <LuLockOpen className="h-4 w-4 text-success" aria-hidden="true" />
            ) : (
              <LuLock className="h-4 w-4 text-brand-orange-light" aria-hidden="true" />
            )}
            Cofre cas@viva
          </h2>
          <span className={cn('font-mono text-xs', solved ? 'text-success' : 'text-fg-subtle')}>
            {solved ? 'Aberto' : 'Bloqueado'}
          </span>
        </div>

        <div className="px-4 py-6 sm:px-7 sm:py-8">
          <p className="text-sm text-fg-muted">Mensagem protegida</p>
          <p className="sr-only">Texto cifrado: {letters.join(' ')}</p>

          <ol className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-9" aria-label="Rascunho de decifração">
            {letters.map((letter, index) => {
              const keyIndex = index % keyLength;
              return (
                <li key={index} className="flex flex-col items-center gap-1.5">
                  <span className="font-mono text-[0.7rem] text-fg-subtle" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span
                    className="flex h-12 w-full max-w-[3.25rem] items-center justify-center rounded-lg border border-ink-600 bg-ink-950 font-mono text-2xl font-semibold"
                    aria-hidden="true"
                  >
                    {letter}
                  </span>
                  <span
                    className={cn(
                      'flex h-6 w-full max-w-[3.25rem] items-center justify-center gap-0.5 rounded border font-mono text-[0.7rem]',
                      KEY_COLORS[keyIndex],
                    )}
                    aria-hidden="true"
                  >
                    <LuKeyRound className="h-3 w-3" />
                    {keyIndex + 1}
                  </span>
                  <input
                    ref={(element) => {
                      inputsRef.current[index] = element;
                    }}
                    type="text"
                    inputMode="text"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={draft[index]}
                    onChange={(event) => updateDraft(index, event.target.value)}
                    onKeyDown={(event) => onDraftKeyDown(index, event)}
                    aria-label={`Posição ${index + 1}: cifrada ${letter}, usa a letra ${keyIndex + 1} da chave. Sua letra decifrada`}
                    className="h-12 w-full max-w-[3.25rem] rounded-lg border-2 border-dashed border-ink-600 bg-transparent text-center font-mono text-xl uppercase text-brand-orange-light focus:border-brand-orange focus:outline-none"
                  />
                </li>
              );
            })}
          </ol>
          <p className="mt-3 text-xs text-fg-subtle">
            A última linha é seu rascunho: anote as letras decifradas. Ela não é enviada — a resposta
            vai no campo da flag.
          </p>

          <div className="mt-6 rounded-xl border border-ink-600 bg-ink-800/60 p-4">
            <h3 className="flex items-center gap-2 font-display font-semibold">
              <LuKeyRound className="h-4 w-4 text-brand-orange-light" aria-hidden="true" />
              Como este cofre funciona
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-fg-muted">
              A chave tem <strong className="text-fg">{keyLength} letras</strong> e se repete ao
              longo da mensagem: a 1ª letra da chave desloca as posições 1, 5 e 9; a 2ª desloca as
              posições 2 e 6; e assim por diante. Exemplo: com a chave <code className="font-mono text-fg">BAD</code>,
              a 1ª letra anda 1 posição, a 2ª anda 0, a 3ª anda 3 e a 4ª volta a andar 1.
            </p>
            <div className="mt-3 flex flex-wrap gap-2" aria-label={`Chave desconhecida de ${keyLength} letras`} role="img">
              {Array.from({ length: keyLength }, (_, i) => (
                <span
                  key={i}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-lg border-2 font-mono text-lg',
                    KEY_COLORS[i],
                  )}
                  aria-hidden="true"
                >
                  ?
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CipherTool />
    </div>
  );
}
