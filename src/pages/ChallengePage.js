import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { LuLoaderCircle } from 'react-icons/lu';
import { getChallengeBySlug, tiers } from '../challenges';
import ChallengeHeader, { challengeLabel } from '../components/challenge/ChallengeHeader';
import FlagForm from '../components/challenge/FlagForm';
import HintPanel from '../components/challenge/HintPanel';
import MissionTimer from '../components/challenge/MissionTimer';
import ProgressTrack from '../components/challenge/ProgressTrack';
import SuccessPanel from '../components/challenge/SuccessPanel';
import { useGame } from '../game/GameProvider';
import {
  getChallengeScore,
  getMissingRequirements,
  getProgress,
  getStatus,
  getSummary,
  isRegistered,
} from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import NotFoundPage from './NotFoundPage';

const HEARTBEAT_INTERVAL = 30000;

// Why a locked challenge cannot be opened yet, in a few words
function lockedNotice(state, challenge) {
  const [opening, investigations] = tiers;
  const missing = getMissingRequirements(state, challenge);
  const message = missing.some((item) => opening.includes(item))
    ? `Conclua primeiro "${opening[0].title}" para liberar as investigações.`
    : `Conclua as ${investigations.length} investigações para liberar ${challenge.title.toLowerCase()}.`;
  return { title: `Fase bloqueada: ${challenge.title}`, message };
}

// Where to go after solving: straight to the final stage once it opens,
// otherwise back to the map to pick the next investigation
function nextStep(state) {
  const finalStage = tiers[tiers.length - 1][0];
  return getStatus(state, finalStage) === 'available' ? finalStage : null;
}

export default function ChallengePage() {
  const { slug } = useParams();
  const challenge = getChallengeBySlug(slug);
  const { state, synced, submitAnswer, revealHint, enterChallenge, leaveChallenge, keepAlive } = useGame();
  const [justSolved, setJustSolved] = useState(false);

  useDocumentTitle(challenge ? `${challengeLabel(challenge)}: ${challenge.title}` : 'Página não encontrada');

  const registered = isRegistered(state);
  const status = challenge ? getStatus(state, challenge) : null;

  // Time only counts while an open challenge is on screen: its clock starts (or
  // resumes) here and pauses when the player leaves this page
  useEffect(() => {
    if (!challenge || !registered || status !== 'available') return undefined;
    enterChallenge(challenge);

    // Coming back to a page the browser kept in memory (back/forward)
    const onPageShow = (event) => event.persisted && enterChallenge(challenge);
    window.addEventListener('pageshow', onPageShow);
    // Lets the server know the player is still here, so a tab that is closed
    // without warning stops counting time
    const heartbeat = setInterval(() => keepAlive(challenge), HEARTBEAT_INTERVAL);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      clearInterval(heartbeat);
      leaveChallenge(challenge);
    };
  }, [challenge, registered, status, enterChallenge, leaveChallenge, keepAlive]);

  if (!challenge) return <NotFoundPage />;

  // The mission cannot be played before the participant gives name and class
  if (!registered) return <Navigate to="/" replace />;

  // Stages cannot be skipped by typing the URL: we go back to the map with the
  // reason. The server refuses them as well.
  if (status === 'locked') {
    // This browser's copy may be behind (progress made on another device):
    // decide once the server has answered
    if (!synced) {
      return (
        <p className="flex items-center justify-center gap-2 px-4 py-16 text-fg-muted">
          <LuLoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" /> Carregando…
        </p>
      );
    }
    return <Navigate to="/missao" replace state={{ notice: lockedNotice(state, challenge) }} />;
  }

  const solved = status === 'solved';
  const progress = getProgress(state, challenge.id);
  const { Stage } = challenge;

  async function handleSubmit(answer) {
    const result = await submitAnswer(challenge, answer);
    if (result?.status === 'correct') setJustSolved(true);
    return result;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-6 pt-[4.5rem] sm:px-6 sm:pb-10">
      <MissionTimer />
      <ProgressTrack currentId={challenge.id} />

      <div className="mt-8 sm:mt-10">
        <ChallengeHeader challenge={challenge} />
      </div>

      {solved && (
        <div className="mt-8">
          <SuccessPanel
            challenge={challenge}
            earned={getChallengeScore(state, challenge)}
            nextChallenge={nextStep(state)}
            complete={getSummary(state).isComplete}
            justSolved={justSolved}
          />
        </div>
      )}

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <Stage challenge={challenge} solved={solved} onSubmitAnswer={handleSubmit} />
        </div>

        <aside className="space-y-6" aria-label="Resposta e dica">
          {challenge.answerMode === 'flag' && !solved && (
            <section className="panel p-5">
              <FlagForm onSubmit={handleSubmit} />
            </section>
          )}

          <HintPanel
            challenge={challenge}
            revealed={progress.hintUsed}
            solved={solved}
            onReveal={() => revealHint(challenge)}
          />
        </aside>
      </div>
    </div>
  );
}
