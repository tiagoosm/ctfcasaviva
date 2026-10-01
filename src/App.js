import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import ChallengePage from './pages/ChallengePage';
import CompletionPage from './pages/CompletionPage';
import LandingPage from './pages/LandingPage';
import MissionPage from './pages/MissionPage';
import NotFoundPage from './pages/NotFoundPage';
import RankingPage from './pages/RankingPage';

// The admin area is a separate experience, loaded only when its route is opened
const AdminApp = lazy(() => import('./admin/AdminApp'));

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="missao" element={<MissionPage />} />
        <Route path="missao/:slug" element={<ChallengePage />} />
        <Route path="conclusao" element={<CompletionPage />} />
        <Route path="ranking" element={<RankingPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route
        path="admin/*"
        element={
          <Suspense fallback={null}>
            <AdminApp />
          </Suspense>
        }
      />
    </Routes>
  );
}
