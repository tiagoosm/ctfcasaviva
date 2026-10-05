import { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { challenges, getChallengeBySlug, getNextChallenge } from '../challenges';
import ChallengeHeader, { challengeLabel } from '../components/challenge/ChallengeHeader';
import FlagForm from '../components/challenge/FlagForm';
import HintPanel from '../components/challenge/HintPanel';
import MissionTimer from '../components/challenge/MissionTimer';
import ProgressTrack from '../components/challenge/ProgressTrack';
import SuccessPanel from '../components/challenge/SuccessPanel';
import { useGame } from '../game/GameProvider';
import {
  getChallengeScore,
  getCurrentChallenge,
  getProgress,
  getStatus,
  isRegistered,
} from '../game/selectors';
import useDocumentTitle from '../hooks/useDocumentTitle';
import NotFoundPage from './NotFoundPage';

const HEARTBEAT_INTERVAL = 30000;

export default function ChallengePage() {
  const { slug } = useParams();
  const challenge = getChallengeBySlug(slug);
  const { state, submitAnswer, revealHint, enterChallenge, leaveChallenge, keepAlive } = useGame();
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

  // Stages cannot be skipped by typing the URL: we go back to the map with the reason
  if (status === 'locked') {
    const current = getCurrentChallenge(state) ?? challenges[0];
    return (
      <Navigate
        to="/missao"
        replace
        state={{
          notice: {
            title: `${challenge.title} ainda está bloqueado`,
            message: `Conclua primeiro "${current.title}" para liberar as próximas etapas.`,
          },
        }}
      />
    );
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
            nextChallenge={getNextChallenge(challenge.id)}
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
