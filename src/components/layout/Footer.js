import { Wordmark } from './BrandMark';

export default function Footer() {
  return (
    <footer className="no-print mt-auto border-t border-ink-600/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-6 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          CTF educacional do Inatel <Wordmark className="text-fg-muted" />
        </p>
        <p>Observe. Deduza. Decifre.</p>
      </div>
    </footer>
  );
}
