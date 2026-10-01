import { LOGO_SRC } from '../../components/layout/BrandMark';

// "Fake" redaction bars: solid blocks that hide nothing, there only as decoys
function SolidRedaction({ length }) {
  return (
    <span className="redacted" role="img" aria-label="trecho censurado">
      {'█'.repeat(length)}
    </span>
  );
}

export default function BriefingStage() {
  return (
    <article
      className="relative overflow-hidden rounded-2xl bg-paper text-paper-ink shadow-paper"
      aria-label="Dossiê de recrutamento"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-dashed border-paper-line px-5 py-4 sm:px-8">
        <img src={LOGO_SRC} alt="Inatel cas@viva" width="132" height="44" className="h-9 w-auto" />
        <p className="font-mono text-xs uppercase tracking-widest text-[#C0392B]">Confidencial</p>
      </div>

      <div className="space-y-5 px-5 py-6 leading-relaxed sm:px-8 sm:py-8">
        <h2 className="font-display text-2xl font-bold">Operação cas@viva</h2>

        <p>
          Você foi recrutado(a) para uma investigação digital. Mensagens protegidas foram deixadas
          em sistemas do Inatel cas@viva, e cada etapa guarda uma resposta a ser descoberta.
        </p>

        <dl className="space-y-2 font-mono text-sm">
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

        <p className="border-t border-paper-line pt-4 text-sm italic text-paper-ink/75">
          Informações sensíveis foram censuradas. Ou pelo menos é o que parece.
        </p>
      </div>
    </article>
  );
}
