import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function CalendarIcon({ size = 16, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3.5" y="5" width="17" height="16" rx="2" stroke={color} strokeWidth={1.6} />
      <Path d="M3.5 9.5H20.5" stroke={color} strokeWidth={1.6} />
      <Path d="M8 3V6.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M16 3V6.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
