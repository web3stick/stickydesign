import * as near from "fastintear";

import { CONFIG } from "./NEAR_config";
import { getTokensFromDB } from "../../ts/token_list_db";
import {
  NATIVE_NEAR_TOKEN,
  getNativeNearBalance,
} from "./SWAP_token-definitions";

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

export interface SimpleToken {
  contract_id: string;
  displayName: string;
  isNative?: boolean;
  metadata?: TokenMetadata;
  price_usd?: string;
  liquidity_usd?: number;
  volume_usd_24h?: number;
}

export interface SwapToken extends SimpleToken {
  metadata: TokenMetadata;
  actualBalance: string;
  priceUsd?: number;
}

export async function getAvailableTokens(): Promise<SimpleToken[]> {
  const tokensFromDB = await getTokensFromDB();
  const simpleTokens: SimpleToken[] = tokensFromDB.map((token) => ({
    contract_id: token.account_id,
    displayName: token.metadata.symbol,
    metadata: token.metadata,
    price_usd: token.price_usd,
    liquidity_usd: token.liquidity_usd,
    volume_usd_24h: token.volume_usd_24h,
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

export interface RouteAction {
  pool_id?: string;
  token_in?: string;
  token_out?: string;
  amount_in?: string;
  amount_out?: string;
}

export interface SwapRoute {
  dex_id: string;
  estimated_amount?: {
    amount_out: string;
  };
  worst_case_amount?: {
    amount_out: string;
  };
  has_slippage?: boolean;
  actions?: RouteAction[];
  gas_estimate?: string;
  gasEstimate?: string;
  execution_instructions?: ExecutionInstruction[];
}

export interface TransactionAction {
  FunctionCall?: {
    method_name: string;
    args: string;
    gas: string;
    deposit: string;
  };
}

export interface ExecutionInstruction {
  NearTransaction?: {
    receiver_id: string;
    actions: TransactionAction[];
  };
}

export interface SwapQuote {
  inputAmount: string;
  outputAmount: string;
  route: SwapRoute[];
  gasEstimate: string;
  inputValueUsd?: number;
  outputValueUsd?: number;
  selectedRoute?: SwapRoute;
  availableRoutes?: SwapRoute[];
  selectedRouteIndex?: number;
}

export interface SwapParams {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  accountId: string;
  slippageTolerance: number;
}

/**
 * Fetches token metadata from contract using FastNEAR
 */
export async function fetchTokenMetadata(
  contractId: string,
): Promise<TokenMetadata> {
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
 * Fetches swap quote from Intear DEX aggregator
 */
export async function fetchSwapQuote(
  tokenIn: string,
  tokenOut: string,
  amountIn: string,
  slippageTolerance: number = 1.0,
  inputDecimals: number = 18,
  traderAccountId?: string,
): Promise<SwapQuote> {
  try {
    const slippageDecimal = slippageTolerance / 100;
    const params = new URLSearchParams({
      token_in: tokenIn,
      token_out: tokenOut,
      amount_in: amountIn,
      max_wait_ms: "3000",
      slippage_type: "Fixed",
      slippage: slippageDecimal.toString(),
      dexes: "Rhea,Veax,Aidols,GraFun,Wrap,RheaDcl",
    });

    if (traderAccountId) {
      params.append("trader_account_id", traderAccountId);
    }

    const url = `${CONFIG.DEX_AGG}?${params.toString()}`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No routes found for this swap");
    }

    const [inputPrice, outputPrice] = await Promise.all([
      fetchTokenPrice(tokenIn),
      fetchTokenPrice(tokenOut),
    ]);

    const bestRoute = data[0];
    const inputAmountFormatted = parseFloat(amountIn) / 10 ** inputDecimals;
    const outputAmountFormatted =
      parseFloat(bestRoute.estimated_amount?.amount_out || "0") / 10 ** 18;

    return {
      inputAmount: amountIn,
      outputAmount: bestRoute.estimated_amount?.amount_out || "0",
      route: data,
      gasEstimate:
        bestRoute.gas_estimate || bestRoute.gasEstimate || "30000000000000",
      selectedRoute: bestRoute,
      availableRoutes: data,
      selectedRouteIndex: 0,
      inputValueUsd:
        inputPrice > 0 ? inputAmountFormatted * inputPrice : undefined,
      outputValueUsd:
        outputPrice > 0 ? outputAmountFormatted * outputPrice : undefined,
    };
  } catch (error) {
    console.error("Failed to fetch swap quote:", error);
    throw error;
  }
}

/**
 * Fetches token price in USD from Intear prices API
 */
export async function fetchTokenPrice(contractId: string): Promise<number> {
  try {
    const url = `https://prices.intear.tech/price?token_id=${contractId}`;
    const response = await fetch(url);

    if (!response.ok) {
      return 0;
    }

    const data = await response.json();
    let price = 0;
    if (typeof data === "number") {
      price = data;
    } else if (typeof data === "object" && data !== null) {
      price = data.price || data.price_usd || data.usd_price || 0;
    }

    return price;
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
  try {
    if (simpleToken.isNative && simpleToken.contract_id === "near") {
      const [actualBalance, priceUsd] = await Promise.all([
        getNativeNearBalance(accountId),
        fetchTokenPrice("wrap.near"),
      ]);

      return {
        ...simpleToken,
        metadata: NATIVE_NEAR_TOKEN.metadata,
        actualBalance,
        displayName: NATIVE_NEAR_TOKEN.displayName,
        priceUsd,
        isNative: true,
      };
    }

    const [metadata, actualBalance, priceUsd] = await Promise.all([
      fetchTokenMetadata(simpleToken.contract_id),
      fetchTokenBalance(simpleToken.contract_id, accountId),
      fetchTokenPrice(simpleToken.contract_id),
    ]);

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

/**
 * Formats token amount with proper decimals
 */
export function formatTokenAmount(amount: string, decimals: number): string {
  const num = parseFloat(amount) / 10 ** decimals;

  if (num === 0) return "0";
  if (num < 0.000001) return num.toExponential(2);
  if (num < 1) return num.toFixed(6);
  if (num < 1000) return num.toFixed(4);

  return num.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

/**
 * Converts display amount to raw amount with decimals
 */
export function toRawAmount(amount: string, decimals: number): string {
  const cleanAmount = amount.replace(/,/g, "");
  const num = parseFloat(cleanAmount);
  if (Number.isNaN(num) || num <= 0) return "0";

  const [integerPart, decimalPart = ""] = cleanAmount.split(".");
  const paddedDecimal = (decimalPart + "0".repeat(decimals)).slice(0, decimals);

  const rawAmount = (integerPart + paddedDecimal).replace(/^0+/, "") || "0";
  return rawAmount;
}

/**
 * Updates quote with selected route
 */
export function selectRoute(quote: SwapQuote, routeIndex: number): SwapQuote {
  if (!quote.availableRoutes || routeIndex >= quote.availableRoutes.length) {
    return quote;
  }

  const selectedRoute = quote.availableRoutes[routeIndex];
  const outputAmountFormatted =
    parseFloat(selectedRoute.estimated_amount?.amount_out || "0") / 10 ** 18;

  return {
    ...quote,
    selectedRoute,
    selectedRouteIndex: routeIndex,
    outputAmount: selectedRoute.estimated_amount?.amount_out || "0",
    gasEstimate:
      selectedRoute.gas_estimate ||
      selectedRoute.gasEstimate ||
      "30000000000000",
    outputValueUsd: quote.inputValueUsd
      ? outputAmountFormatted *
        (quote.inputValueUsd / (parseFloat(quote.inputAmount) / 10 ** 18))
      : undefined,
  };
}

/**
 * Executes swap transaction using FastNEAR with multiple transactions in single wallet popup
 */
export async function executeSwap(quote: SwapQuote): Promise<void> {
  if (!quote.selectedRoute || !near) {
    throw new Error("No route selected or FastNEAR not available");
  }

  const route = quote.selectedRoute;
  const instructions = route.execution_instructions;

  if (!instructions || instructions.length === 0) {
    throw new Error("No execution instructions found");
  }

  const accountId = near.accountId();
  if (!accountId) {
    throw new Error("No account signed in");
  }

  const transactions: any[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i];

    if (instruction.NearTransaction) {
      const { receiver_id, actions } = instruction.NearTransaction;

      const nearActions = actions
        .filter((action: TransactionAction) => action.FunctionCall)
        .map((action: TransactionAction) => {
          const fc = action.FunctionCall as NonNullable<
            typeof action.FunctionCall
          >;
          return near.actions.functionCall({
            methodName: fc.method_name,
            args: JSON.parse(atob(fc.args)),
            gas: fc.gas,
            deposit: fc.deposit,
          });
        });

      transactions.push({
        signerId: accountId,
        receiverId: receiver_id,
        actions: nearActions,
      });
    }
  }

  // Execute all transactions in a single wallet popup using the adapter
  // this is going to throw errors that is fine
  // it must be this exactly
  //   await near.state._adapter.sendTransactions({
  await near.state._adapter.sendTransactions({
    transactions: transactions,
  });
}

/**
 * Validates swap parameters
 */
export function validateSwapParams(params: SwapParams): string | null {
  if (!params.accountId) return "Account ID is required";
  if (!params.tokenIn) return "Input token is required";
  if (!params.tokenOut) return "Output token is required";
  if (!params.amountIn || parseFloat(params.amountIn) <= 0)
    return "Amount must be greater than 0";
  if (params.slippageTolerance < 0.1 || params.slippageTolerance > 50)
    return "Slippage must be between 0.1% and 50%";

  return null;
}
