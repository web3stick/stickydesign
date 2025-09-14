import { useSwapAuth } from "./SWAP_auth";
import SWAP_AUTH_BUTTON from "./SWAP_auth_button";
import { SwapUI } from "./SWAP_ui";
import { useEffect } from "preact/hooks";

export const Swap = () => {
  const { auth } = useSwapAuth();
  const accountId = auth.loggedIn ? auth.accountId : null;

  // Simple key that changes on auth state to force complete re-render
  const componentKey = auth.loggedIn ? `logged-in-${auth.accountId}` : 'logged-out';
  
  console.log('[SWAP_MAIN] Render with auth state:', auth, 'accountId:', accountId, 'key:', componentKey);

  // Add a useEffect to log when the component mounts/unmounts
  useEffect(() => {
    console.log('[SWAP_MAIN] Component mounted with auth state:', auth);
    return () => {
      console.log('[SWAP_MAIN] Component unmounted');
    };
  }, []);

  return (
    <div className="page swap-page" key={componentKey}>
      <div className="swap-container">
        <div className="swap-header">
          <h2 className="swap-title">dex agg widget</h2>
        </div>
        
        <SWAP_AUTH_BUTTON />
        
        <SwapUI accountId={accountId} />
      </div>
    </div>
  );
};