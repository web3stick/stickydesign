interface SwapMessagesProps {
  error: string;
  success: string;
}

export const SwapMessages = ({ error, success }: SwapMessagesProps) => {
  return (
    <>
      {error && <div className="swap-error">{error}</div>}
      {success && <div className="swap-success">{success}</div>}
    </>
  );
};