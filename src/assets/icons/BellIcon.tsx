import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function BellIcon({ size = 18, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6 10.5C6 7.46243 8.46243 5 11.5 5H12.5C15.5376 5 18 7.46243 18 10.5V13.5L19.5 16.5H4.5L6 13.5V10.5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 19C10.3333 19.6667 11 20 12 20C13 20 13.6667 19.6667 14 19" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
