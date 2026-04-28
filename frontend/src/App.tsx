import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { HomePage } from '@/pages/home-page';
import { DashboardPage } from '@/pages/dashboard-page';
import { VideoPage } from '@/pages/video-page';
import { SearchPage } from '@/pages/search-page';
import { CollectionsPage } from '@/pages/collections-page';
import { HistoryPage } from '@/pages/history-page';
import { SettingsPage } from '@/pages/settings-page';

function ShellRoute({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route
        path="/dashboard"
        element={
          <ShellRoute>
            <DashboardPage />
          </ShellRoute>
        }
      />
      <Route
        path="/video/:videoId"
        element={
          <ShellRoute>
            <VideoPage />
          </ShellRoute>
        }
      />
      <Route
        path="/search"
        element={
          <ShellRoute>
            <SearchPage />
          </ShellRoute>
        }
      />
      <Route
        path="/collections"
        element={
          <ShellRoute>
            <CollectionsPage />
          </ShellRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ShellRoute>
            <HistoryPage />
          </ShellRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ShellRoute>
            <SettingsPage />
          </ShellRoute>
        }
      />
      <Route path="*" element={<Navigate to={isHome ? '/' : '/dashboard'} replace />} />
    </Routes>
  );
}
