import { useEffect } from "preact/hooks";
// import near
import '../near.config' // this configs fastintear
import { useSwapAuth } from "./SWAP_auth";
import SWAP_AUTH_BUTTON from "./SWAP_auth_button";
import { SwapUI } from "./SWAP_ui";
import { useSwapStore } from "./swapStore";
import { fetchTopTokensMetadata } from "./SWAP_top_tokens";

// NEAR_ALL_TOKEN_Swap
export const NEAR_ALL_TOKEN_Swap_FULL_COMPONENT = () => {
  const { auth } = useSwapAuth();
  // We no longer need to derive accountId here since it's managed by the store
  // But we still need to update the store when auth changes
  const setStoreAccountId = useSwapStore((state) => state.setAccountId);

  // Update the store's accountId when auth changes
  useEffect(() => {
    console.log("[SWAP_MAIN] Auth state changed, updating store:", auth);
    setStoreAccountId(auth.loggedIn ? auth.accountId : null);
  }, [auth, setStoreAccountId]);

  // Fetch metadata for top tokens when component mounts
  useEffect(() => {
    console.log("[SWAP_MAIN] Fetching metadata for top tokens");
    fetchTopTokensMetadata().catch(error => {
      console.error("[SWAP_MAIN] Failed to fetch top tokens metadata:", error);
    });
  }, []);

  // Simple key that changes on auth state to force complete re-render
  const componentKey = auth.loggedIn
    ? `logged-in-${auth.accountId}`
    : "logged-out";

  console.log(
    "[SWAP_MAIN] Render with auth state:",
    auth,
    "key:",
    componentKey,
  );

  // Add a useEffect to log when the component mounts/unmounts
  useEffect(() => {
    console.log("[SWAP_MAIN] Component mounted with auth state:", auth);
    return () => {
      console.log("[SWAP_MAIN] Component unmounted");
    };
  }, []);

  return (
    <div className="page swap-page" key={componentKey}>
      <div className="swap-container">
        <div className="swap-header">
          <h2 className="swap-title">web4dex</h2>
        </div>
        <SWAP_AUTH_BUTTON />
        <SwapUI />
        <p>designed by sleet, powered by intear</p>
      </div>
    </div>
  );
};
