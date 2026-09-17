import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
}

export function LockIcon({ width = 22, height = 14, color = '#9C9084' }: IconProps): React.JSX.Element {
  return (
    <Svg width={width} height={height} viewBox="0 0 22 14" fill="none">
      <Path
        d="M8 5V3.6C8 2.16406 9.11929 1 10.5 1C11.8807 1 13 2.16406 13 3.6V5"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="5.5" y="5" width="10" height="8" rx="1.6" stroke={color} strokeWidth={1.4} />
      <Circle cx="10.5" cy="9" r="0.9" fill={color} />
    </Svg>
  );
}
