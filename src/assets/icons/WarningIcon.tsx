import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function WarningIcon({ size = 18, color = '#E69500' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10.3 4.3L2.9 17.5C2.2 18.8 3.1 20.3 4.6 20.3H19.4C20.9 20.3 21.8 18.8 21.1 17.5L13.7 4.3C13 3 11 3 10.3 4.3Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Line x1="12" y1="9" x2="12" y2="13.5" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Circle cx="12" cy="16.6" r="0.9" fill={color} />
    </Svg>
  );
}
