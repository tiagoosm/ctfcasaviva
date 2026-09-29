import { LOGO_SRC } from '../../components/layout/BrandMark';

// Tarjas "falsas": blocos sólidos que não escondem nada, só para despistar
function SolidRedaction({ length }) {
  return (
    <span className="redacted" role="img" aria-label="trecho censurado">
      {'█'.repeat(length)}
    </span>
  );
}

const RULES = [
  ['Flag', 'É a resposta de cada desafio. Envie no formato casaviva{resposta} ou apenas a resposta.'],
  ['Progressão', 'Cada desafio só é liberado quando o anterior é resolvido. Seu progresso fica salvo.'],
  ['Dicas', 'Estão sempre disponíveis, mas custam pontos. Use-as com estratégia.'],
  ['Erros', 'Não tiram pontos. Testar hipóteses faz parte da investigação.'],
];

export default function BriefingStage() {
  return (
    <article
      className="relative overflow-hidden rounded-2xl bg-paper text-paper-ink shadow-paper"
      aria-label="Dossiê de recrutamento"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-paper-line px-5 py-4 sm:px-8">
        <img src={LOGO_SRC} alt="Inatel cas@viva" width="132" height="44" className="h-9 w-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-paper-ink/70">
          Dossiê 00 · Acesso: recruta
        </p>
      </div>

      <span
        className="pointer-events-none absolute right-4 top-20 rotate-[-8deg] rounded-md border-[3px] border-[#C0392B] px-3 py-1 font-display text-lg font-bold uppercase tracking-widest text-[#C0392B] opacity-80 animate-stamp sm:right-10 sm:text-xl"
        aria-hidden="true"
      >
        Confidencial
      </span>

      <div className="space-y-5 px-5 py-6 leading-relaxed sm:px-8 sm:py-8">
        <h2 className="pr-28 font-display text-2xl font-bold sm:pr-40">Bem-vindo(a) à Operação cas@viva</h2>

        <p>
          Você foi recrutado(a) para uma investigação digital. Uma sequência de mensagens protegidas
          foi deixada em sistemas do Inatel cas@viva, e cada uma delas guarda uma{' '}
          <strong>flag</strong>: a prova de que você decifrou aquela etapa.
        </p>

        <p>
          Em um <strong>Capture The Flag</strong> (CTF), ninguém entrega a resposta pronta. Você vai
          observar detalhes, testar hipóteses e conectar pistas — exatamente como profissionais de
          segurança da informação fazem.
        </p>

        <section aria-labelledby="regras-titulo" className="rounded-xl border border-paper-line bg-white/60 p-4 sm:p-5">
          <h3 id="regras-titulo" className="font-display text-sm font-bold uppercase tracking-wider">
            Regras da missão
          </h3>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {RULES.map(([term, description]) => (
              <div key={term}>
                <dt className="font-semibold">{term}</dt>
                <dd className="text-sm text-paper-ink/80">{description}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="registro-titulo" className="font-mono text-sm">
          <h3 id="registro-titulo" className="font-display text-sm font-bold uppercase tracking-wider">
            Registro de acesso
          </h3>
          <dl className="mt-3 space-y-2">
            <div className="flex flex-wrap gap-x-2">
              <dt>Responsável:</dt>
              <dd>
                <SolidRedaction length={12} />
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt>Local:</dt>
              <dd>
                Laboratório <SolidRedaction length={6} />
              </dd>
            </div>
            <div className="flex flex-wrap gap-x-2">
              <dt>Senha do primeiro acesso:</dt>
              <dd>
                <span className="redacted">começar</span>
              </dd>
            </div>
          </dl>
        </section>

        <p className="border-t border-paper-line pt-4 text-sm italic text-paper-ink/75">
          Por segurança, informações sensíveis deste dossiê foram censuradas. Ou pelo menos é o que
          parece.
        </p>
      </div>
    </article>
  );
}
