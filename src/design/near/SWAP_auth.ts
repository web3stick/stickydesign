import * as near from 'fastintear';
import { useEffect, useState } from 'preact/hooks';

type AuthState = { loggedIn: false } | { loggedIn: true; accountId: string };

let globalAuthState: AuthState = { loggedIn: false };
let globalSetAuth: ((auth: AuthState) => void) | null = null;

export function useSwapAuth(): {
  auth: AuthState;
  login: () => Promise<void>;
  logout: () => void;
} {
  const [auth, setAuth] = useState<AuthState>(globalAuthState);
  
  console.log('[SWAP_AUTH] Hook render - Auth state:', auth);

  // Keep global state in sync
  useEffect(() => {
    globalAuthState = auth;
    globalSetAuth = setAuth;
  }, [auth]);

  useEffect(() => {
    // Check auth status on mount
    const status = near.authStatus();
    console.log('[SWAP_AUTH] Initial auth status check:', status);

    if (status === 'SignedIn') {
      const accountId = near.accountId();
      console.log('[SWAP_AUTH] Detected signed-in account:', accountId);
      if (accountId) {
        setAuth({ loggedIn: true, accountId });
      }
    } else {
      setAuth({ loggedIn: false });
    }
  }, []);

  const login = async () => {
    console.log('[SWAP_AUTH] Initiating login...');
    await near.requestSignIn();
    const accountId = near.accountId();
    console.log('[SWAP_AUTH] Login complete. Account ID:', accountId);
    if (accountId) {
      console.log('[SWAP_AUTH] Setting auth state to logged in');
      setAuth({ loggedIn: true, accountId });
      console.log('[SWAP_AUTH] Auth state set');
    }
  };

  const logout = () => {
    console.log('[SWAP_AUTH] Logging out...');
    near.signOut();
    
    // Immediately update the state
    setAuth({ loggedIn: false });
    
    console.log('[SWAP_AUTH] Logged out.');
  };

  return { auth, login, logout };
}