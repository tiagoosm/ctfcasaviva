import { useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import ErrorBoundary from '../ErrorBoundary';
import Footer from './Footer';
import Header from './Header';

export default function AppLayout() {
  const { pathname } = useLocation();
  const mainRef = useRef(null);
  const isFirstRender = useRef(true);

  // Em uma SPA o navegador não reposiciona o foco ao trocar de página:
  // levamos o foco ao conteúdo para teclado e leitores de tela acompanharem.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-lg bg-brand-orange px-4 py-3 font-semibold text-ink-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" ref={mainRef} tabIndex={-1} className="flex-1 outline-none">
        <ErrorBoundary resetKey={pathname}>
          <div key={pathname} className="animate-fade-up">
            <Outlet />
          </div>
        </ErrorBoundary>
      </main>
      <Footer />
    </div>
  );
}
