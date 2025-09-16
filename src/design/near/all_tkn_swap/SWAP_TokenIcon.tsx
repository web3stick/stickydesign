import { useState } from "preact/hooks";

interface TokenIconProps {
  icon?: string;
  symbol: string;
  className?: string;
}

export const TokenIcon = ({ icon, symbol, className = "" }: TokenIconProps) => {
  const [imageError, setImageError] = useState(false);

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className={`token-icon ${className}`}>
      {icon && !imageError ? (
        <img
          src={icon}
          alt={`${symbol} icon`}
          className="token-icon-image"
          onError={handleImageError}
        />
      ) : (
        <div className="token-icon-fallback">
          {symbol.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};
