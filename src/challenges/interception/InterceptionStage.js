import transmission from './transmission';

export default function InterceptionStage() {
  return (
    <article className="panel px-5 py-6 sm:px-7 sm:py-8" aria-labelledby="transmissao-titulo">
      <p className="eyebrow">Transmissão interceptada</p>
      <h2 id="transmissao-titulo" className="mt-2 text-2xl font-bold">
        Mensagens de guerra
      </h2>
      <div className="mt-5 max-w-prose space-y-5 text-[1.0625rem] leading-relaxed text-fg/90">
        {transmission.map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>
    </article>
  );
}
