import { useCallback, useId, useState } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router-dom';
import { LuLogOut } from 'react-icons/lu';
import BrandMark from '../components/layout/BrandMark';
import Button from '../components/ui/Button';
import useDocumentTitle from '../hooks/useDocumentTitle';
import { cn } from '../utils/format';
import { getSession, signIn, signOut } from './api';
import ChallengeDetailPage from './ChallengeDetailPage';
import ChallengesPage from './ChallengesPage';
import { AdminContext } from './context';
import PlayersPage from './PlayersPage';

const inputClasses =
  'h-12 w-full rounded-xl border-2 border-ink-600 bg-ink-950/70 px-4 text-base hover:border-fg-subtle focus:border-brand-orange focus:outline-none';

function LoginPage({ onSignedIn }) {
  useDocumentTitle('Administração');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const emailId = useId();
  const passwordId = useId();

  async function handleSubmit(event) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      onSignedIn(await signIn(email.trim(), password));
    } catch (failure) {
      setBusy(false);
      // The same message for a wrong password and for a non-admin account
      setError(
        failure.notAdmin || failure.status === 400
          ? 'E-mail ou senha inválidos.'
          : 'Não foi possível entrar agora. Tente de novo.',
      );
    }
  }

  return (
    <main className="flex min-h-[100dvh] items-center justify-center px-4 py-10">
      <form onSubmit={handleSubmit} className="panel w-full max-w-sm space-y-5 p-6 sm:p-8">
        <BrandMark />
        <h1 className="text-2xl font-bold">Acesso restrito</h1>
        <div>
          <label htmlFor={emailId} className="block font-display font-semibold">
            E-mail
          </label>
          <input
            id={emailId}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="username"
            required
            className={cn(inputClasses, 'mt-1.5')}
          />
        </div>
        <div>
          <label htmlFor={passwordId} className="block font-display font-semibold">
            Senha
          </label>
          <input
            id={passwordId}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className={cn(inputClasses, 'mt-1.5')}
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>
    </main>
  );
}

function AdminNavItem({ to, end, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cn(
          'inline-flex h-11 items-center rounded-xl px-3 font-display text-sm font-semibold transition-colors',
          isActive ? 'bg-ink-700 text-fg' : 'text-fg-muted hover:bg-ink-800 hover:text-fg',
        )
      }
    >
      {children}
    </NavLink>
  );
}

export default function AdminApp() {
  const [session, setSession] = useState(getSession);
  const onExpired = useCallback(() => setSession(null), []);

  if (!session) return <LoginPage onSignedIn={setSession} />;

  return (
    <AdminContext.Provider value={{ onExpired }}>
      <div className="flex min-h-[100dvh] flex-col">
        <header className="sticky top-0 z-30 border-b border-ink-600/50 bg-ink-900/85 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
            <div className="flex items-center gap-3">
              <Link to="/admin" className="rounded-lg" aria-label="Administração — jogadores">
                <BrandMark compact />
              </Link>
              <span className="eyebrow hidden md:inline">Administração</span>
            </div>
            <nav aria-label="Administração" className="flex items-center gap-1 sm:gap-2">
              <AdminNavItem to="/admin" end>
                Jogadores
              </AdminNavItem>
              <AdminNavItem to="/admin/fases">Fases</AdminNavItem>
              <Button
                variant="ghost"
                size="icon"
                aria-label={`Sair (${session.email})`}
                title={`Sair (${session.email})`}
                onClick={() => {
                  signOut();
                  setSession(null);
                }}
              >
                <LuLogOut className="h-5 w-5" aria-hidden="true" />
              </Button>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
          <Routes>
            <Route index element={<PlayersPage />} />
            <Route path="fases" element={<ChallengesPage />} />
            <Route path="fases/:slug" element={<ChallengeDetailPage />} />
            <Route path="*" element={<PlayersPage />} />
          </Routes>
        </main>
      </div>
    </AdminContext.Provider>
  );
}
