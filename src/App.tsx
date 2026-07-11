import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

// Lazy-loaded pages
const Login             = lazy(() => import('./pages/Login'));
const Landing           = lazy(() => import('./pages/Landing'));
const DashboardLayout   = lazy(() => import('./components/DashboardLayout'));
const DevicesList       = lazy(() => import('./pages/DevicesList'));
const DeviceControlPanel = lazy(() => import('./pages/DeviceControlPanel'));

// React Query client — production config
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:    30_000,
      retry:        2,
      retryDelay:   (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

/* ── Loading screen ── */
function PageLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-5 bg-[#05070a]">
      <div className="w-16 h-16 rounded-2xl overflow-hidden border border-[#00bfff]/20 animate-float">
        <img src="/logo.png" alt="Orion" className="w-full h-full object-contain" />
      </div>
      <div className="w-6 h-6 rounded-full border-2 border-[#00bfff]/20 border-t-[#00bfff] animate-spin" />
    </div>
  );
}

/* ── Auth guard ── */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)   return <Navigate to="/login" replace />;
  return <>{children}</>;
}

/* ── Routes ── */
function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/"      element={<Landing />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <ErrorBoundary>
                <DashboardLayout />
              </ErrorBoundary>
            </ProtectedRoute>
          }
        >
          <Route index                  element={<ErrorBoundary><DevicesList /></ErrorBoundary>} />
          <Route path="device/:id"      element={<ErrorBoundary><DeviceControlPanel /></ErrorBoundary>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
