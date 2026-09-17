import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function CheckCircleIcon({ size = 16, color = '#4CAF50' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="8" fill={color} />
      <Path
        d="M4.8 8.2L6.8 10.2L11.2 5.6"
        stroke="#FFFFFF"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
