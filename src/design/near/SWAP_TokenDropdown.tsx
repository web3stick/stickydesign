import { useState, useMemo } from "preact/hooks";
import type { SimpleToken } from "./SWAP_swap_logic";
import { TokenIcon } from "./SWAP_TokenIcon";

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
      return tokens;
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
            className="token-dropdown-item"
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
