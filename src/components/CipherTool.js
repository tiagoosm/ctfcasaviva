import { useId, useState } from 'react';
import { LuMinus, LuPlus, LuSettings2 } from 'react-icons/lu';
import { ALPHABET, caesar } from '../utils/cipher';
import { cn } from '../utils/format';

const MODES = [
  { value: 'decode', label: 'Decifrar', detail: 'volta posições' },
  { value: 'encode', label: 'Cifrar', detail: 'avança posições' },
];

const mod26 = (n) => ((n % 26) + 26) % 26;

// Support tool: applies ONE shift at a time. For ciphers with several
// shifts (Vigenère), the letter-by-letter reasoning is still up to the player.
export default function CipherTool({ title = 'Disco de deslocamento' }) {
  const [shift, setShift] = useState(0);
  const [mode, setMode] = useState('decode');
  const [text, setText] = useState('');
  const baseId = useId();

  const direction = mode === 'decode' ? -1 : 1;
  const fromRow = ALPHABET.split('');
  const toRow = fromRow.map((letter) => caesar(letter, shift * direction));
  const output = caesar(text, shift * direction);

  const stepButton =
    'inline-flex h-11 w-11 items-center justify-center rounded-lg border border-ink-600 bg-ink-800 hover:bg-ink-700';

  return (
    <section className="panel p-5" aria-labelledby={`${baseId}-title`}>
      <h2 id={`${baseId}-title`} className="flex items-center gap-2 text-lg font-semibold">
        <LuSettings2 className="h-5 w-5 text-brand-blue-light" aria-hidden="true" />
        {title}
      </h2>

      <div className="mt-4 flex flex-wrap items-end gap-4">
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-fg-muted">Operação</legend>
          <div className="flex rounded-xl border border-ink-600 bg-ink-950/60 p-1">
            {MODES.map((option) => (
              <label
                key={option.value}
                className={cn(
                  'flex min-h-10 cursor-pointer items-center rounded-lg px-3 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-brand-orange-light',
                  mode === option.value ? 'bg-ink-700 text-fg' : 'text-fg-subtle hover:text-fg',
                )}
              >
                <input
                  type="radio"
                  name={`${baseId}-mode`}
                  value={option.value}
                  checked={mode === option.value}
                  onChange={() => setMode(option.value)}
                  className="sr-only"
                />
                {option.label}
                <span className="sr-only"> ({option.detail})</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor={`${baseId}-shift`} className="mb-1.5 block text-sm font-medium text-fg-muted">
            Letra-chave
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={stepButton}
              onClick={() => setShift((s) => mod26(s - 1))}
              aria-label="Letra-chave anterior"
            >
              <LuMinus className="h-4 w-4" aria-hidden="true" />
            </button>
            <select
              id={`${baseId}-shift`}
              value={shift}
              onChange={(event) => setShift(Number(event.target.value))}
              className="h-11 rounded-lg border border-ink-600 bg-ink-950/70 px-3 font-mono text-base"
            >
              {fromRow.map((letter, index) => (
                <option key={letter} value={index}>
                  {letter} = {index}
                </option>
              ))}
            </select>
            <button
              type="button"
              className={stepButton}
              onClick={() => setShift((s) => mod26(s + 1))}
              aria-label="Próxima letra-chave"
            >
              <LuPlus className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin mt-5 overflow-x-auto rounded-xl border border-ink-600 bg-ink-950/60">
        <table className="w-full border-collapse font-mono text-sm">
          <caption className="sr-only">
            Correspondência entre as letras com deslocamento de {shift} posições ({mode === 'decode' ? 'decifrando' : 'cifrando'})
          </caption>
          <tbody>
            {[
              { label: mode === 'decode' ? 'Cifrado' : 'Original', row: fromRow, accent: false },
              { label: mode === 'decode' ? 'Original' : 'Cifrado', row: toRow, accent: true },
            ].map(({ label, row, accent }) => (
              <tr key={label} className={accent ? 'border-t border-ink-600' : undefined}>
                <th
                  scope="row"
                  className="sticky left-0 bg-ink-900 px-3 py-2 text-left font-sans text-xs font-medium text-fg-subtle"
                >
                  {label}
                </th>
                {row.map((letter, index) => (
                  <td
                    key={index}
                    className={cn('min-w-[1.75rem] px-1 py-2 text-center', accent && 'text-brand-orange-light')}
                  >
                    {letter}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor={`${baseId}-text`} className="mb-1.5 block text-sm font-medium text-fg-muted">
            Teste um trecho
          </label>
          <input
            id={`${baseId}-text`}
            type="text"
            value={text}
            onChange={(event) => setText(event.target.value)}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            maxLength={80}
            placeholder="Digite letras aqui"
            className="h-11 w-full rounded-lg border border-ink-600 bg-ink-950/70 px-3 font-mono text-base placeholder:text-fg-subtle/70 focus:border-brand-orange focus:outline-none"
          />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-muted" id={`${baseId}-out-label`}>
            Resultado
          </p>
          <output
            aria-labelledby={`${baseId}-out-label`}
            className="flex h-11 items-center overflow-x-auto rounded-lg border border-dashed border-ink-600 px-3 font-mono text-base text-brand-orange-light"
          >
            {output || <span className="text-fg-subtle">—</span>}
          </output>
        </div>
      </div>
    </section>
  );
}
