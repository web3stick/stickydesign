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
  XPOST: "xpost-1634.meme-cooking.near",
  DOGSHIT: "dogshit-1408.meme-cooking.near",
  KAT: "kat.token0.near"
};

// Create a reverse mapping for easier lookup
export const TOP_TOKEN_CONTRACTS: Record<string, string> = Object.fromEntries(
  Object.entries(TOP_TOKENS).map(([symbol, contractId]) => [
    contractId,
    symbol,
  ]),
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

// Function to fetch metadata for a token with rate limiting
async function fetchTokenMetadata(contractId: string): Promise<TokenMetadata> {
  // Return cached metadata if available
  if (tokenMetadataCache[contractId]) {
    return tokenMetadataCache[contractId];
  }

  // Return existing promise if fetch is already in progress
  const existingPromise = ongoingFetches[contractId];
  if (existingPromise) {
    return existingPromise;
  }

  try {
    console.log(`🔍 Fetching ft_metadata for contract: ${contractId}`);

    // Create and store the fetch promise
    const fetchPromise = near
      .view({
        contractId,
        methodName: "ft_metadata",
        args: {},
      })
      .then((result) => {
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
      })
      .catch((error) => {
        console.error(`❌ Failed to fetch metadata for ${contractId}:`, error);

        // Clean up the ongoing fetch on error
        delete ongoingFetches[contractId];

        // Return default metadata on error
        const defaultMetadata: TokenMetadata = {
          name: contractId,
          symbol: contractId.split(".")[0].toUpperCase(),
          decimals: 18,
        };
        tokenMetadataCache[contractId] = defaultMetadata;
        return defaultMetadata;
      });

    // Store the promise
    ongoingFetches[contractId] = fetchPromise;
    return fetchPromise;
  } catch (error) {
    console.error(`❌ Failed to fetch metadata for ${contractId}:`, error);

    // Clean up the ongoing fetch on error
    delete ongoingFetches[contractId];

    const defaultMetadata: TokenMetadata = {
      name: contractId,
      symbol: contractId.split(".")[0].toUpperCase(),
      decimals: 18,
    };
    tokenMetadataCache[contractId] = defaultMetadata;
    return defaultMetadata;
  }
}

// Function to fetch metadata for all top tokens with rate limiting
export async function fetchTopTokensMetadata(): Promise<
  Record<string, TokenMetadata>
> {
  const topTokenIds = Object.values(TOP_TOKENS);
  const metadataMap: Record<string, TokenMetadata> = {};

  // Process tokens in smaller batches to avoid overwhelming the RPC
  const batchSize = 3; // Process 3 tokens at a time
  const delayBetweenBatches = 100; // 100ms delay between batches

  for (let i = 0; i < topTokenIds.length; i += batchSize) {
    const batch = topTokenIds.slice(i, i + batchSize);
    const metadataPromises = batch.map((contractId) =>
      fetchTokenMetadata(contractId).then((metadata) => ({
        contractId,
        metadata,
      })),
    );

    const results = await Promise.all(metadataPromises);
    results.forEach(({ contractId, metadata }) => {
      metadataMap[contractId] = metadata;
    });

    // Add delay between batches (except for the last batch)
    if (i + batchSize < topTokenIds.length) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenBatches));
    }
  }

  return metadataMap;
}

// Function to get cached metadata for a token
export function getCachedTokenMetadata(
  contractId: string,
): TokenMetadata | undefined {
  return tokenMetadataCache[contractId];
}
