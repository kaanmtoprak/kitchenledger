'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/features/auth/api/auth.api';
import type {
  LoginPayload,
  Membership,
  RegisterPayload,
  User,
} from '@/features/auth/types/auth.types';
import { setOnUnauthorized } from '@/lib/api/api-client';
import {
  clearSelectedOrganizationId,
  getSelectedOrganizationId,
  setSelectedOrganizationId,
} from './organization-storage';
import { clearAccessToken, getAccessToken, setAccessToken } from './token-storage';

type AuthContextValue = {
  user: User | null;
  memberships: Membership[];
  selectedOrganizationId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  loadMe: () => Promise<void>;
  selectOrganization: (organizationId: string) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function resolveOrganizationId(memberships: Membership[]): string | null {
  const stored = getSelectedOrganizationId();
  if (stored && memberships.some((membership) => membership.organizationId === stored)) {
    return stored;
  }
  return memberships[0]?.organizationId ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedOrganizationId, setSelectedOrganizationIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearAuthState = useCallback(() => {
    clearAccessToken();
    clearSelectedOrganizationId();
    setUser(null);
    setMemberships([]);
    setSelectedOrganizationIdState(null);
  }, []);

  const applyMeResponse = useCallback((me: { user: User; memberships: Membership[] }) => {
    setUser(me.user);
    setMemberships(me.memberships);

    const organizationId = resolveOrganizationId(me.memberships);
    if (organizationId) {
      setSelectedOrganizationId(organizationId);
      setSelectedOrganizationIdState(organizationId);
    } else {
      clearSelectedOrganizationId();
      setSelectedOrganizationIdState(null);
    }
  }, []);

  const loadMe = useCallback(async () => {
    const me = await authApi.me();
    applyMeResponse(me);
  }, [applyMeResponse]);

  const refreshSession = useCallback(async () => {
    try {
      const response = await authApi.refresh();
      setAccessToken(response.accessToken);
      return true;
    } catch {
      return false;
    }
  }, []);

  const login = useCallback(
    async (payload: LoginPayload) => {
      const response = await authApi.login(payload);
      setAccessToken(response.accessToken);
      clearSelectedOrganizationId();
      setSelectedOrganizationIdState(null);
      await loadMe();
      router.replace('/dashboard');
    },
    [loadMe, router],
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const response = await authApi.register(payload);
      setAccessToken(response.accessToken);
      setSelectedOrganizationId(response.organization.id);
      setSelectedOrganizationIdState(response.organization.id);
      await loadMe();
      router.replace('/dashboard');
    },
    [loadMe, router],
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
    } finally {
      clearAuthState();
      router.replace('/login');
    }
  }, [clearAuthState, router]);

  const selectOrganization = useCallback((organizationId: string) => {
    setSelectedOrganizationId(organizationId);
    setSelectedOrganizationIdState(organizationId);
  }, []);

  useEffect(() => {
    setOnUnauthorized(() => {
      clearAuthState();
    });

    return () => setOnUnauthorized(null);
  }, [clearAuthState]);

  useEffect(() => {
    const initialize = async () => {
      try {
        let token = getAccessToken();

        if (!token) {
          const refreshed = await refreshSession();
          if (refreshed) {
            token = getAccessToken();
          }
        }

        if (token) {
          await loadMe();
        }
      } catch {
        clearAuthState();
      } finally {
        setIsLoading(false);
      }
    };

    void initialize();
  }, [clearAuthState, loadMe, refreshSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      memberships,
      selectedOrganizationId,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshSession,
      loadMe,
      selectOrganization,
    }),
    [
      user,
      memberships,
      selectedOrganizationId,
      isLoading,
      login,
      register,
      logout,
      refreshSession,
      loadMe,
      selectOrganization,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
}
