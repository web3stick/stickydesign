import { CONFIG, DOGSHIT_TOKEN } from './config';
import { fetchUserTokens, type UserToken } from './profile_token-list';
import { NATIVE_NEAR_TOKEN, getNativeNearBalance } from './token-definitions';
// import * as near from "fastintear";

export interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  icon?: string;
}

export interface SimpleToken extends UserToken {
  displayName: string;
  isNative?: boolean;
  metadata?: TokenMetadata;
}

export interface SwapToken extends SimpleToken {
  metadata: TokenMetadata;
  actualBalance: string;
  priceUsd?: number;
  isNative?: boolean;
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

    const result = await window.near.view({
      contractId,
      methodName: 'ft_metadata',
      args: {},
    });

    console.log(`📋 Raw ft_metadata result for ${contractId}:`, result);
    console.log(`📋 Result type:`, typeof result);
    console.log(`📋 Result keys:`, Object.keys(result || {}));

    // Log individual fields
    console.log(`📋 name: "${result?.name}" (type: ${typeof result?.name})`);
    console.log(`📋 symbol: "${result?.symbol}" (type: ${typeof result?.symbol})`);
    console.log(`📋 decimals: ${result?.decimals} (type: ${typeof result?.decimals})`);
    console.log(`📋 icon: "${result?.icon}" (type: ${typeof result?.icon})`);

    const metadata = {
      name: result.name || contractId,
      symbol: result.symbol || contractId.split('.')[0].toUpperCase(),
      decimals: result.decimals || 18,
      icon: result.icon,
    };

    console.log(`✅ Processed metadata for ${contractId}:`, metadata);

    return metadata;
  } catch (error) {
    console.error(`❌ Failed to fetch metadata for ${contractId}:`, error);
    console.error(`❌ Error type:`, typeof error);
    console.error(`❌ Error message:`, (error as Error)?.message);

    // Return default metadata
    const defaultMetadata = {
      name: contractId,
      symbol: contractId.split('.')[0].toUpperCase(),
      decimals: 18,
    };

    console.log(`🔄 Using default metadata for ${contractId}:`, defaultMetadata);
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
    const result = await window.near.view({
      contractId,
      methodName: 'ft_balance_of',
      args: { account_id: accountId },
    });

    return result || '0';
  } catch (error) {
    console.error(`Failed to fetch balance for ${contractId}:`, error);
    return '0';
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
    // Convert slippage from percentage to decimal (1% = 0.01)
    const slippageDecimal = slippageTolerance / 100;

    // Use the correct parameter names expected by the Intear router API
    const params = new URLSearchParams({
      token_in: tokenIn,
      token_out: tokenOut,
      amount_in: amountIn,
      max_wait_ms: '3000', // 3 seconds max wait time
      slippage_type: 'Fixed',
      slippage: slippageDecimal.toString(),
      // Include common DEXes that support DOGSHIT trading
      dexes: 'Rhea,Veax,Aidols,GraFun,Wrap,RheaDcl',
    });

    // Add trader_account_id if provided
    if (traderAccountId) {
      params.append('trader_account_id', traderAccountId);
    }

    const url = `${CONFIG.DEX_AGG}?${params.toString()}`;
    console.log(`🔄 Fetching swap quote: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error Response: ${errorText}`);
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ Swap quote response:', data);

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('No routes found for this swap');
    }

    // Get prices for value calculation
    const [inputPrice, outputPrice] = await Promise.all([
      fetchTokenPrice(tokenIn),
      fetchTokenPrice(tokenOut),
    ]);

    // Use the first (best) route as default
    const bestRoute = data[0];
    const inputAmountFormatted = parseFloat(amountIn) / 10 ** inputDecimals;
    const outputAmountFormatted =
      parseFloat(bestRoute.estimated_amount?.amount_out || '0') / 10 ** 18; // DOGSHIT has 18 decimals

    return {
      inputAmount: amountIn,
      outputAmount: bestRoute.estimated_amount?.amount_out || '0',
      route: data, // Return full route data for execution
      gasEstimate:
        bestRoute.gas_estimate || bestRoute.gasEstimate || '30000000000000',
      selectedRoute: bestRoute,
      availableRoutes: data,
      selectedRouteIndex: 0, // Default to first (best) route
      inputValueUsd:
        inputPrice > 0 ? inputAmountFormatted * inputPrice : undefined,
      outputValueUsd:
        outputPrice > 0 ? outputAmountFormatted * outputPrice : undefined,
    };
  } catch (error) {
    console.error('Failed to fetch swap quote:', error);
    throw error;
  }
}

/**
 * Fetches token price in USD from Intear prices API
 */
