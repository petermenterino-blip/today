import { Component, ErrorInfo, ReactNode } from 'react';

type EBProps = { children: ReactNode; fallback?: ReactNode };
type EBState = { hasError: boolean; error: Error | null };

export default class ErrorBoundary extends Component<EBProps, EBState> {
  declare props: EBProps;
  declare state: EBState;

  constructor(props: EBProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): EBState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    const { hasError } = this.state;
    const { children, fallback } = this.props;
    if (hasError) {
      if (fallback) return fallback;
      return (
        <div className="min-h-[60vh] flex items-center justify-center p-8">
          <div className="bg-white p-12 rounded-[48px] shadow-2xl shadow-black/5 border border-slate-100 text-center max-w-md">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-8">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-4">Something went wrong</h2>
            <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">
              An unexpected error occurred. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 bg-black text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-black/10"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }
    return children;
  }
}