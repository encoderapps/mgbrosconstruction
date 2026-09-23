import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function BagIcon({ size = 18, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8 8V6.5C8 4.567 9.567 3 11.5 3H12.5C14.433 3 16 4.567 16 6.5V8"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M5.5 8H18.5L19.5 19.5C19.5 20.3284 18.8284 21 18 21H6C5.17157 21 4.5 20.3284 4.5 19.5L5.5 8Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
