import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { SimpleToken, SwapToken, SwapQuote } from './SWAP_swap_logic';

interface SwapState {
  // Authentication
  accountId: string | null;
  setAccountId: (accountId: string | null) => void;
  
  // Tokens
  availableTokens: SimpleToken[];
  setAvailableTokens: (tokens: SimpleToken[]) => void;
  
  selectedTokenIn: SwapToken | null;
  setSelectedTokenIn: (token: SwapToken | null) => void;
  
  selectedTokenOut: SwapToken | null;
  setSelectedTokenOut: (token: SwapToken | null) => void;
  
  // Swap parameters
  inputAmount: string;
  setInputAmount: (amount: string) => void;
  
  outputAmount: string;
  setOutputAmount: (amount: string) => void;
  
  quote: SwapQuote | null;
  setQuote: (quote: SwapQuote | null) => void;
  
  slippage: number;
  setSlippage: (slippage: number) => void;
  
  // Route selection
  selectedRouteIndex: number;
  setSelectedRouteIndex: (index: number) => void;
  
  // UI states
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  
  isLoadingTokens: boolean;
  setIsLoadingTokens: (loading: boolean) => void;
  
  isLoadingTokenIn: boolean;
  setIsLoadingTokenIn: (loading: boolean) => void;
  
  isLoadingTokenOut: boolean;
  setIsLoadingTokenOut: (loading: boolean) => void;
  
  isDropdownOpenIn: boolean;
  setIsDropdownOpenIn: (open: boolean) => void;
  
  isDropdownOpenOut: boolean;
  setIsDropdownOpenOut: (open: boolean) => void;
  
  error: string;
  setError: (error: string) => void;
  
  success: string;
  setSuccess: (success: string) => void;
  
  // Actions
  resetSwapState: () => void;
}

export const useSwapStore = create<SwapState>()(
  devtools((set) => ({
    // Authentication
    accountId: null,
    setAccountId: (accountId) => {
      console.log('[SwapStore] Setting accountId to:', accountId);
      set({ accountId });
    },
    
    // Tokens
    availableTokens: [],
    setAvailableTokens: (availableTokens) => set({ availableTokens }),
    
    selectedTokenIn: null,
    setSelectedTokenIn: (selectedTokenIn) => set({ selectedTokenIn }),
    
    selectedTokenOut: null,
    setSelectedTokenOut: (selectedTokenOut) => set({ selectedTokenOut }),
    
    // Swap parameters
    inputAmount: '',
    setInputAmount: (inputAmount) => set({ inputAmount }),
    
    outputAmount: '',
    setOutputAmount: (outputAmount) => set({ outputAmount }),
    
    quote: null,
    setQuote: (quote) => set({ quote }),
    
    slippage: 1.0,
    setSlippage: (slippage) => set({ slippage }),
    
    // Route selection
    selectedRouteIndex: 0,
    setSelectedRouteIndex: (selectedRouteIndex) => set({ selectedRouteIndex }),
    
    // UI states
    isLoading: false,
    setIsLoading: (isLoading) => set({ isLoading }),
    
    isLoadingTokens: false,
    setIsLoadingTokens: (isLoadingTokens) => set({ isLoadingTokens }),
    
    isLoadingTokenIn: false,
    setIsLoadingTokenIn: (isLoadingTokenIn) => set({ isLoadingTokenIn }),
    
    isLoadingTokenOut: false,
    setIsLoadingTokenOut: (isLoadingTokenOut) => set({ isLoadingTokenOut }),
    
    isDropdownOpenIn: false,
    setIsDropdownOpenIn: (isDropdownOpenIn) => set({ isDropdownOpenIn }),
    
    isDropdownOpenOut: false,
    setIsDropdownOpenOut: (isDropdownOpenOut) => set({ isDropdownOpenOut }),
    
    error: '',
    setError: (error) => set({ error }),
    
    success: '',
    setSuccess: (success) => set({ success }),
    
    // Actions
    resetSwapState: () => {
      console.log('[SwapStore] Resetting swap state');
      set({
        selectedTokenIn: null,
        selectedTokenOut: null,
        inputAmount: '',
        outputAmount: '',
        quote: null,
        error: '',
        success: '',
        isLoading: false,
        isLoadingTokenIn: false,
        isLoadingTokenOut: false,
        selectedRouteIndex: 0, // Reset route selection
      });
    },
  }))
);