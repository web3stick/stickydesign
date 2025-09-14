import * as near from 'fastintear';
import { useEffect, useState } from 'preact/hooks';


type AuthState = { loggedIn: false } | { loggedIn: true; accountId: string };

export function useFastIntearAuth(): {
  auth: AuthState;
  login: () => Promise<void>;
  logout: () => void;
} {
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false });

  useEffect(() => {
    const checkAuthStatus = () => {
      const status = near.authStatus();
      console.log('[FastINTEAR] Auth status check:', status);

      if (status === 'SignedIn') {
        const accountId = near.accountId();
        console.log('[FastINTEAR] Detected signed-in account:', accountId);
        if (accountId) {
          setAuth({ loggedIn: true, accountId });
        }
      } else {
        setAuth({ loggedIn: false });
      }
    };

    // Check auth status on mount
    checkAuthStatus();

    // Listen for wallet events (if available)
    // This is a simplified approach - in a real app you might listen to specific wallet events
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkAuthStatus();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Also check when the window regains focus
    const handleFocus = () => {
      checkAuthStatus();
    };
    
    window.addEventListener('focus', handleFocus);

    // Clean up listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
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