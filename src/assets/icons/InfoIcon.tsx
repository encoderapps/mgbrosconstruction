import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function InfoIcon({ size = 16, color = '#6B625B' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.6} />
      <Line x1="12" y1="11" x2="12" y2="16.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx="12" cy="7.7" r="0.9" fill={color} />
    </Svg>
  );
}
