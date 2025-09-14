import { useEffect, useState } from 'preact/hooks';


type AuthState = { loggedIn: false } | { loggedIn: true; accountId: string };

export function useFastIntearAuth(): {
  auth: AuthState;
  login: () => Promise<void>;
  logout: () => void;
} {
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false });

  useEffect(() => {
    const status = near.authStatus();
    console.log('[FastINTEAR] Auth status on mount:', status);

    if (status === 'SignedIn') {
      const accountId = near.accountId();
      console.log('[FastINTEAR] Detected signed-in account:', accountId);
      if (accountId) {
        setAuth({ loggedIn: true, accountId });
      }
    }
  }, []);

  const login = async () => {
    console.log('[FastINTEAR] Initiating login...');
    await near.requestSignIn();
    const accountId = near.accountId();
    console.log('[FastINTEAR] Login complete. Account ID:', accountId);
    if (accountId) {
      setAuth({ loggedIn: true, accountId });
    }
  };

  const logout = () => {
    console.log('[FastINTEAR] Logging out...');
    near.signOut();
    setAuth({ loggedIn: false });
    console.log('[FastINTEAR] Logged out.');
  };

  return { auth, login, logout };
}