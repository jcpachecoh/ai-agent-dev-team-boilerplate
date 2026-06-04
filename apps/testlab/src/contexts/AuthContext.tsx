import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authService } from '../services/auth.service';
import { jwtDecode } from 'jwt-decode';

interface AuthUser {
  sub: string;
  email: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, name: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = authService.getAccessToken();
    if (token) {
      try {
        setUser(jwtDecode<AuthUser>(token));
      } catch {
        authService.clearTokens();
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await authService.login(email, password);
    setUser(jwtDecode<AuthUser>(tokens.accessToken));
  }, []);

  const signup = useCallback(async (email: string, name: string, password: string) => {
    const tokens = await authService.signup(email, name, password);
    setUser(jwtDecode<AuthUser>(tokens.accessToken));
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
