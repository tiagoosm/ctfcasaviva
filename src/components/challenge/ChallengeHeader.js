export function challengeLabel(challenge) {
  return challenge.code === 'FINAL' ? 'Desafio final' : `Desafio ${challenge.code}`;
}

export default function ChallengeHeader({ challenge }) {
  return (
    <header className="max-w-3xl">
      <p className="eyebrow -rotate-1">
        {challengeLabel(challenge)} · até {challenge.points} pts
      </p>
      <h1 className="display-wide mt-4 break-words text-[2rem] font-black uppercase leading-none sm:text-5xl">{challenge.title}</h1>
      <p className="mt-4 text-lg leading-relaxed text-fg-muted">{challenge.objective}</p>
    </header>
  );
}
