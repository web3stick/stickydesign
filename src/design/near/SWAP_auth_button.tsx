import { useSwapAuth } from './SWAP_auth';
import type { FunctionalComponent } from 'preact';

const SWAP_AUTH_BUTTON: FunctionalComponent = () => {
    const { auth, login, logout } = useSwapAuth();

    return (
        <button id="SWAP_AUTH_BUTTON" onClick={auth.loggedIn ? logout : login}>
            {auth.loggedIn ? `LOGOUT (${auth.accountId})` : 'LOGIN'}
        </button>
    );
};

export default SWAP_AUTH_BUTTON;