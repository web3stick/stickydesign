import { useEffect, useState } from "preact/hooks";
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
import NEAR_AUTH_BUTTON from "./near_auth_button";
import { useFastIntearAuth } from "./near.auth";
import { fetchAndStoreTokenList } from "./SWAP_token_list_db";
import { TokenDropdown } from "./SWAP_TokenDropdown";

export const Swap = () => {
  const { auth } = useFastIntearAuth();
  const accountId = auth.loggedIn ? auth.accountId : null;

  const [availableTokens, setAvailableTokens] = useState<SimpleToken[]>([]);
  const [selectedTokenIn, setSelectedTokenIn] = useState<SwapToken | null>(
    null,
  );
  const [selectedTokenOut, setSelectedTokenOut] = useState<SwapToken | null>(
    null,
  );
  const [isLoadingTokenIn, setIsLoadingTokenIn] = useState<boolean>(false);
  const [isLoadingTokenOut, setIsLoadingTokenOut] = useState<boolean>(false);
  const [inputAmount, setInputAmount] = useState<string>("");
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippage, setSlippage] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [isDropdownOpenIn, setIsDropdownOpenIn] = useState<boolean>(false);
  const [isDropdownOpenOut, setIsDropdownOpenOut] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");

  useEffect(() => {
    fetchAndStoreTokenList();
    loadAvailableTokens();
  }, []);

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

  const loadAvailableTokens = async () => {
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
    if (type === "in") {
      setIsLoadingTokenIn(true);
    } else {
      setIsLoadingTokenOut(true);
    }

    try {
      // Only fetch balance if user is logged in
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

  return (
    <div className="page swap-page">
      <div className="swap-container">
        {/*<div className="swap-header">
          <h2 className="swap-title">dex agg widget</h2>
        </div>*/}

        {error && <div className="swap-error">{error}</div>}
        {success && <div className="swap-success">{success}</div>}

        <div className="swap-form">
          <div className="swap-input-group">
            <div className="swap-input-header">
              <span className="swap-input-label">From</span>
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
              !accountId
            }
          >
            {isLoading ? "Processing..." : `Swap`}
          </button>
          <NEAR_AUTH_BUTTON />
        </div>
        <p>powered by intear</p>
      </div>
    </div>
  );
};
