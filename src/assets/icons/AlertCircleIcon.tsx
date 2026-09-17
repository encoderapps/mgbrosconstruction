import React from 'react';
import Svg, { Circle, Line } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function AlertCircleIcon({ size = 18, color = '#E5484D' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.6} />
      <Line x1="12" y1="7.5" x2="12" y2="13" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx="12" cy="16.3" r="0.9" fill={color} />
    </Svg>
  );
}
