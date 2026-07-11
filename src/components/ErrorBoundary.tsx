import React from 'react';

interface State {
  hasError: boolean;
  error: Error | null;
}

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[var(--color-background)]">
          <div className="glass-card p-10 max-w-md w-full text-center">
            <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something went wrong</h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={this.handleReset}
              className="btn-primary w-full justify-center"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary w-full justify-center mt-3"
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/** Inline error card for use inside pages */
export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert-error rounded-xl">
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <div className="flex-1">
        <p className="font-medium text-red-300">Error</p>
        <p className="mt-0.5 text-red-400/80 text-xs">{message}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-3 text-xs font-medium text-red-300 hover:text-white underline underline-offset-2 transition-colors"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}

/** Full-page loading spinner */
export function PageLoader({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-8 h-8 rounded-full border-2 border-[#00bfff]/20 border-t-[#00bfff] animate-spin" />
      <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
    </div>
  );
}

/** Skeleton card placeholder */
export function SkeletonCard() {
  return (
    <div className="surface-card p-6 space-y-4">
      <div className="flex items-center gap-3">
        <div className="skeleton w-10 h-10 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-32 rounded" />
          <div className="skeleton h-3 w-20 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-12 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/** Parse Firebase error codes to friendly messages */
export function parseFirebaseError(err: unknown): string {
  if (!err || typeof err !== 'object') return 'An unexpected error occurred.';
  const code = (err as { code?: string }).code || '';
  const message = (err as { message?: string }).message || '';

  const map: Record<string, string> = {
    'auth/user-not-found':        'No account found with that email address.',
    'auth/wrong-password':        'Incorrect password. Please try again.',
    'auth/invalid-email':         'Please enter a valid email address.',
    'auth/invalid-credential':    'Invalid email or password.',
    'auth/too-many-requests':     'Too many failed attempts. Please wait a moment.',
    'auth/network-request-failed':'Network error. Check your internet connection.',
    'auth/email-already-in-use':  'An account with this email already exists.',
    'auth/weak-password':         'Password must be at least 6 characters.',
    'auth/user-disabled':         'This account has been disabled.',
    'permission-denied':          'Permission denied. Please sign in again.',
    'unavailable':                'Service temporarily unavailable. Try again shortly.',
    'deadline-exceeded':          'Request timed out. Check your connection.',
    'not-found':                  'The requested resource was not found.',
  };

  return map[code] || message || 'An unexpected error occurred.';
}
