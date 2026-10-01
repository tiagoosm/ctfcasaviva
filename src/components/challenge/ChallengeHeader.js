export function challengeLabel(challenge) {
  return challenge.code === 'FINAL' ? 'Desafio final' : `Desafio ${challenge.code}`;
}

export default function ChallengeHeader({ challenge }) {
  return (
    <header className="max-w-3xl">
      <p className="eyebrow">{challengeLabel(challenge)}</p>
      <h1 className="mt-2 text-3xl font-bold sm:text-4xl">{challenge.title}</h1>
      <p className="mt-3 text-lg leading-relaxed text-fg-muted">{challenge.objective}</p>
    </header>
  );
}
