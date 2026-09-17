import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function BarricadeIcon({ size = 32, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 8L7 5M20 8L17 5"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M4 19L7 16M20 19L17 16"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 9.5H21C21 9.5 21 9.5 21 9.5V14.5H3V9.5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path d="M6 9.5L9 14.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M10.5 9.5L13.5 14.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M15 9.5L18 14.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}
