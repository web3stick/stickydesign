import * as near from 'fastintear';
import { useEffect, useState } from 'preact/hooks';

type AuthState = { loggedIn: false } | { loggedIn: true; accountId: string };

export function useSwapAuth(): {
  auth: AuthState;
  login: () => Promise<void>;
  logout: () => void;
} {
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false });

  // Check auth status on component mount
  useEffect(() => {
    const status = near.authStatus();
    if (status === 'SignedIn') {
      const accountId = near.accountId();
      if (accountId) {
        setAuth({ loggedIn: true, accountId });
      }
    } else {
      setAuth({ loggedIn: false });
    }
  }, []);

  const login = async () => {
    await near.requestSignIn();
    const accountId = near.accountId();
    if (accountId) {
      setAuth({ loggedIn: true, accountId });
    }
  };

  const logout = () => {
    near.signOut();
    setAuth({ loggedIn: false });
  };

  return { auth, login, logout };
}