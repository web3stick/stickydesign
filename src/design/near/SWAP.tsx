import { useEffect, useState } from 'preact/hooks';
import '../../css/swap.css';
import { DOGSHIT_TOKEN } from '../../ts/config';
import WalletIcon from '../../img/wallet.svg';
import DogshitImg from '../../img/dogshit_img.png';
import { getAuthStatus, login } from '../../ts/profile_near_auth_login_logout';
import { TokenIcon } from '../components/TokenIcon';
import {
  executeSwap,
  fetchSwapQuote,
  formatTokenAmount,
  prepareSimpleTokens,
  prepareSwapToken,
  type SimpleToken,
  type SwapQuote,
  type SwapToken,
  selectRoute,
  toRawAmount,
  validateSwapParams,
} from '../../ts/swap';

export const Swap = () => {
  const [accountId, setAccountId] = useState<string>('');
  const [availableTokens, setAvailableTokens] = useState<SimpleToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<SwapToken | null>(null);
  const [isLoadingSelectedToken, setIsLoadingSelectedToken] =
    useState<boolean>(false);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [quote, setQuote] = useState<SwapQuote | null>(null);
  const [slippage, setSlippage] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingTokens, setIsLoadingTokens] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Check if user is logged in
  useEffect(() => {
    let lastAccountId = '';

    const checkAuth = () => {
      const authState = getAuthStatus();
      if (authState.isSignedIn && authState.accountId) {
        // Only load tokens if account changed
        if (authState.accountId !== lastAccountId) {
          setAccountId(authState.accountId);
          loadUserTokens(authState.accountId);
          lastAccountId = authState.accountId;
        }
      } else {
        // Only clear if we had an account before
        if (lastAccountId) {
          setAccountId('');
          setAvailableTokens([]);
          setSelectedToken(null);
          lastAccountId = '';
        }
      }
    };

    checkAuth();

    // Listen for wallet connection changes
    const interval = setInterval(checkAuth, 1000);
    return () => clearInterval(interval);
  }, []);



  const loadUserTokens = async (account: string) => {
    setIsLoadingTokens(true);
    setError('');

    try {
      console.log('Loading tokens for account:', account);
      const tokens = await prepareSimpleTokens(account, false); // Don't fetch metadata upfront for faster loading
      console.log('Tokens loaded:', tokens);
      setAvailableTokens(tokens);

      // Set native NEAR as default if available, otherwise wNEAR, otherwise first token
      const nativeNear = tokens.find((t) => t.contract_id === 'near' && t.isNative);
      const wNear = tokens.find((t) => t.contract_id === 'wrap.near');

      console.log('Native NEAR found:', nativeNear);
      console.log('wNEAR found:', wNear);

      if (nativeNear) {
        console.log('Selecting native NEAR as default');
        await selectToken(nativeNear, account);
      } else if (wNear) {
        console.log('Selecting wNEAR as default');
        await selectToken(wNear, account);
      } else if (tokens.length > 0) {
        console.log('Selecting first token as default:', tokens[0]);
        await selectToken(tokens[0], account);
      }
    } catch (err) {
      setError('Failed to load your tokens. Please try again.');
      console.error('Error loading tokens:', err);
    } finally {
      setIsLoadingTokens(false);
    }
  };

  const selectToken = async (simpleToken: SimpleToken, account: string) => {
    setIsLoadingSelectedToken(true);
    try {
      const swapToken = await prepareSwapToken(simpleToken, account);
      setSelectedToken(swapToken);
    } catch (err) {
      setError('Failed to load token details.');
      console.error('Error loading token details:', err);
    } finally {
      setIsLoadingSelectedToken(false);
    }
  };

  const handleAmountChange = (value: string) => {
    // Only allow numbers and decimal point
    if (!/^\d*\.?\d*$/.test(value)) return;

    setInputAmount(value);
    setQuote(null);

    // Auto-fetch quote if amount is valid
    if (value && parseFloat(value) > 0 && selectedToken) {
      debouncedFetchQuote(value);
    }
  };

  const handleMaxClick = () => {
    if (!selectedToken) return;

    const maxAmount = formatTokenAmount(
      selectedToken.actualBalance,
      selectedToken.metadata.decimals,
    );
    setInputAmount(maxAmount);

    if (parseFloat(maxAmount) > 0) {
      debouncedFetchQuote(maxAmount);
    }
  };

  const handleTokenSelect = async (simpleToken: SimpleToken) => {
    setIsDropdownOpen(false);
    setQuote(null);

    if (accountId) {
      await selectToken(simpleToken, accountId);

      if (inputAmount && parseFloat(inputAmount) > 0) {
        debouncedFetchQuote(inputAmount);
      }
    }
  };

  const debouncedFetchQuote = (() => {
    let timeoutId: NodeJS.Timeout;
    return (amount: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fetchQuoteData(amount), 500);
    };
  })();

  const fetchQuoteData = async (amount: string) => {
    if (!selectedToken || !amount || parseFloat(amount) <= 0) return;

    setIsLoading(true);
    setError('');

    try {
      const rawAmount = toRawAmount(amount, selectedToken.metadata.decimals);
      // For native NEAR, use "near" as the token_in - the DEX aggregator handles wrapping
      const tokenIn = selectedToken.isNative ? 'near' : selectedToken.contract_id;

      console.log(`Fetching quote for ${tokenIn} -> ${DOGSHIT_TOKEN}, amount: ${rawAmount}`);

      const quoteData = await fetchSwapQuote(
        tokenIn,
        DOGSHIT_TOKEN,
        rawAmount,
        slippage,
        selectedToken.metadata.decimals,
        accountId, // Pass the logged-in account ID as trader_account_id
      );
      setQuote(quoteData);
    } catch (err) {
      setError('Failed to get swap quote. Please try again.');
      console.error('Error fetching quote:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRouteSelect = (routeIndex: number) => {
    if (!quote) return;

    const updatedQuote = selectRoute(quote, routeIndex);
    setQuote(updatedQuote);
  };

  const handleSwap = async () => {
    if (!selectedToken || !inputAmount || !quote || !accountId) return;

    const swapParams = {
      tokenIn: selectedToken.isNative ? 'near' : selectedToken.contract_id,
      tokenOut: DOGSHIT_TOKEN,
      amountIn: toRawAmount(inputAmount, selectedToken.metadata.decimals),
      accountId,
      slippageTolerance: slippage,
    };

    const validationError = validateSwapParams(swapParams);
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Execute the swap transaction using FastINTEAR
      // The DEX aggregator handles native NEAR wrapping and storage deposits automatically
      await executeSwap(quote);

      setSuccess(
        `Swap completed! Swapped ${inputAmount} ${selectedToken.displayName} for DOGSHIT.`,
      );

      // Reset form
      setInputAmount('');
      setQuote(null);

      // Reload tokens after successful swap
      setTimeout(() => {
        loadUserTokens(accountId);
      }, 2000);
    } catch (err) {
      setError(
        `Swap failed: ${err instanceof Error ? err.message : 'Please try again.'}`,
      );
      console.error('Swap error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!accountId) {
    return (
      <div className="page swap-page">
        <header>
          <h1>TOKEN SWAP</h1>
          <p>dogshit scooping made quick and efficient.</p>
        </header>

        <div className="swap-container">
          <SwapWalletConnectCard />
        </div>
      </div>
    );
  }

  if (isLoadingTokens && availableTokens.length === 0) {
    return (
      <div className="page swap-page">
        <header>
          <h1>TOKEN SWAP</h1>
          <p>dogshit scooping made quick and efficient.</p>
        </header>

        <div className="swap-container">
          <div className="swap-loading">
            <div className="swap-spinner"></div>
            Loading your tokens...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page swap-page">
      <header>
        <h1>TOKEN SWAP</h1>
        <p>dogshit scooping made quick and efficient.</p>
      </header>

      <div className="swap-container">
        <div className="swap-header">
          <h2 className="swap-title">Swap to DOGSHIT</h2>
          <p className="swap-subtitle">
            Convert your tokens to the ultimate meme coin
          </p>
        </div>

        {error && <div className="swap-error">{error}</div>}
        {success && <div className="swap-success">{success}</div>}

        <div className="swap-form">
          {/* From Token Input */}
          <div className="swap-input-group">
            <div className="swap-input-header">
              <span className="swap-input-label">From</span>
              {selectedToken && !isLoadingSelectedToken && (
                <button
                  type="button"
                  className="swap-balance swap-balance-clickable"
                  onClick={handleMaxClick}
                >
                  Balance:{' '}
                  {formatTokenAmount(
                    selectedToken.actualBalance,
                    selectedToken.metadata.decimals,
                  )}
                </button>
              )}
              {isLoadingSelectedToken && (
                <span className="swap-balance">Loading balance...</span>
              )}
            </div>

            {/* Token Selector */}
            <div className="token-dropdown">
              <button
                type="button"
                className="swap-token-selector"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              >
                {selectedToken ? (
                  <>
                    <TokenIcon
                      icon={selectedToken.metadata?.icon}
                      symbol={selectedToken.displayName}
                      size="medium"
                      className="swap-token-icon"
                    />
                    <div className="swap-token-info">
                      <div className="swap-token-name">
                        {selectedToken.displayName}
                      </div>
                      <div className="swap-token-contract">
                        {selectedToken.contract_id}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="swap-token-info">
                    <div className="swap-token-name">Select Token</div>
                  </div>
                )}
                <span className="swap-dropdown-arrow swap-token-selector-arrow">
                  ▼
                </span>
              </button>

              {isDropdownOpen && (
                <div className="token-dropdown-menu">
                  {isLoadingTokens ? (
                    <div className="token-dropdown-item">
                      <div className="swap-loading">
                        <div className="swap-spinner"></div>
                        Loading tokens...
                      </div>
                    </div>
                  ) : availableTokens.length === 0 ? (
                    <div className="token-dropdown-item">
                      <span>No tokens available</span>
                    </div>
                  ) : (
                    availableTokens.map((token) => (
                      <button
                        type="button"
                        key={token.contract_id}
                        className="token-dropdown-item"
                        onClick={() => handleTokenSelect(token)}
                      >
                        <TokenIcon
                          icon={token.metadata?.icon}
                          symbol={token.displayName}
                          size="small"
                          className="token-dropdown-item-icon"
                        />
                        <div className="token-dropdown-item-info">
                          <div className="token-dropdown-item-symbol">
                            {token.displayName}
                          </div>
                          <div className="token-dropdown-item-name">
                            {token.contract_id}
                          </div>
                          <div className="token-dropdown-item-balance">
                            {formatTokenAmount(token.balance, 18)}
                          </div>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Amount Input */}
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
              {/* Input Value Display */}
              {selectedToken &&
                inputAmount &&
                selectedToken.priceUsd &&
                parseFloat(inputAmount) > 0 && (
                  <div className="swap-value-display">
                    ≈ $
                    {(parseFloat(inputAmount) * selectedToken.priceUsd).toFixed(
                      2,
                    )}{' '}
                    USD
                  </div>
                )}
            </div>
          </div>

          {/* To Token (DOGSHIT) */}
          <div className="swap-input-group">
            <div className="swap-input-header">
              <span className="swap-input-label">To</span>
            </div>

            <div className="swap-token-selector swap-token-selector-readonly">
              <TokenIcon
                icon={DogshitImg}
                symbol="DOGSHIT"
                size="medium"
                className="swap-token-icon"
              />
              <div className="swap-token-info">
                <div className="swap-token-name">DOGSHIT</div>
                <div className="swap-token-contract">
                  dogshit-1408.meme-cooking.near
                </div>
              </div>
            </div>

            <div className="swap-amount-section">
              <input
                type="text"
                className="swap-amount-input swap-amount-input-readonly"
                placeholder="0.0"
                value={quote ? formatTokenAmount(quote.outputAmount, 18) : ''}
                readOnly
              />
              {/* Output Value Display */}
              {quote?.outputValueUsd && (
                <div className="swap-value-display">
                  ≈ ${quote.outputValueUsd.toFixed(2)} USD
                </div>
              )}
            </div>
          </div>

          {/* Quote Details */}
          {quote && (
            <div className="swap-quote-section">
              <div className="swap-quote-header">
                <span className="swap-quote-title">Quote Details</span>
                <button
                  type="button"
                  className="swap-quote-refresh"
                  onClick={() => inputAmount && fetchQuoteData(inputAmount)}
                >
                  Refresh
                </button>
              </div>

              <div className="swap-quote-details">
                <div className="swap-quote-row">
                  <span className="swap-quote-label">DEX</span>
                  <span className="swap-quote-value">
                    {quote.selectedRoute?.dex_id || 'Unknown'}
                  </span>
                </div>
                {quote.availableRoutes && quote.availableRoutes.length > 1 && (
                  <div className="swap-route-selection">
                    <div className="swap-quote-label">Available Routes:</div>
                    <div className="swap-route-options">
                      {quote.availableRoutes.map((route, index) => (
                        <button
                          type="button"
                          key={`${route.dex_id}-${index}`}
                          className={`swap-route-option ${quote.selectedRouteIndex === index ? 'selected' : ''}`}
                          onClick={() => handleRouteSelect(index)}
                        >
                          <div className="route-dex">{route.dex_id}</div>
                          <div className="route-output">
                            {formatTokenAmount(
                              route.estimated_amount?.amount_out || '0',
                              18,
                            )}{' '}
                            DOGSHIT
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {quote.inputValueUsd && quote.outputValueUsd && (
                  <div className="swap-quote-row">
                    <span className="swap-quote-label">Value Difference</span>
                    <span
                      className={`swap-quote-value ${quote.inputValueUsd > quote.outputValueUsd ? 'negative' : 'positive'}`}
                    >
                      $
                      {Math.abs(
                        quote.inputValueUsd - quote.outputValueUsd,
                      ).toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Settings */}
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
              <span
                style={{
                  marginLeft: '0.25rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                }}
              >
                %
              </span>
            </div>
          </div>

          {/* Swap Button */}
          <button
            type="button"
            className="swap-button"
            onClick={handleSwap}
            disabled={
              isLoading ||
              isLoadingSelectedToken ||
              !selectedToken ||
              !inputAmount ||
              parseFloat(inputAmount) <= 0 ||
              !quote
            }
          >
            {isLoading ? (
              <div className="swap-loading">
                <div className="swap-spinner"></div>
                Processing...
              </div>
            ) : (
              `Swap ${selectedToken?.displayName || ''} for DOGSHIT`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const SwapWalletConnectCard = () => {
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await login();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="swap-wallet-connect">
      <div className="swap-wallet-connect-card">
        <div className="swap-wallet-connect-icon">
          <img src={WalletIcon} alt="Wallet" width="48" height="48" />
        </div>

        <h2 className="swap-wallet-connect-title">Connect Your Wallet</h2>
        <p className="swap-wallet-connect-description">
          Connect your NEAR wallet to start swapping tokens for DOGSHIT.
          You'll need a wallet to view your token balances and execute swaps.
        </p>

        <button
          type="button"
          className="swap-wallet-connect-button"
          onClick={handleConnect}
          disabled={isConnecting}
        >
          {isConnecting ? (
            <div className="swap-loading">
              <div className="swap-spinner"></div>
              Connecting...
            </div>
          ) : (
            <>
              <img src={WalletIcon} alt="Wallet" width="20" height="20" />
              Connect NEAR Wallet
            </>
          )}
        </button>

        <div className="swap-wallet-connect-features">
          <div className="swap-wallet-feature">
            <span className="swap-wallet-feature-icon">🔒</span>
            <span>Secure connection</span>
          </div>
          <div className="swap-wallet-feature">
            <span className="swap-wallet-feature-icon">⚡</span>
            <span>Fast transactions</span>
          </div>
          <div className="swap-wallet-feature">
            <span className="swap-wallet-feature-icon">💰</span>
            <span>View token balances</span>
          </div>
        </div>
      </div>
    </div>
  );
};
