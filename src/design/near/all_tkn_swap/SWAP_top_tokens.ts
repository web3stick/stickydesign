import * as near from "fastintear";
import type { TokenMetadata } from "./SWAP_swap_logic_types";

// Top tokens that should be shown at the top of the token list
export const TOP_TOKENS: Record<string, string> = {
  SHIT: "shit-1170.meme-cooking.near",
  CRANS: "crans.tkn.near",
  SHITZU: "token.0xshitzu.near",
  BD: "blackdragon.tkn.near", 
  WNEAR: "wrap.near",
  NEAR: "near", // native near
  SIN: "sin-339.meme-cooking.near",
  PUMP: "token.pumpopoly.near",
  STNEAR: "meta-pool.near",
  JAMBO: "jambo-1679.meme-cooking.near",
  XPOST: "xpost-1634.meme-cooking.near"
};

// Create a reverse mapping for easier lookup
export const TOP_TOKEN_CONTRACTS: Record<string, string> = Object.fromEntries(
  Object.entries(TOP_TOKENS).map(([symbol, contractId]) => [contractId, symbol])
);

// Cache for token metadata
const tokenMetadataCache: Record<string, TokenMetadata> = {};

// Ongoing fetch promises to prevent duplicate requests
const ongoingFetches: Record<string, Promise<TokenMetadata>> = {};

// Function to check if a token is a top token
export function isTopToken(contractId: string): boolean {
  return contractId in TOP_TOKEN_CONTRACTS;
}

// Function to get the display symbol for a top token
export function getTopTokenSymbol(contractId: string): string | undefined {
  return TOP_TOKEN_CONTRACTS[contractId];
}

// Function to fetch metadata for a token
async function fetchTokenMetadata(contractId: string): Promise<TokenMetadata> {
  // Return cached metadata if available
  if (tokenMetadataCache[contractId]) {
    return tokenMetadataCache[contractId];
  }

  // Return existing promise if fetch is already in progress
  if (ongoingFetches[contractId]) {
    return ongoingFetches[contractId];
  }

  try {
    console.log(`🔍 Fetching ft_metadata for contract: ${contractId}`);

    // Create and store the fetch promise
    ongoingFetches[contractId] = near.view({
      contractId,
      methodName: "ft_metadata",
      args: {},
    }).then(result => {
      const metadata: TokenMetadata = {
        name: result.name || contractId,
        symbol: result.symbol || contractId.split(".")[0].toUpperCase(),
        decimals: result.decimals || 18,
        icon: result.icon,
      };

      // Cache the metadata
      tokenMetadataCache[contractId] = metadata;
      
      // Clean up the ongoing fetch
      delete ongoingFetches[contractId];
      
      return metadata;
    });

    return await ongoingFetches[contractId];
  } catch (error) {
    console.error(`❌ Failed to fetch metadata for ${contractId}:`, error);
    
    // Clean up the ongoing fetch on error
    delete ongoingFetches[contractId];
    
    const defaultMetadata: TokenMetadata = {
      name: contractId,
      symbol: contractId.split(".")[0].toUpperCase(),
      decimals: 18,
    };
    return defaultMetadata;
  }
}

// Function to fetch metadata for all top tokens
export async function fetchTopTokensMetadata(): Promise<Record<string, TokenMetadata>> {
  const topTokenIds = Object.values(TOP_TOKENS);
  const metadataPromises = topTokenIds.map(contractId => 
    fetchTokenMetadata(contractId).then(metadata => ({ contractId, metadata }))
  );
  
  const results = await Promise.all(metadataPromises);
  
  const metadataMap: Record<string, TokenMetadata> = {};
  results.forEach(({ contractId, metadata }) => {
    metadataMap[contractId] = metadata;
  });
  
  return metadataMap;
}

// Function to get cached metadata for a token
export function getCachedTokenMetadata(contractId: string): TokenMetadata | undefined {
  return tokenMetadataCache[contractId];
}