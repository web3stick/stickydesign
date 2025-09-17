import * as near from "fastintear";
import { getTokensFromDB } from "./SWAP_token_list_db";
import {
  NATIVE_NEAR_TOKEN,
  getNativeNearBalance,
} from "./SWAP_token-definitions";
import type { 
  SimpleToken, 
  SwapToken, 
  TokenMetadata 
} from "./SWAP_swap_logic_types";
import { isTopToken, getCachedTokenMetadata } from "./SWAP_top_tokens";

export async function getAvailableTokens(): Promise<SimpleToken[]> {
  const tokensFromDB = await getTokensFromDB();
  const simpleTokens: SimpleToken[] = tokensFromDB.map((token) => ({
    contract_id: token.account_id,
    displayName: token.metadata.symbol,
    metadata: {
      name: token.metadata.name,
      symbol: token.metadata.symbol,
      decimals: token.metadata.decimals,
    },
    // Don't include price data from token list
  }));

  // Add native NEAR
  simpleTokens.unshift({
    contract_id: NATIVE_NEAR_TOKEN.contract_id,
    displayName: NATIVE_NEAR_TOKEN.displayName,
    isNative: true,
    metadata: NATIVE_NEAR_TOKEN.metadata,
  });

  return simpleTokens;
}

/**
 * Fetches token metadata from contract using FastNEAR
 */
export async function fetchTokenMetadata(
  contractId: string,
): Promise<TokenMetadata> {
  // Check if we have cached metadata for top tokens
  if (isTopToken(contractId)) {
    const cachedMetadata = getCachedTokenMetadata(contractId);
    if (cachedMetadata) {
      console.log(`Using cached metadata for top token: ${contractId}`);
      return cachedMetadata;
    }
  }

  try {
    console.log(`🔍 Fetching ft_metadata for contract: ${contractId}`);

    const result = await near.view({
      contractId,
      methodName: "ft_metadata",
      args: {},
    });

    const metadata = {
      name: result.name || contractId,
      symbol: result.symbol || contractId.split(".")[0].toUpperCase(),
      decimals: result.decimals || 18,
      icon: result.icon,
    };

    return metadata;
  } catch (error) {
    console.error(`❌ Failed to fetch metadata for ${contractId}:`, error);
    const defaultMetadata = {
      name: contractId,
      symbol: contractId.split(".")[0].toUpperCase(),
      decimals: 18,
    };
    return defaultMetadata;
  }
}

/**
 * Fetches actual token balance for a user using FastNEAR
 */
export async function fetchTokenBalance(
  contractId: string,
  accountId: string,
): Promise<string> {
  try {
    const result = await near.view({
      contractId,
      methodName: "ft_balance_of",
      args: { account_id: accountId },
    });

    return result || "0";
  } catch (error) {
    console.error(`Failed to fetch balance for ${contractId}:`, error);
    return "0";
  }
}

/**
 * Fetches token price in USD from Intear prices API (super precise)
 */
export async function fetchTokenPrice(contractId: string): Promise<number> {
  try {
    const url = `https://prices.intear.tech/super-precise-price?token_id=${contractId}`;
    const response = await fetch(url);

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    let price = 0;
    
    // Handle the string response from super-precise-price
    if (typeof data === "string") {
      price = parseFloat(data);
    } else if (typeof data === "number") {
      price = data;
    } else if (typeof data === "object" && data !== null) {
      // Fallback to the regular price endpoint format
      price = data.price || data.price_usd || data.usd_price || 0;
      if (typeof price === "string") {
        price = parseFloat(price);
      }
    }

    return price || 0;
  } catch (error) {
    console.error(`Error fetching price for ${contractId}:`, error);
    return 0;
  }
}

/**
 * Prepares a full swap token with metadata for the selected token
 */
export async function prepareSwapToken(
  simpleToken: SimpleToken,
  accountId: string,
): Promise<SwapToken> {
  // Handle empty account ID
  const hasAccountId = accountId && accountId.trim() !== "";
  
  try {
    if (simpleToken.isNative && simpleToken.contract_id === "near") {
      // For native NEAR, use predefined metadata
      const metadata = NATIVE_NEAR_TOKEN.metadata;
      
      // Only fetch balance if we have an account ID
      const actualBalance = hasAccountId 
        ? await getNativeNearBalance(accountId) 
        : "0";
        
      // Fetch price separately using wrap.near as proxy
      const priceUsd = await fetchTokenPrice("wrap.near");

      return {
        ...simpleToken,
        metadata,
        actualBalance,
        displayName: NATIVE_NEAR_TOKEN.displayName,
        priceUsd,
        isNative: true,
      };
    }

    // For non-native tokens, fetch both metadata and price
    // For top tokens, fetchTokenMetadata will use cached data
    const [metadata, priceUsd] = await Promise.all([
      fetchTokenMetadata(simpleToken.contract_id),
      fetchTokenPrice(simpleToken.contract_id),
    ]);
    
    // Only fetch balance if we have an account ID
    const actualBalance = hasAccountId 
      ? await fetchTokenBalance(simpleToken.contract_id, accountId) 
      : "0";

    return {
      ...simpleToken,
      metadata,
      actualBalance,
      displayName: metadata.symbol || simpleToken.displayName,
      priceUsd,
      isNative: false,
    };
  } catch (error) {
    console.error(
      `Failed to prepare swap token ${simpleToken.contract_id}:`,
      error,
    );
    // Fallback with minimal metadata
    return {
      ...simpleToken,
      metadata: {
        name: simpleToken.contract_id,
        symbol: simpleToken.displayName,
        decimals: simpleToken.isNative ? 24 : 18,
      },
      actualBalance: "0",
      priceUsd: 0,
      isNative: simpleToken.isNative || false,
    };
  }
}