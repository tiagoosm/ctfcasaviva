import CanvasText from './CanvasText';
import transmission from './transmission';

export default function InterceptionStage() {
  return (
    <article className="panel px-5 py-6 sm:px-7 sm:py-8" aria-labelledby="transmissao-titulo">
      <p className="eyebrow">Transmissão interceptada</p>
      <h2 id="transmissao-titulo" className="mt-2 text-2xl font-bold">
        Mensagens de guerra
      </h2>
      {/* Drawn, not written: the report can be read but not copied into a decoder */}
      <CanvasText
        paragraphs={transmission}
        label="Relato interceptado, exibido como imagem"
        className="mt-5 max-w-prose text-[1.0625rem] leading-relaxed text-fg/90"
      />
    </article>
  );
}
