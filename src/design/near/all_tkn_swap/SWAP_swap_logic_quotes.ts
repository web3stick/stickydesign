import { CONFIG } from "./NEAR_config";
import type { SwapQuote } from "./SWAP_swap_logic_types";
import { fetchTokenPrice } from "./SWAP_swap_logic_tokens";

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
    console.log('[DEX AGG] Fetching swap quote from:', url);
    
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
    console.log('[DEX AGG] Raw response data:', data);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No routes found for this swap");
    }

    // Log details of each route
    data.forEach((route, index) => {
      console.log(`[DEX AGG] Route ${index}:`, {
        dexId: route.dex_id,
        estimatedAmount: route.estimated_amount?.amount_out,
        worstCaseAmount: route.worst_case_amount?.amount_out,
        gasEstimate: route.gas_estimate || route.gasEstimate,
        actionsCount: route.execution_instructions?.length || 0
      });
    });

    const [inputPrice, outputPrice] = await Promise.all([
      fetchTokenPrice(tokenIn === "near" ? "wrap.near" : tokenIn),
      fetchTokenPrice(tokenOut === "near" ? "wrap.near" : tokenOut),
    ]);

    const bestRoute = data[0];
    console.log('[DEX AGG] Best route:', bestRoute);
    
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
 * Fetches swap quote from Intear DEX aggregator for a specific output amount
 */
export async function fetchSwapQuoteForOutput(
  tokenIn: string,
  tokenOut: string,
  amountOut: string,
  slippageTolerance: number = 1.0,
  outputDecimals: number = 18,
  traderAccountId?: string,
): Promise<SwapQuote> {
  try {
    const slippageDecimal = slippageTolerance / 100;
    const params = new URLSearchParams({
      token_in: tokenIn,
      token_out: tokenOut,
      amount_out: amountOut,
      max_wait_ms: "3000",
      slippage_type: "Fixed",
      slippage: slippageDecimal.toString(),
      dexes: "Rhea,Veax,Aidols,GraFun,Wrap,RheaDcl",
    });

    if (traderAccountId) {
      params.append("trader_account_id", traderAccountId);
    }

    const url = `${CONFIG.DEX_AGG}?${params.toString()}`;
    console.log('[DEX AGG] Fetching swap quote for output from:', url);
    
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
    console.log('[DEX AGG] Raw response data for output:', data);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("No routes found for this swap");
    }

    // Log details of each route
    data.forEach((route, index) => {
      console.log(`[DEX AGG] Route ${index}:`, {
        dexId: route.dex_id,
        estimatedAmount: route.estimated_amount?.amount_out,
        worstCaseAmount: route.worst_case_amount?.amount_out,
        gasEstimate: route.gas_estimate || route.gasEstimate,
        actionsCount: route.execution_instructions?.length || 0
      });
    });

    const [inputPrice, outputPrice] = await Promise.all([
      fetchTokenPrice(tokenIn === "near" ? "wrap.near" : tokenIn),
      fetchTokenPrice(tokenOut === "near" ? "wrap.near" : tokenOut),
    ]);

    const bestRoute = data[0];
    console.log('[DEX AGG] Best route:', bestRoute);
    
    // For amount_out requests, we get the input amount from the route
    const inputAmountRaw = bestRoute.estimated_amount?.amount_in || "0";
    const inputAmountFormatted = parseFloat(inputAmountRaw) / 10 ** 18;
    const outputAmountFormatted = parseFloat(amountOut) / 10 ** outputDecimals;

    return {
      inputAmount: inputAmountRaw,
      outputAmount: amountOut,
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
    console.error("Failed to fetch swap quote for output:", error);
    throw error;
  }
}