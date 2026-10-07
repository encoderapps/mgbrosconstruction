import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function RulerIcon({ size = 16, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4.5 4.5V19.5H19.5L4.5 4.5Z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
      <Path d="M4.5 9.5H6.5M4.5 13H7.5M4.5 16.5H6.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M8.5 15.5H12L8.5 12V15.5Z" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
    </Svg>
  );
}
