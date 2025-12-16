import React, { useMemo } from 'react';
import { PALETTE } from '../constants';

interface PixelTileProps {
  sprite?: string[];
  colorMap?: Record<string, string>;
  baseColor?: string;
  className?: string;
}

const PixelTile: React.FC<PixelTileProps> = ({ 
  sprite, 
  colorMap, 
  baseColor = PALETTE.TRANSPARENT,
  className = ""
}) => {

  const { pixels, width, height } = useMemo(() => {
    if (!sprite) return { pixels: null, width: 16, height: 16 };
    
    const h = sprite.length;
    const w = h > 0 ? sprite[0].length : 0;

    const renderedPixels = sprite.map((row, y) => (
      row.split('').map((char, x) => {
        let fill = baseColor;
        if (colorMap && colorMap[char]) {
          fill = colorMap[char];
        } else if (char !== '.') {
           // Fallback or explicit mapping can go here
           fill = baseColor;
        } else {
            return null; // Transparent
        }
        
        return (
          <rect 
            key={`${x}-${y}`} 
            x={x} 
            y={y} 
            width={1} 
            height={1} 
            fill={fill} 
          />
        );
      })
    ));

    return { pixels: renderedPixels, width: w, height: h };
  }, [sprite, colorMap, baseColor]);

  return (
    <svg 
      viewBox={`0 0 ${width} ${height}`} 
      width="100%" 
      height="100%" 
      className={`block ${className}`}
      style={{ imageRendering: 'pixelated' }}
    >
        {/* Background Base */}
        <rect x="0" y="0" width={width} height={height} fill={baseColor} />
        {pixels}
    </svg>
  );
};

export default PixelTile;