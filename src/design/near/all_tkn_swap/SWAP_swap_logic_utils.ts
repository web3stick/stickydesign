import type { SwapQuote } from "./SWAP_swap_logic_types";

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
 * Validates swap parameters
 */
export function validateSwapParams(params: any): string | null {
  if (!params.accountId) return "Account ID is required";
  if (!params.tokenIn) return "Input token is required";
  if (!params.tokenOut) return "Output token is required";
  if (!params.amountIn || parseFloat(params.amountIn) <= 0)
    return "Amount must be greater than 0";
  if (params.slippageTolerance < 0.1 || params.slippageTolerance > 50)
    return "Slippage must be between 0.1% and 50%";

  return null;
}