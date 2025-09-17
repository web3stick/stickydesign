import { useState, useMemo } from "preact/hooks";
import type { SimpleToken } from "./SWAP_swap_logic";
import { TokenIcon } from "./SWAP_TokenIcon";
import { TOP_TOKENS, TOP_TOKEN_CONTRACTS, getCachedTokenMetadata, isTopToken } from "./SWAP_top_tokens";

interface TokenDropdownProps {
  tokens: SimpleToken[];
  onSelect: (token: SimpleToken) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const TokenDropdown = ({
  tokens,
  onSelect,
  isOpen,
  onClose,
}: TokenDropdownProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTokens = useMemo(() => {
    if (!searchTerm) {
      // Separate top tokens and other tokens
      const topTokens: SimpleToken[] = [];
      const otherTokens: SimpleToken[] = [];
      
      // Create a set of top token contract IDs for fast lookup
      const topTokenIds = new Set(Object.values(TOP_TOKENS));
      
      tokens.forEach(token => {
        if (topTokenIds.has(token.contract_id)) {
          // Use the symbol from TOP_TOKENS for display
          const symbol = TOP_TOKEN_CONTRACTS[token.contract_id];
          
          // Use cached metadata if available
          const cachedMetadata = getCachedTokenMetadata(token.contract_id);
          
          topTokens.push({
            ...token,
            displayName: symbol || token.displayName,
            metadata: cachedMetadata || token.metadata
          });
        } else {
          otherTokens.push(token);
        }
      });
      
      // Sort top tokens in the order they appear in TOP_TOKENS
      const orderedTopTokens = Object.values(TOP_TOKENS)
        .map(contractId => topTokens.find(t => t.contract_id === contractId))
        .filter((token): token is SimpleToken => token !== undefined);
      
      return [...orderedTopTokens, ...otherTokens];
    }
    
    return tokens.filter(
      (token) =>
        token.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.contract_id.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [tokens, searchTerm]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="token-dropdown-menu">
      <div className="token-dropdown-search">
        <input
          type="text"
          placeholder="Search name or paste address"
          value={searchTerm}
          onInput={(e) => setSearchTerm((e.target as HTMLInputElement).value)}
          // Prevent click events from bubbling up to parent elements
          onClick={(e) => e.stopPropagation()}
        />
      </div>
      <div className="token-dropdown-list">
        {filteredTokens.map((token) => (
          <div
            key={token.contract_id}
            className={`token-dropdown-item ${isTopToken(token.contract_id) ? 'token-dropdown-item-top' : ''}`}
            onClick={(e) => {
              e.stopPropagation(); // Prevent event bubbling
              onSelect(token);
              onClose();
            }}
          >
            <TokenIcon icon={token.metadata?.icon} symbol={token.displayName} />
            <div className="token-dropdown-item-info">
              <div className="token-dropdown-item-symbol">
                {token.displayName}
                {isTopToken(token.contract_id) && (
                  <span className="token-dropdown-item-top-badge">⭐</span>
                )}
              </div>
              <div className="token-dropdown-item-contract">
                {token.contract_id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
