import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { bootstrapPlantApp, type BootstrapResult } from '@/bootstrap';
import { useWakeLock } from '@/hooks/useWakeLock';
import { logoutOperator } from '@/services/auth.service';
import { ActivePhaseScreen } from '@/screens/ActivePhaseScreen';
import { CompletePhaseScreen } from '@/screens/CompletePhaseScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { useSessionStore } from '@/stores/session.store';

export function App() {
  const [boot, setBoot] = useState<BootstrapResult | null>(null);
  const [view, setView] = useState<'active' | 'complete'>('active');
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const logout = useSessionStore((s) => s.logout);
  const queryClient = useQueryClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useWakeLock();

  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await logoutOperator();
    } finally {
      void queryClient.invalidateQueries({ queryKey: ['mes-auth', 'me'] });
      void queryClient.invalidateQueries({ queryKey: ['plant-session'] });
      setView('active');
      logout();
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout, queryClient]);

  useEffect(() => {
    void bootstrapPlantApp().then(setBoot);
  }, []);

  if (!boot) {
    return (
      <div className="screen-operator app-shell">
        <p className="app-shell__meta">Iniciando Plant KDS…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  if (view === 'complete') {
    return (
      <CompletePhaseScreen
        onBack={() => setView('active')}
        onCompleteSuccess={() => setView('active')}
        onLogout={() => void handleLogout()}
        isLoggingOut={isLoggingOut}
      />
    );
  }

  return (
    <ActivePhaseScreen
      onLogout={() => void handleLogout()}
      isLoggingOut={isLoggingOut}
      onCompletePhase={() => setView('complete')}
    />
  );
}
