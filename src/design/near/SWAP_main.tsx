import { useSwapAuth } from "./SWAP_auth";
import SWAP_AUTH_BUTTON from "./SWAP_auth_button";
import { SwapUI } from "./SWAP_ui";

export const Swap = () => {
  const { auth } = useSwapAuth();
  const accountId = auth.loggedIn ? auth.accountId : null;

  // Simple key that changes on auth state to force complete re-render
  const componentKey = auth.loggedIn ? `logged-in-${auth.accountId}` : 'logged-out';

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