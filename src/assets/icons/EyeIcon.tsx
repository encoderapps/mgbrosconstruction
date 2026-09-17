import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

interface IconProps {
  width?: number;
  height?: number;
  color?: string;
  visible?: boolean;
}

export function EyeIcon({
  width = 20,
  height = 14,
  color = '#9C9084',
  visible = false,
}: IconProps): React.JSX.Element {
  return (
    <Svg width={width} height={height} viewBox="0 0 20 14" fill="none">
      <Path
        d="M1 7C3.2 3 6.4 1.2 10 1.2C13.6 1.2 16.8 3 19 7C16.8 11 13.6 12.8 10 12.8C6.4 12.8 3.2 11 1 7Z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Circle cx="10" cy="7" r="2.4" stroke={color} strokeWidth={1.4} />
      {!visible && <Line x1="2" y1="12.5" x2="18" y2="1.5" stroke={color} strokeWidth={1.4} strokeLinecap="round" />}
    </Svg>
  );
}
