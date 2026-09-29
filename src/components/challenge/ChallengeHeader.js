import { LuCircleCheck } from 'react-icons/lu';
import Badge from '../ui/Badge';
import DifficultyMeter from '../ui/DifficultyMeter';

export function challengeLabel(challenge) {
  return challenge.code === 'FINAL' ? 'Desafio final' : `Desafio ${challenge.code}`;
}

export default function ChallengeHeader({ challenge, solved }) {
  return (
    <header className="max-w-3xl">
      <p className="eyebrow">
        {challengeLabel(challenge)} · {challenge.category}
      </p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{challenge.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-fg-muted">{challenge.objective}</p>
      <div className="mt-4 flex flex-wrap items-center gap-2.5">
        <Badge tone="orange">{challenge.points} pts</Badge>
        <Badge>{challenge.skill}</Badge>
        <DifficultyMeter level={challenge.difficulty} />
        {solved && (
          <Badge tone="success">
            <LuCircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> Concluído
          </Badge>
        )}
      </div>
    </header>
  );
}
