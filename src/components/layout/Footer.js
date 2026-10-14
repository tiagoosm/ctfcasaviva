import { Wordmark } from './BrandMark';

export default function Footer() {
  return (
    <footer className="no-print mt-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-8 text-sm text-fg-subtle sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          CTF educacional do Inatel <Wordmark className="text-fg-muted" />
        </p>
        {/* Written on the board by the investigator */}
        <p className="font-hand text-lg text-fg-muted">Observe. Deduza. Decifre.</p>
      </div>
    </footer>
  );
}