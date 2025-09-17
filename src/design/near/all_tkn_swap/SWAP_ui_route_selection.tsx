interface SwapRouteSelectionProps {
  quote: any;
  selectedRouteIndex: number;
  handleRouteSelect: (index: number) => void;
  selectedTokenOut: any;
  formatTokenAmount: (amount: string, decimals: number) => string;
}

export const SwapRouteSelection = ({
  quote,
  selectedRouteIndex,
  handleRouteSelect,
  selectedTokenOut,
  formatTokenAmount
}: SwapRouteSelectionProps) => {
  if (!quote || !quote.availableRoutes || quote.availableRoutes.length <= 1) {
    return null;
  }

  return (
    <div className="swap-route-selection">
      <div className="swap-route-header">Select Route</div>
      <div className="swap-route-options">
        {quote.availableRoutes.map((route: any, index: number) => (
          <div
            key={index}
            className={`swap-route-option ${
              selectedRouteIndex === index ? "selected" : ""
            }`}
            onClick={() => handleRouteSelect(index)}
          >
            <div className="swap-route-info">
              {route.dex_id || "Unknown DEX"}
            </div>
            <div className="swap-route-details">
              <span className="swap-route-amount">
                {formatTokenAmount(
                  route.estimated_amount?.amount_out || "0",
                  selectedTokenOut?.metadata.decimals || 18,
                )}{" "}
                {selectedTokenOut?.displayName}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};