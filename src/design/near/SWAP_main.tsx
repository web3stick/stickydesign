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
import { fetchAndStoreTokenList } from "../../ts/token_list_db";
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

  const loadAvailableTokens = async () => {
    setIsLoadingTokens(true);
    const tokens = await getAvailableTokens();
    setAvailableTokens(tokens);
    setIsLoadingTokens(false);

    if (tokens.length > 0) {
      const nearToken = tokens.find((t) => t.isNative);
      if (nearToken) {
        selectToken(nearToken, "in");
      }
      const dogshitToken = tokens.find(
        (t) => t.contract_id === "token.dogshit.near",
      );
      if (dogshitToken) {
        selectToken(dogshitToken, "out");
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
      <header>
        <h1>TOKEN SWAP</h1>
        <p>The most efficient way to trade tokens on NEAR.</p>
      </header>

      <div className="swap-container">
        <div className="swap-header">
          <h2 className="swap-title">Swap Tokens</h2>
        </div>

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

            <div className="token-dropdown">
              <button
                type="button"
                className="swap-token-selector"
                onClick={() => setIsDropdownOpenIn(!isDropdownOpenIn)}
              >
                {selectedTokenIn ? (
                  <>
                    <TokenIcon
                      icon={selectedTokenIn.metadata?.icon}
                      symbol={selectedTokenIn.displayName}
                      size="medium"
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
            </div>
          </div>

          <div className="swap-arrow-container">
            <button
              type="button"
              className="swap-arrow-button"
              onClick={handleSwitchTokens}
            >
              ↓
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
                onClick={() => setIsDropdownOpenOut(!isDropdownOpenOut)}
              >
                {selectedTokenOut ? (
                  <>
                    <TokenIcon
                      icon={selectedTokenOut.metadata?.icon}
                      symbol={selectedTokenOut.displayName}
                      size="medium"
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
      </div>
    </div>
  );
};
