import { useEffect } from "preact/hooks";
import "./SWAP_css.css";
import { TokenIcon } from "./SWAP_TokenIcon";
import {
  executeSwap,
  fetchSwapQuote,
  formatTokenAmount,
  getAvailableTokens,
  prepareSwapToken,
  type SimpleToken,
  type SwapQuote,
  type SwapToken,
  toRawAmount,
  validateSwapParams,
} from "./SWAP_swap_logic";
import { TokenDropdown } from "./SWAP_TokenDropdown";
import { fetchAndStoreTokenList } from "./SWAP_token_list_db";
import { useSwapStore } from "./swapStore";

interface SwapUIProps {
  // accountId is now managed by the store, so we don't need it as a prop
}

export const SwapUI = ({}: SwapUIProps) => {
  console.log('[SwapUI] Render');
  
  // Use Zustand store for state management
  const {
    accountId, // Get accountId directly from the store
    availableTokens,
    setAvailableTokens,
    selectedTokenIn,
    setSelectedTokenIn,
    selectedTokenOut,
    setSelectedTokenOut,
    isLoadingTokenIn,
    setIsLoadingTokenIn,
    isLoadingTokenOut,
    setIsLoadingTokenOut,
    inputAmount,
    setInputAmount,
    quote,
    setQuote,
    slippage,
    setSlippage,
    isLoading,
    setIsLoading,
    isLoadingTokens,
    setIsLoadingTokens,
    isDropdownOpenIn,
    setIsDropdownOpenIn,
    isDropdownOpenOut,
    setIsDropdownOpenOut,
    error,
    setError,
    success,
    setSuccess,
    resetSwapState
  } = useSwapStore();
  
  console.log('[SwapUI] accountId from store:', accountId);
  
  // Remove the useEffect that was trying to sync the prop with the store
  // The store is now the source of truth for accountId

  useEffect(() => {
    console.log('[SwapUI] Component mounted, fetching token list and loading tokens');
    fetchAndStoreTokenList();
    loadAvailableTokens();
  }, []);

  // Reset state and re-fetch data when accountId changes
  useEffect(() => {
    console.log('[SwapUI] accountId changed, resetting state and reloading tokens');
    // Reset token selections and quote when account changes
    resetSwapState();
    
    // Reload available tokens and set defaults
    loadAvailableTokens();
  }, [accountId]); // Re-run when accountId changes

  const loadAvailableTokens = async () => {
    console.log('[SwapUI] Loading available tokens');
    setIsLoadingTokens(true);
    const tokens = await getAvailableTokens();
    setAvailableTokens(tokens);
    setIsLoadingTokens(false);

    if (tokens.length > 0) {
      // Set NEAR as the default "from" token
      const nearToken = tokens.find((t) => t.isNative);
      if (nearToken) {
        selectToken(nearToken, "in");
      }
      
      // Set SHIT token as the default "to" token
      const shitToken = tokens.find(
        (t) => t.contract_id === "shit-1170.meme-cooking.near",
      );
      if (shitToken) {
        selectToken(shitToken, "out");
      } else if (!shitToken && !nearToken) {
        // Fallback to first available token if neither is found
        selectToken(tokens[0], "in");
        if (tokens.length > 1) {
          selectToken(tokens[1], "out");
        }
      }
    }
  };

  const selectToken = async (simpleToken: SimpleToken, type: "in" | "out") => {
    console.log('[SwapUI] Selecting token:', simpleToken, 'type:', type);
    if (type === "in") {
      setIsLoadingTokenIn(true);
    } else {
      setIsLoadingTokenOut(true);
    }

    try {
      // Only fetch balance if user is logged in
      // Use accountId from the store instead of the prop
      const swapToken = await prepareSwapToken(simpleToken, accountId || "");
      if (type === "in") {
        setSelectedTokenIn(swapToken);
      } else {
        setSelectedTokenOut(swapToken);
      }
    } catch (err) {
      setError("Failed to load token details.");
    } finally {
      if (type === "in") {
        setIsLoadingTokenIn(false);
      } else {
        setIsLoadingTokenOut(false);
      }
    }
  };

  const handleAmountChange = (value: string) => {
    if (!/^\d*\.?\d*$/.test(value)) return;
    setInputAmount(value);
    setQuote(null);
    if (value && parseFloat(value) > 0 && selectedTokenIn && selectedTokenOut) {
      debouncedFetchQuote(value);
    }
  };

  const handleMaxClick = () => {
    if (!selectedTokenIn) return;
    const maxAmount = formatTokenAmount(
      selectedTokenIn.actualBalance,
      selectedTokenIn.metadata.decimals,
    );
    setInputAmount(maxAmount);
    if (parseFloat(maxAmount) > 0) {
      debouncedFetchQuote(maxAmount);
    }
  };

  const handlePercentageClick = (percentage: number) => {
    if (!selectedTokenIn) return;
    
    // Convert balance to a number using the same logic as formatTokenAmount
    const balanceRaw = selectedTokenIn.actualBalance;
    const decimals = selectedTokenIn.metadata.decimals;
    const balance = parseFloat(balanceRaw) / Math.pow(10, decimals);
    
    // Calculate percentage amount
    const percentageAmount = (balance * percentage) / 100;
    
    // Format the amount properly to avoid floating point issues
    let formattedAmount: string;
    if (percentageAmount === 0) {
      formattedAmount = "0";
    } else if (percentageAmount < 0.000001) {
      formattedAmount = percentageAmount.toExponential(2);
    } else if (percentageAmount < 1) {
      formattedAmount = percentageAmount.toFixed(6).replace(/\.?0+$/, '');
    } else if (percentageAmount < 1000) {
      formattedAmount = percentageAmount.toFixed(4).replace(/\.?0+$/, '');
    } else {
      formattedAmount = percentageAmount.toLocaleString(undefined, {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
      });
    }
    
    setInputAmount(formattedAmount);
    if (percentageAmount > 0) {
      debouncedFetchQuote(formattedAmount);
    }
  };

  const handleTokenSelect = async (
    simpleToken: SimpleToken,
    type: "in" | "out",
  ) => {
    if (type === "in") {
      setIsDropdownOpenIn(false);
    } else {
      setIsDropdownOpenOut(false);
    }
    setQuote(null);
    await selectToken(simpleToken, type);
    if (inputAmount && parseFloat(inputAmount) > 0) {
      debouncedFetchQuote(inputAmount);
    }
  };

  const debouncedFetchQuote = (() => {
    let timeoutId: number;
    return (amount: string) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fetchQuoteData(amount), 500);
    };
  })();

  const fetchQuoteData = async (amount: string) => {
    if (
      !selectedTokenIn ||
      !selectedTokenOut ||
      !amount ||
      parseFloat(amount) <= 0
    )
      return;

    setIsLoading(true);
    setError("");

    try {
      const rawAmount = toRawAmount(amount, selectedTokenIn.metadata.decimals);
      const tokenIn = selectedTokenIn.isNative
        ? "near"
        : selectedTokenIn.contract_id;

      // Use accountId from the store instead of the prop
      const quoteData = await fetchSwapQuote(
        tokenIn,
        selectedTokenOut.contract_id,
        rawAmount,
        slippage,
        selectedTokenIn.metadata.decimals,
        accountId || undefined,
      );
      setQuote(quoteData);
    } catch (err) {
      setError("Failed to get swap quote. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwap = async () => {
    // Use accountId from the store instead of the prop
    if (
      !selectedTokenIn ||
      !selectedTokenOut ||
      !inputAmount ||
      !quote ||
      !accountId
    )
      return;

    const swapParams = {
      tokenIn: selectedTokenIn.isNative ? "near" : selectedTokenIn.contract_id,
      tokenOut: selectedTokenOut.contract_id,
      amountIn: toRawAmount(inputAmount, selectedTokenIn.metadata.decimals),
      // Use accountId from the store instead of the prop
      accountId,
      slippageTolerance: slippage,
    };

    const validationError = validateSwapParams(swapParams);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      await executeSwap(quote);
      setSuccess(
        `Swap completed! Swapped ${inputAmount} ${selectedTokenIn.displayName} for ${selectedTokenOut.displayName}.`,
      );
      setInputAmount("");
      setQuote(null);
    } catch (err) {
      setError(
        `Swap failed: ${err instanceof Error ? err.message : "Please try again."}`,
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchTokens = () => {
    const tempToken = selectedTokenIn;
    setSelectedTokenIn(selectedTokenOut);
    setSelectedTokenOut(tempToken);
    setInputAmount("");
    setQuote(null);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (isDropdownOpenIn || isDropdownOpenOut) {
        setIsDropdownOpenIn(false);
        setIsDropdownOpenOut(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isDropdownOpenIn, isDropdownOpenOut]);

  return (
    <>
      {error && <div className="swap-error">{error}</div>}
      {success && <div className="swap-success">{success}</div>}

      <div className="swap-form">
        <div className="swap-input-group">
          <div className="swap-input-header">
            <span className="swap-input-label">From</span>
            {/* Use accountId from the store instead of the prop */}
            {selectedTokenIn && accountId && (
              <button
                type="button"
                className="swap-balance swap-balance-clickable"
                onClick={handleMaxClick}
              >
                Balance:{" "}
                {formatTokenAmount(
                  selectedTokenIn.actualBalance,
                  selectedTokenIn.metadata.decimals,
                )}
              </button>
            )}
          </div>

          {/* Use accountId from the store instead of the prop */}
          {selectedTokenIn && accountId && (
            <div className="swap-percentage-buttons">
              <button 
                type="button" 
                className="swap-percentage-button"
                onClick={() => handlePercentageClick(25)}
              >
                25%
              </button>
              <button 
                type="button" 
                className="swap-percentage-button"
                onClick={() => handlePercentageClick(50)}
              >
                50%
              </button>
              <button 
                type="button" 
                className="swap-percentage-button"
                onClick={() => handlePercentageClick(75)}
              >
                75%
              </button>
              <button 
                type="button" 
                className="swap-percentage-button"
                onClick={() => handlePercentageClick(100)}
              >
                Max
              </button>
            </div>
          )}

          <div className="token-dropdown">
            <button
              type="button"
              className="swap-token-selector"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event from bubbling to document
                setIsDropdownOpenIn(!isDropdownOpenIn);
                // Close the other dropdown if it's open
                if (isDropdownOpenOut) setIsDropdownOpenOut(false);
              }}
            >
              {isLoadingTokenIn ? (
                "Loading..."
              ) : selectedTokenIn ? (
                <>
                  <TokenIcon
                    icon={selectedTokenIn.metadata?.icon}
                    symbol={selectedTokenIn.displayName}
                  />
                  {selectedTokenIn.displayName}
                </>
              ) : (
                "Select Token"
              )}
            </button>

            <TokenDropdown
              tokens={availableTokens}
              onSelect={(token) => handleTokenSelect(token, "in")}
              isOpen={isDropdownOpenIn}
              onClose={() => setIsDropdownOpenIn(false)}
            />
          </div>

          <div className="swap-amount-section">
            <input
              type="text"
              className="swap-amount-input"
              placeholder="0.0"
              value={inputAmount}
              onChange={(e) =>
                handleAmountChange((e.target as HTMLInputElement).value)
              }
            />
            {inputAmount && quote && quote.inputValueUsd ? (
              <div className="swap-amount-value">
                ≈ ${quote.inputValueUsd.toFixed(2)} USD
              </div>
            ) : null}
          </div>
        </div>

        <div className="swap-arrow-container">
          <button
            type="button"
            className="swap-arrow-button"
            onClick={handleSwitchTokens}
          >
            <div className="swap-arrow-icon" />
          </button>
        </div>

        <div className="swap-input-group">
          <div className="swap-input-header">
            <span className="swap-input-label">To</span>
          </div>

          <div className="token-dropdown">
            <button
              type="button"
              className="swap-token-selector"
              onClick={(e) => {
                e.stopPropagation(); // Prevent event from bubbling to document
                setIsDropdownOpenOut(!isDropdownOpenOut);
                // Close the other dropdown if it's open
                if (isDropdownOpenIn) setIsDropdownOpenIn(false);
              }}
            >
              {isLoadingTokenOut ? (
                "Loading..."
              ) : selectedTokenOut ? (
                <>
                  <TokenIcon
                    icon={selectedTokenOut.metadata?.icon}
                    symbol={selectedTokenOut.displayName}
                  />
                  {selectedTokenOut.displayName}
                </>
              ) : (
                "Select Token"
              )}
            </button>

            <TokenDropdown
              tokens={availableTokens}
              onSelect={(token) => handleTokenSelect(token, "out")}
              isOpen={isDropdownOpenOut}
              onClose={() => setIsDropdownOpenOut(false)}
            />
          </div>

          <div className="swap-amount-section">
            <input
              type="text"
              className="swap-amount-input swap-amount-input-readonly"
              placeholder="0.0"
              value={
                quote
                  ? formatTokenAmount(
                      quote.outputAmount,
                      selectedTokenOut?.metadata.decimals || 18,
                    )
                  : ""
              }
              readOnly
            />
            {quote && quote.outputValueUsd ? (
              <div className="swap-amount-value">
                ≈ ${quote.outputValueUsd.toFixed(2)} USD
              </div>
            ) : null}
          </div>
        </div>

        <div className="swap-settings">
          <span className="swap-slippage-label">Slippage Tolerance</span>
          <div>
            <input
              type="number"
              className="swap-slippage-input"
              value={slippage}
              onChange={(e) =>
                setSlippage(
                  parseFloat((e.target as HTMLInputElement).value) || 1.0,
                )
              }
              min="0.1"
              max="50"
              step="0.1"
            />
            <span>%</span>
          </div>
        </div>

        <button
          type="button"
          className="swap-button"
          onClick={handleSwap}
          disabled={
            isLoading ||
            isLoadingTokenIn ||
            isLoadingTokenOut ||
            !selectedTokenIn ||
            !selectedTokenOut ||
            !inputAmount ||
            parseFloat(inputAmount) <= 0 ||
            !quote ||
            // Use accountId from the store instead of the prop
            !accountId
          }
        >
          {isLoading ? "Processing..." : `Swap`}
        </button>
      </div>
    </>
  );
};