export async function fetchTokenPrice(contractId: string): Promise<number> {
  try {
    const url = `https://prices.intear.tech/price?token_id=${contractId}`;
    console.log(`🔄 Fetching price for ${contractId}: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      console.warn(
        `Failed to fetch price for ${contractId}: ${response.status}`,
      );
      return 0;
    }

    const data = await response.json();
    console.log(`💰 Price response for ${contractId}:`, data);

    // The API returns the price directly as a number, not in an object
    let price = 0;
    if (typeof data === 'number') {
      price = data;
    } else if (typeof data === 'object' && data !== null) {
      price = data.price || data.price_usd || data.usd_price || 0;
    }

    console.log(`💰 Extracted price for ${contractId}: $${price}`);

    return price;
  } catch (error) {
    console.error(`Error fetching price for ${contractId}:`, error);
    return 0;
  }
}



/**
 * Gets simple display name from contract ID
 */
function getSimpleDisplayName(contractId: string): string {
  if (contractId === 'wrap.near') return 'wNEAR';
  if (contractId.includes('usdc')) return 'USDC';
  if (contractId.includes('usdt')) return 'USDT';

  // Extract name from contract ID
  const parts = contractId.split('.');
  if (parts.length > 0) {
    const firstPart = parts[0];
    const cleanName = firstPart.replace(/[-\d]/g, '');
    return cleanName.toUpperCase() || contractId.split('.')[0].toUpperCase();
  }

  return contractId.split('.')[0].toUpperCase();
}

/**
 * Prepares simple token list for dropdown with optional metadata fetching
 */
export async function prepareSimpleTokens(
  accountId: string,
  fetchMetadata: boolean = false,
): Promise<SimpleToken[]> {
  try {
    const userTokens = await fetchUserTokens(accountId);
    const simpleTokens: SimpleToken[] = [];

    // Always add native NEAR as the first option
    try {
      const nearBalance = await getNativeNearBalance(accountId);
      console.log('Native NEAR balance fetched:', nearBalance);

      // Add native NEAR even if balance is 0 so users can see it as an option
      simpleTokens.push({
        balance: nearBalance,
        contract_id: NATIVE_NEAR_TOKEN.contract_id,
        last_update_block_height: 0,
        displayName: NATIVE_NEAR_TOKEN.displayName,
        isNative: true,
        metadata: NATIVE_NEAR_TOKEN.metadata,
      });

      console.log('Native NEAR token added to list');
    } catch (error) {
      console.error('Failed to fetch native NEAR balance:', error);
      // Add with 0 balance as fallback
      simpleTokens.push({
        balance: '0',
        contract_id: NATIVE_NEAR_TOKEN.contract_id,
        last_update_block_height: 0,
        displayName: NATIVE_NEAR_TOKEN.displayName,
        isNative: true,
        metadata: NATIVE_NEAR_TOKEN.metadata,
      });
    }

    // Filter out DOGSHIT token and zero balances
    const eligibleTokens = userTokens.tokens.filter(
      (token) =>
        token.contract_id !== DOGSHIT_TOKEN && parseFloat(token.balance) > 0,
    );

    // Add wNEAR if not already present and has balance
    const hasWNear = eligibleTokens.some(
      (token) => token.contract_id === 'wrap.near',
    );
    if (!hasWNear) {
      try {
        const wNearBalance = await fetchTokenBalance('wrap.near', accountId);
        if (parseFloat(wNearBalance) > 0) {
          eligibleTokens.push({
            balance: wNearBalance,
            contract_id: 'wrap.near',
            last_update_block_height: 0,
          });
        }
      } catch (error) {
        console.error('Failed to fetch wNEAR balance:', error);
      }
    }

    // Convert eligible tokens to simple tokens with display names and optional metadata
    for (const token of eligibleTokens) {
      let metadata: TokenMetadata | undefined;

      if (fetchMetadata) {
        try {
          metadata = await fetchTokenMetadata(token.contract_id);
        } catch (error) {
          console.error(`Failed to fetch metadata for ${token.contract_id}:`, error);
          // Continue without metadata
        }
      }

      simpleTokens.push({
        ...token,
        displayName: metadata?.symbol || getSimpleDisplayName(token.contract_id),
        isNative: false,
        metadata,
      });
    }

    // Sort by balance (highest first), but keep native NEAR at the top
    const nativeNear = simpleTokens.filter(token => token.isNative);
    const otherTokens = simpleTokens.filter(token => !token.isNative)
      .sort((a, b) => parseFloat(b.balance) - parseFloat(a.balance));

    return [...nativeNear, ...otherTokens];
  } catch (error) {
    console.error('Failed to prepare simple tokens:', error);
    return [];
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
    // Handle native NEAR specially
    if (simpleToken.isNative && simpleToken.contract_id === 'near') {
      const [actualBalance, priceUsd] = await Promise.all([
        getNativeNearBalance(accountId),
        fetchTokenPrice('wrap.near'), // Use wNEAR price for native NEAR
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

    // Handle regular tokens
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
    // Return with default metadata
    return {
      ...simpleToken,
      metadata: {
        name: simpleToken.contract_id,
        symbol: simpleToken.displayName,
        decimals: simpleToken.isNative ? 24 : 18,
      },
      actualBalance: simpleToken.balance,
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

  if (num === 0) return '0';
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
 * Ensures no scientific notation is used in the output
 */
export function toRawAmount(amount: string, decimals: number): string {
  // Remove any commas or formatting from the input
  const cleanAmount = amount.replace(/,/g, '');
  const num = parseFloat(cleanAmount);
  if (Number.isNaN(num) || num <= 0) return '0';

  // For very large numbers, use string manipulation to avoid scientific notation
  const [integerPart, decimalPart = ''] = cleanAmount.split('.');
  const paddedDecimal = (decimalPart + '0'.repeat(decimals)).slice(0, decimals);

  // Combine integer and decimal parts
  const rawAmount = (integerPart + paddedDecimal).replace(/^0+/, '') || '0';
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
    parseFloat(selectedRoute.estimated_amount?.amount_out || '0') / 10 ** 18;

  return {
    ...quote,
    selectedRoute,
    selectedRouteIndex: routeIndex,
    outputAmount: selectedRoute.estimated_amount?.amount_out || '0',
    gasEstimate:
      selectedRoute.gas_estimate ||
      selectedRoute.gasEstimate ||
      '30000000000000',
    outputValueUsd: quote.inputValueUsd
      ? outputAmountFormatted *
      (quote.inputValueUsd / (parseFloat(quote.inputAmount) / 10 ** 18))
      : undefined,
  };
}

/**
 * Executes swap transaction using FastNEAR with multiple transactions in single wallet popup
 * The DEX aggregator handles native NEAR wrapping and storage deposits automatically
 */
export async function executeSwap(quote: SwapQuote): Promise<void> {
  if (!quote.selectedRoute || !window.near) {
    throw new Error('No route selected or FastNEAR not available');
  }

  const route = quote.selectedRoute;
  const instructions = route.execution_instructions;

  if (!instructions || instructions.length === 0) {
    throw new Error('No execution instructions found');
  }

  console.log(`🔄 Executing swap with ${instructions.length} instruction(s)`);
  console.log(`📋 Full instructions:`, JSON.stringify(instructions, null, 2));

  // Get the current account ID
  const accountId = window.near.accountId();
  if (!accountId) {
    throw new Error('No account signed in');
  }

  // Build transactions array for batch execution
  const transactions: any[] = [];

  for (let i = 0; i < instructions.length; i++) {
    const instruction = instructions[i];

    if (instruction.NearTransaction) {
      const { receiver_id, actions } = instruction.NearTransaction;

      console.log(`📋 Transaction ${i + 1}: ${actions.length} actions for ${receiver_id}`);

      // Convert actions to FastNEAR format
      const nearActions = actions
        .filter((action: TransactionAction) => action.FunctionCall)
        .map((action: TransactionAction) => {
          const fc = action.FunctionCall as NonNullable<typeof action.FunctionCall>;
          console.log(`  📋 Action: ${fc.method_name} on ${receiver_id}`);
          console.log(`  💰 Deposit: ${fc.deposit} yoctoNEAR`);

          return window.near.actions.functionCall({
            methodName: fc.method_name,
            args: JSON.parse(atob(fc.args)),
            gas: fc.gas,
            deposit: fc.deposit,
          });
        });

      // Add transaction to batch
      transactions.push({
        signerId: accountId,
        receiverId: receiver_id,
        actions: nearActions,
      });
    }
  }

  console.log(`🔄 Executing batch of ${transactions.length} transactions in single wallet popup`);

  // Execute all transactions in a single wallet popup using the adapter
  const result = await window.near.state._adapter.sendTransactions({
    transactions: transactions,
  });

  console.log('✅ Swap transactions completed successfully:', result);
}



/**
 * Validates swap parameters
 */
export function validateSwapParams(params: SwapParams): string | null {
  if (!params.accountId) return 'Account ID is required';
  if (!params.tokenIn) return 'Input token is required';
  if (!params.tokenOut) return 'Output token is required';
  if (!params.amountIn || parseFloat(params.amountIn) <= 0)
    return 'Amount must be greater than 0';
  if (params.slippageTolerance < 0.1 || params.slippageTolerance > 50)
    return 'Slippage must be between 0.1% and 50%';

  return null;
}
