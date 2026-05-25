import { useEffect, useState } from 'react';

import { bootstrapPlantApp, type BootstrapResult } from '@/bootstrap';
import { usePlantSocket } from '@/hooks/usePlantSocket';
import { useWakeLock } from '@/hooks/useWakeLock';
import { ActivePhaseScreen } from '@/screens/ActivePhaseScreen';
import { CompletePhaseScreen } from '@/screens/CompletePhaseScreen';
import { LoginScreen } from '@/screens/LoginScreen';
import { usePhaseStore } from '@/stores/phase.store';
import { useSessionStore } from '@/stores/session.store';

type OperatorScreen = 'active' | 'complete';

export function App() {
  const [boot, setBoot] = useState<BootstrapResult | null>(null);
  const [screen, setScreen] = useState<OperatorScreen>('active');
  const isAuthenticated = useSessionStore((s) => s.isAuthenticated);

  useWakeLock();
  usePlantSocket();

  useEffect(() => {
    void bootstrapPlantApp().then(setBoot);
  }, []);

  const handleLoginSuccess = () => {
    usePhaseStore.getState().hydrateDemoPhase();
    setScreen('active');
  };

  const handleCompleteSuccess = () => {
    usePhaseStore.getState().hydrateDemoPhase();
    setScreen('active');
  };

  if (!boot) {
    return (
      <div className="screen-operator app-shell">
        <p className="app-shell__meta">Iniciando Plant KDS…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={handleLoginSuccess} />;
  }

  if (screen === 'complete') {
    return (
      <CompletePhaseScreen
        onBack={() => setScreen('active')}
        onCompleteSuccess={handleCompleteSuccess}
      />
    );
  }

  return <ActivePhaseScreen onCompletePhase={() => setScreen('complete')} />;
}
