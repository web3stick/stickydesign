interface SwapButtonsProps {
  handleSwap: () => void;
  isLoading: boolean;
  isLoadingTokenIn: boolean;
  isLoadingTokenOut: boolean;
  selectedTokenIn: any;
  selectedTokenOut: any;
  inputAmount: string;
  quote: any;
  accountId: string | null;
}

export const SwapButtons = ({
  handleSwap,
  isLoading,
  isLoadingTokenIn,
  isLoadingTokenOut,
  selectedTokenIn,
  selectedTokenOut,
  inputAmount,
  quote,
  accountId
}: SwapButtonsProps) => {
  return (
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
      {isLoading ? "Processing..." : `SWAP`}
    </button>
  );
};