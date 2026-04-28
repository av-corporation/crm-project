import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

type RouteGuardMode = 'protected' | 'public-only';

interface RouteGuardProps {
  mode: RouteGuardMode;
  children: React.ReactNode;
  redirectTo?: string;
}

const AuthLoader = ({ label }: { label: string }) => (
  <div className="flex flex-col items-center justify-center h-screen bg-[#0B0F19] text-white gap-6">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center text-indigo-500 font-black text-[10px]">CRM</div>
    </div>
    <div className="font-black uppercase tracking-[0.4em] text-sm text-indigo-300 animate-pulse text-center">{label}</div>
  </div>
);

export default function RouteGuard({ mode, children, redirectTo }: RouteGuardProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return <AuthLoader label={mode === 'protected' ? 'Synchronizing Matrix' : 'Verifying Session'} />;
  }

  if (mode === 'protected' && !user) {
    return <Navigate to={redirectTo || '/login'} replace />;
  }

  if (mode === 'public-only' && user) {
    return <Navigate to={redirectTo || '/dashboard'} replace />;
  }

  return <>{children}</>;
}
