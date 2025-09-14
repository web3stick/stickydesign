import { useState } from 'preact/hooks';

interface TokenIconProps {
  icon?: string;
  symbol: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const TokenIcon = ({ icon, symbol, size = 'medium', className = '' }: TokenIconProps) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(!!icon); // Only loading if we have an icon

  const sizeClasses = {
    small: 'w-6 h-6 text-xs',
    medium: 'w-8 h-8 text-sm',
    large: 'w-12 h-12 text-base',
  };

  const handleImageLoad = () => {
    console.log(`✅ Token icon loaded successfully for ${symbol}`);
    setImageLoading(false);
  };

  const handleImageError = () => {
    console.log(`❌ Token icon failed to load for ${symbol}, using fallback`);
    setImageError(true);
    setImageLoading(false);
  };

  // Show fallback if no icon, image failed to load, or still loading
  const showFallback = !icon || imageError;

  console.log(`🖼️ TokenIcon render - Symbol: ${symbol}, Icon: ${icon ? 'present' : 'none'}, ShowFallback: ${showFallback}`);

  return (
    <div className={`token-icon ${sizeClasses[size]} ${className}`}>
      {!showFallback && icon && (
        <img
          src={icon}
          alt={`${symbol} icon`}
          className="w-full h-full rounded-full object-cover"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ display: imageLoading ? 'none' : 'block' }}
        />
      )}
      {(showFallback || imageLoading) && (
        <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {symbol.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
};