import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Loader2 } from 'lucide-react';

// Lazy-loaded routes
const Login = lazy(() => import('./pages/Login'));
const Landing = lazy(() => import('./pages/Landing'));
const DashboardLayout = lazy(() => import('./components/DashboardLayout'));
const DevicesList = lazy(() => import('./pages/DevicesList'));
const DeviceControlPanel = lazy(() => import('./pages/DeviceControlPanel'));

// React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 5000, retry: 1 }
  }
});

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#05070a]">
      <div className="flex flex-col items-center gap-4">
        <svg className="w-10 h-10 text-[#00bfff] drop-shadow-[0_0_12px_rgba(0,191,255,0.6)]" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="8"  r="3.5" fill="#00BFFF" opacity="0.9"/>
          <circle cx="20" cy="20" r="2.5" fill="#00BFFF" opacity="0.8"/>
          <circle cx="44" cy="20" r="2.5" fill="#00BFFF" opacity="0.8"/>
          <circle cx="18" cy="34" r="2"   fill="#00BFFF" opacity="0.7"/>
          <circle cx="32" cy="34" r="2"   fill="#00BFFF" opacity="0.7"/>
          <circle cx="46" cy="34" r="2"   fill="#00BFFF" opacity="0.7"/>
          <circle cx="22" cy="50" r="3"   fill="#00BFFF" opacity="0.85"/>
          <circle cx="42" cy="50" r="3"   fill="#00BFFF" opacity="0.85"/>
        </svg>
        <Loader2 className="w-5 h-5 text-[#00bfff] animate-spin" />
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DevicesList />} />
          <Route path="device/:id" element={<DeviceControlPanel />} />
        </Route>
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
