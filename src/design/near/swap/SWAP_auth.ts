import * as near from 'fastintear';
import { useEffect, useState } from 'preact/hooks';
import { useSwapStore } from './swapStore';

type AuthState = { loggedIn: false } | { loggedIn: true; accountId: string };

export function useSwapAuth(): {
  auth: AuthState;
  login: () => Promise<void>;
  logout: () => void;
} {
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false });
  const setAccountId = useSwapStore((state) => state.setAccountId);
  
  console.log('[SWAP_AUTH] Hook initialized with auth state:', auth);

  // Check auth status on component mount
  useEffect(() => {
    console.log('[SWAP_AUTH] Checking initial auth status...');
    const status = near.authStatus();
    console.log('[SWAP_AUTH] Initial auth status check:', status);

    if (status === 'SignedIn') {
      const accountId = near.accountId();
      console.log('[SWAP_AUTH] Detected signed-in account:', accountId);
      if (accountId) {
        setAuth({ loggedIn: true, accountId });
        setAccountId(accountId); // Update the store
      }
    } else {
      setAuth({ loggedIn: false });
      setAccountId(null); // Update the store
    }
  }, []);

  const login = async () => {
    console.log('[SWAP_AUTH] Initiating login...');
    await near.requestSignIn();
    
    // Add a small delay to ensure internal state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const accountId = near.accountId();
    console.log('[SWAP_AUTH] Login complete. Account ID:', accountId);
    if (accountId) {
      setAuth({ loggedIn: true, accountId });
      setAccountId(accountId); // Update the store
    }
  };

  const logout = () => {
    console.log('[SWAP_AUTH] Logging out...');
    near.signOut();
    setAuth({ loggedIn: false });
    setAccountId(null); // Update the store
    console.log('[SWAP_AUTH] Logged out.');
  };

  console.log('[SWAP_AUTH] Returning auth state:', auth);
  return { auth, login, logout };
}