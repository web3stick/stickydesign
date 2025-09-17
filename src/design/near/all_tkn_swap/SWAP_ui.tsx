import { useEffect } from "preact/hooks";
import "./SWAP_ui.css";
import "./SWAP_ui_dropdown.css";
import { TokenIcon } from "./SWAP_TokenIcon";
import { ArrowDownUp } from "lucide-preact";
import {
  executeSwap,
  fetchSwapQuote,
  fetchSwapQuoteForOutput,
  formatTokenAmount,
  getAvailableTokens,
  prepareSwapToken,
  selectRoute,
  type SimpleToken,
  toRawAmount,
  validateSwapParams,
} from "./SWAP_swap_logic";
import { TokenDropdown } from "./SWAP_TokenDropdown";
import { fetchAndStoreTokenList } from "./SWAP_token_list_db";
import { useSwapStore } from "./swapStore";
import { SwapMessages } from "./SWAP_ui_messages";
import { SwapButtons } from "./SWAP_ui_buttons";
import { SwapSettings } from "./SWAP_ui_settings";
import { SwapRouteSelection } from "./SWAP_ui_route_selection";
import { TOP_TOKENS } from "./SWAP_top_tokens";

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
    outputAmount,
    setOutputAmount,
    quote,
    setQuote,
    slippage,
    setSlippage,
    selectedRouteIndex,
    setSelectedRouteIndex,
    isLoading,
    setIsLoading,
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
      // Only set default tokens if none are already selected
      const tokenIn = useSwapStore.getState().selectedTokenIn;
      const tokenOut = useSwapStore.getState().selectedTokenOut;
      
      if (!tokenIn) {
        // Set NEAR as the default "from" token
        const nearToken = tokens.find((t) => t.isNative);
        if (nearToken) {
          await selectToken(nearToken, "in");
        }
      }
      
      if (!tokenOut) {
        // Set SHIT token as the default "to" token (from our top tokens)
        const shitToken = tokens.find(
          (t) => t.contract_id === TOP_TOKENS.SHIT,
        );
        if (shitToken) {
          await selectToken(shitToken, "out");
        } else if (!shitToken && !tokenIn) {
          // Fallback to first available token if neither is found
          await selectToken(tokens[0], "in");
          if (tokens.length > 1) {
            await selectToken(tokens[1], "out");
          }
        }
      }
    }
    
    // Clear output amount when tokens are loaded
    setOutputAmount("");
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
    setOutputAmount(""); // Clear output when input is changed
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
    setOutputAmount(""); // Clear output when input is changed
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
    setOutputAmount(""); // Clear output when input is changed
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
    
    // Clear output amount when tokens change
    if (type === "in") {
      setOutputAmount("");
    } else if (type === "out") {
      setOutputAmount("");
    }
    
    await selectToken(simpleToken, type);
    if ((inputAmount && parseFloat(inputAmount) > 0) || (outputAmount && parseFloat(outputAmount) > 0)) {
      if (inputAmount && parseFloat(inputAmount) > 0) {
        debouncedFetchQuote(inputAmount);
      } else if (outputAmount && parseFloat(outputAmount) > 0) {
        debouncedFetchQuoteForOutput(outputAmount);
      }
    }
  };

  const debouncedFetchQuote = (() => {
    let timeoutId: number;
    return (amount: string) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fetchQuoteData(amount), 500);
    };
  })();

  const debouncedFetchQuoteForOutput = (() => {
    let timeoutId: number;
    return (amount: string) => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => fetchQuoteDataForOutput(amount), 500);
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

  const fetchQuoteDataForOutput = async (amount: string) => {
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
      const rawAmount = toRawAmount(amount, selectedTokenOut.metadata.decimals);
      const tokenOut = selectedTokenOut.isNative
        ? "near"
        : selectedTokenOut.contract_id;

      // Use accountId from the store instead of the prop
      const quoteData = await fetchSwapQuoteForOutput(
        selectedTokenIn.contract_id,
        tokenOut,
        rawAmount,
        slippage,
        selectedTokenOut.metadata.decimals,
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
    const tempAmount = inputAmount;
    
    setSelectedTokenIn(selectedTokenOut);
    setSelectedTokenOut(tempToken);
    
    // Swap the amounts instead of clearing them
    setInputAmount(outputAmount);
    setOutputAmount(tempAmount);
    
    // Clear the quote as it's no longer valid
    setQuote(null);
  };

  const handleRouteSelect = (index: number) => {
    console.log('[SwapUI] Selecting route index:', index);
    if (quote && quote.availableRoutes && index < quote.availableRoutes.length) {
      const updatedQuote = selectRoute(quote, index);
      setQuote(updatedQuote);
      setSelectedRouteIndex(index);
    }
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
      <SwapMessages error={error} success={success} />

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
              value={quote && outputAmount ? formatTokenAmount(
                quote.inputAmount,
                selectedTokenIn?.metadata.decimals || 18,
              ) : inputAmount}
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
          <ArrowDownUp 
            className="swap-arrow-icon" 
            size={16} 
            onClick={handleSwitchTokens}
          />
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
              className="swap-amount-input"
              placeholder="0.0"
              value={quote ? formatTokenAmount(
                quote.outputAmount,
                selectedTokenOut?.metadata.decimals || 18,
              ) : outputAmount}
              onChange={(e) => {
                const value = (e.target as HTMLInputElement).value;
                setOutputAmount(value);
                setInputAmount(""); // Clear input when output is changed
                setQuote(null);
                if (value && parseFloat(value) > 0 && selectedTokenIn && selectedTokenOut) {
                  debouncedFetchQuoteForOutput(value);
                }
              }}
            />
            {quote && quote.outputValueUsd ? (
              <div className="swap-amount-value">
                ≈ ${quote.outputValueUsd.toFixed(2)} USD
              </div>
            ) : null}
          </div>
        </div>

        <SwapSettings 
          slippage={slippage}
          setSlippage={setSlippage}
        />

        <SwapRouteSelection 
          quote={quote}
          selectedRouteIndex={selectedRouteIndex}
          handleRouteSelect={handleRouteSelect}
          selectedTokenOut={selectedTokenOut}
          formatTokenAmount={formatTokenAmount}
        />

        <SwapButtons 
          handleSwap={handleSwap}
          isLoading={isLoading}
          isLoadingTokenIn={isLoadingTokenIn}
          isLoadingTokenOut={isLoadingTokenOut}
          selectedTokenIn={selectedTokenIn}
          selectedTokenOut={selectedTokenOut}
          inputAmount={inputAmount}
          quote={quote}
          accountId={accountId}
        />
      </div>
    </>
  );
};