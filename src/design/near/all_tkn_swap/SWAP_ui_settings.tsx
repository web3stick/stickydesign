interface SwapSettingsProps {
  slippage: number;
  setSlippage: (slippage: number) => void;
}

export const SwapSettings = ({ slippage, setSlippage }: SwapSettingsProps) => {
  return (
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
  );
};