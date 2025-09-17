import * as near from "fastintear";

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