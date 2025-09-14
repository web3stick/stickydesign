import type { TokenMetadata } from "./SWAP_swap_logic";
import NearTokenSvg from "./NEAR_token.svg";

export interface NativeToken {
  contract_id: string;
  displayName: string;
  metadata: TokenMetadata;
  isNative: boolean;
}

/**
 * Native NEAR token definition
 * This represents the native NEAR token that users can swap
 */
export const NATIVE_NEAR_TOKEN: NativeToken = {
  contract_id: "near",
  displayName: "NEAR",
  metadata: {
    name: "NEAR Protocol",
    symbol: "NEAR",
    decimals: 24,
    icon: NearTokenSvg, // Use local NEAR SVG
  },
  isNative: true,
};

/**
 * Wrapped NEAR token definition
 */
export const WRAPPED_NEAR_TOKEN: NativeToken = {
  contract_id: "wrap.near",
  displayName: "wNEAR",
  metadata: {
    name: "Wrapped NEAR",
    symbol: "wNEAR",
    decimals: 24,
    icon: undefined,
  },
  isNative: false,
};

/**
 * Gets the native NEAR balance for an account using FastNEAR
 */
export async function getNativeNearBalance(accountId: string): Promise<string> {
  try {
    console.log("Fetching native NEAR balance for:", accountId);
    const account = await window.near.queryAccount({
      accountId: accountId,
    });

    // FastINTEAR returns a JSON-RPC response, we need the result property
    const accountData = account.result || account;
    const balance = accountData.amount || "0";

    console.log("Native NEAR balance:", balance);
    return balance;
  } catch (error) {
    console.error("Failed to fetch native NEAR balance:", error);
    return "0";
  }
}
