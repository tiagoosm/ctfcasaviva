import { LuRadio } from 'react-icons/lu';
import CipherTool from '../../components/CipherTool';
import transmission from './transmission';

export default function InterceptionStage() {
  return (
    <div className="space-y-6">
      <article className="panel overflow-hidden" aria-labelledby="transmissao-titulo">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-ink-600/60 bg-ink-950/50 px-5 py-3 font-mono text-xs text-fg-subtle sm:px-7">
          <span className="flex items-center gap-2 text-brand-orange-light">
            <LuRadio className="h-4 w-4" aria-hidden="true" /> Transmissão interceptada
          </span>
          <span>Origem: arquivo histórico · {transmission.length} blocos</span>
        </div>
        <div className="px-5 py-6 sm:px-7 sm:py-8">
          <h2 id="transmissao-titulo" className="text-2xl font-bold">
            Mensagens de guerra
          </h2>
          <div className="mt-5 max-w-prose space-y-5 text-[1.0625rem] leading-relaxed text-fg/90">
            {transmission.map((paragraph, index) => (
              <p key={index} className="relative sm:pl-10">
                <span
                  className="absolute left-0 top-0.5 hidden font-mono text-xs text-fg-subtle sm:block"
                  aria-hidden="true"
                >
                  §{index + 1}
                </span>
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </article>

      <CipherTool />
    </div>
  );
}
