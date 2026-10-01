import { Link } from 'react-router-dom';
import { LuArrowRight } from 'react-icons/lu';
import { challenges, TOTAL_POINTS } from '../challenges';
import { challengeLabel } from '../components/challenge/ChallengeHeader';
import { SCORING } from '../game/scoring';
import useDocumentTitle from '../hooks/useDocumentTitle';

const RULES = [
  ['Base', `${Math.round(SCORING.baseShare * 100)}% da fase ao resolver`],
  ['Velocidade', `até ${Math.round((1 - SCORING.baseShare) * 100)}% de bônus, caindo com o tempo`],
  ['Erro', `−${SCORING.wrongPenalty} por resposta errada (no máximo ${SCORING.maxChargedWrong} cobradas)`],
  ['Dica', `−${SCORING.hintPenalty}, uma por fase`],
  ['Total', `${TOTAL_POINTS} pontos; nenhuma fase fica abaixo de zero`],
];

export default function ChallengesPage() {
  useDocumentTitle('Fases · Administração');

  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Fases</h1>

      <ol className="mt-6 space-y-3">
        {challenges.map((challenge) => (
          <li key={challenge.id}>
            <Link
              to={`/admin/fases/${challenge.slug}`}
              className="panel flex items-center gap-4 p-4 transition-colors hover:border-brand-orange/60"
            >
              <span className="min-w-0 flex-1">
                <span className="eyebrow block">{challengeLabel(challenge)}</span>
                <span className="mt-1 block text-lg font-semibold">{challenge.title}</span>
                <span className="mt-0.5 block truncate text-sm text-fg-muted">{challenge.objective}</span>
              </span>
              <span className="whitespace-nowrap font-mono text-sm text-fg-subtle">
                {challenge.points} pts
              </span>
              <LuArrowRight className="h-5 w-5 shrink-0 text-fg-subtle" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>

      <section className="mt-10" aria-labelledby="regras-pontuacao">
        <h2 id="regras-pontuacao" className="text-xl font-semibold">
          Regras de pontuação
        </h2>
        <dl className="panel mt-3 divide-y divide-ink-600/40">
          {RULES.map(([term, description]) => (
            <div key={term} className="flex gap-4 px-4 py-3">
              <dt className="w-24 shrink-0 font-semibold">{term}</dt>
              <dd className="text-fg-muted">{description}</dd>
            </div>
          ))}
        </dl>
      </section>
    </>
  );
}
