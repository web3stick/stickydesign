import { useSwapAuth } from './SWAP_auth';
import type { FunctionalComponent } from 'preact';

const SWAP_AUTH_BUTTON: FunctionalComponent = () => {
    const { auth, login, logout } = useSwapAuth();
    
    console.log('[SWAP_AUTH_BUTTON] Render with auth state:', auth);

    return (
        <button 
            className="swap-auth-button" 
            onClick={() => {
                console.log('[SWAP_AUTH_BUTTON] Clicked, current auth state:', auth);
                if (auth.loggedIn) {
                    console.log('[SWAP_AUTH_BUTTON] Calling logout');
                    logout();
                } else {
                    console.log('[SWAP_AUTH_BUTTON] Calling login');
                    login();
                }
            }}
        >
            {auth.loggedIn ? `LOGOUT (${auth.accountId})` : 'LOGIN TO SWAP'}
        </button>
    );
};

export default SWAP_AUTH_BUTTON;