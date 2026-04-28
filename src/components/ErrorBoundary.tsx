import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-rose-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Something went wrong</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm mb-8 max-w-md">
            We encountered an unexpected error while rendering this section. Our team has been notified.
          </p>
          <div className="flex items-center gap-4">
            <Button 
              onClick={() => window.location.reload()} 
              className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 h-12 font-black text-[11px] uppercase tracking-widest gap-2 shadow-lg shadow-indigo-600/20"
            >
              <RefreshCw className="w-4 h-4" /> Reload Page
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/'} 
              className="rounded-xl px-6 h-12 font-black text-[11px] uppercase tracking-widest gap-2 border-slate-200 dark:border-slate-800"
            >
              <Home className="w-4 h-4" /> Go Home
            </Button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-950 rounded-xl text-left w-full max-w-2xl overflow-auto border border-slate-100 dark:border-slate-800">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Error Details</p>
              <code className="text-xs text-rose-500 font-bold whitespace-pre-wrap">{this.state.error.toString()}</code>
            </div>
          )}
        </div>
      );
    }

    return (this as any).props.children;
  }
}

export default ErrorBoundary;
