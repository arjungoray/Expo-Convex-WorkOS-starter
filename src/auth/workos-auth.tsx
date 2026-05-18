import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import * as WebBrowser from 'expo-web-browser';
import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { publicEnv, requirePublicEnv } from '@/lib/env';

WebBrowser.maybeCompleteAuthSession();

type WorkOSUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
};

type WorkOSSession = {
  accessToken: string;
  refreshToken: string;
  organizationId?: string;
  user?: WorkOSUser;
};

type WorkOSAuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: WorkOSUser | null;
  organizationId: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  fetchAccessToken: (args?: { forceRefreshToken?: boolean }) => Promise<string | null>;
};

const ACCESS_TOKEN_KEY = 'workos.accessToken';
const REFRESH_TOKEN_KEY = 'workos.refreshToken';
const ORG_ID_KEY = 'workos.organizationId';
const USER_KEY = 'workos.user';

const WorkOSAuthContext = createContext<WorkOSAuthContextValue | null>(null);

async function saveSession(session: WorkOSSession) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, session.accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, session.refreshToken);

  if (session.organizationId) {
    await SecureStore.setItemAsync(ORG_ID_KEY, session.organizationId);
  } else {
    await SecureStore.deleteItemAsync(ORG_ID_KEY);
  }

  if (session.user) {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
  }
}

async function clearSession() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(ORG_ID_KEY),
    SecureStore.deleteItemAsync(USER_KEY),
  ]);
}

async function postToAuthRoute(path: string, body: Record<string, unknown>) {
  const response = await fetch(`${publicEnv.convexHttpUrl}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `WorkOS auth request failed with ${response.status}`);
  }

  return (await response.json()) as WorkOSSession;
}

function getAuthorizationExtraParams() {
  const extraParams: Record<string, string> = {};

  if (publicEnv.workosProvider) {
    extraParams.provider = publicEnv.workosProvider;
  }
  if (publicEnv.workosConnectionId) {
    extraParams.connection_id = publicEnv.workosConnectionId;
    delete extraParams.provider;
  }
  if (publicEnv.workosOrganizationId) {
    extraParams.organization_id = publicEnv.workosOrganizationId;
  }

  return extraParams;
}

export function WorkOSAuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<WorkOSSession | null>(null);
  const sessionRef = useRef<WorkOSSession | null>(null);
  const refreshPromiseRef = useRef<Promise<WorkOSSession> | null>(null);

  const setCurrentSession = useCallback((nextSession: WorkOSSession | null) => {
    sessionRef.current = nextSession;
    setSession(nextSession);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const [accessToken, refreshToken, organizationId, userJson] = await Promise.all([
          SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
          SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
          SecureStore.getItemAsync(ORG_ID_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);

        if (isMounted && accessToken && refreshToken) {
          setCurrentSession({
            accessToken,
            refreshToken,
            organizationId: organizationId ?? undefined,
            user: userJson ? JSON.parse(userJson) : undefined,
          });
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, [setCurrentSession]);

  const persistAndSetSession = useCallback(
    async (nextSession: WorkOSSession) => {
      await saveSession(nextSession);
      setCurrentSession(nextSession);
    },
    [setCurrentSession],
  );

  const signIn = useCallback(async () => {
    const redirectUri = publicEnv.workosRedirectUri;
    console.log('WorkOS redirect URI', redirectUri);

    const request = new AuthSession.AuthRequest({
      clientId: requirePublicEnv(
        'EXPO_PUBLIC_WORKOS_CLIENT_ID',
        publicEnv.workosClientId,
      ),
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: getAuthorizationExtraParams(),
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://api.workos.com/user_management/authorize',
    });

    if (result.type !== 'success') {
      if (result.type === 'error') {
        throw new Error(result.error?.message ?? 'WorkOS authorization failed');
      }
      return;
    }

    const code = result.params.code;
    if (!code || !request.codeVerifier) {
      throw new Error('WorkOS authorization did not return a code and PKCE verifier');
    }

    const nextSession = await postToAuthRoute('/auth/workos/exchange', {
      code,
      codeVerifier: request.codeVerifier,
    });
    await persistAndSetSession(nextSession);
  }, [persistAndSetSession]);

  const signOut = useCallback(async () => {
    refreshPromiseRef.current = null;
    await clearSession();
    setCurrentSession(null);
  }, [setCurrentSession]);

  const fetchAccessToken = useCallback(
    async ({ forceRefreshToken = false }: { forceRefreshToken?: boolean } = {}) => {
      const currentSession = sessionRef.current;

      if (!currentSession) {
        return null;
      }

      if (!forceRefreshToken) {
        return currentSession.accessToken;
      }

      refreshPromiseRef.current ??= postToAuthRoute('/auth/workos/refresh', {
        refreshToken: currentSession.refreshToken,
        organizationId: currentSession.organizationId,
      }).finally(() => {
        refreshPromiseRef.current = null;
      });

      const nextSession = await refreshPromiseRef.current;
      await persistAndSetSession(nextSession);
      return nextSession.accessToken;
    },
    [persistAndSetSession],
  );

  const value = useMemo<WorkOSAuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: Boolean(session?.accessToken),
      user: session?.user ?? null,
      organizationId: session?.organizationId ?? null,
      signIn,
      signOut,
      fetchAccessToken,
    }),
    [fetchAccessToken, isLoading, session, signIn, signOut],
  );

  return <WorkOSAuthContext.Provider value={value}>{children}</WorkOSAuthContext.Provider>;
}

export function useWorkOSAuth() {
  const context = useContext(WorkOSAuthContext);
  if (!context) {
    throw new Error('useWorkOSAuth must be used inside WorkOSAuthProvider');
  }
  return context;
}
