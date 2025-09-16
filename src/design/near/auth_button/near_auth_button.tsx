// import
import type { FunctionalComponent } from 'preact';
// import near
import '../near.config' // this configs fastintear
import { useFastIntearAuth } from './near.auth';


// App_NEAR_AUTH_BUTTON
const NEAR_AUTH_BUTTON: FunctionalComponent = () => {
    const { auth, login, logout } = useFastIntearAuth();

    return (
        <button id="NEAR_AUTH_BUTTON" onClick={auth.loggedIn ? logout : login}>
            {auth.loggedIn ? `LOGOUT (${auth.accountId})` : 'LOGIN'}
        </button>
    );
};

export default NEAR_AUTH_BUTTON;