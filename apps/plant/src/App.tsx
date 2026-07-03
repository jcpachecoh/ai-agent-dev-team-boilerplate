import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';

import { bootstrapPlantApp, type BootstrapResult } from '@/bootstrap';
import { useWakeLock } from '@/hooks/useWakeLock';
import { logoutOperator } from '@/services/auth.service';
import { ActivePhaseScreen } from '@/screens/ActivePhaseScreen';
import { CompletePhaseScreen } from '@/screens/CompletePhaseScreen';
import { LocationSelectScreen } from '@/screens/LocationSelectScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { NoLocationScreen } from '@/screens/NoLocationScreen';
import { useSessionStore } from '@/stores/session.store';

export function App() {
  const [boot, setBoot] = useState<BootstrapResult | null>(null);
  const [view, setView] = useState<'active' | 'complete'>('active');
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);
  const operator = useSessionStore((s) => s.operator);
  const canOperate = useSessionStore((s) => s.canOperate);
  const getActiveLocation = useSessionStore((s) => s.getActiveLocation);
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
      setShowLocationPicker(false);
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

  if (!operator || operator.assignedLocations.length === 0) {
    return <NoLocationScreen onLogout={() => void handleLogout()} isLoggingOut={isLoggingOut} />;
  }

  const needsLocationSelection =
    operator.requiresLocationSelection ||
    (!operator.locationId && operator.assignedLocations.length > 1);

  if (needsLocationSelection || showLocationPicker) {
    return (
      <LocationSelectScreen
        locations={operator.assignedLocations}
        mode={showLocationPicker ? 'change' : 'initial'}
        onSelected={() => setShowLocationPicker(false)}
        onCancel={
          showLocationPicker ? () => setShowLocationPicker(false) : () => void handleLogout()
        }
      />
    );
  }

  if (!canOperate()) {
    return <NoLocationScreen onLogout={() => void handleLogout()} isLoggingOut={isLoggingOut} />;
  }

  const activeLocation = getActiveLocation();

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
      onChangeLocation={() => setShowLocationPicker(true)}
      activeLocationName={activeLocation?.name}
    />
  );
}
