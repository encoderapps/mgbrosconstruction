import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function UserIcon({ size = 32, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="3.75" stroke={color} strokeWidth={1.6} />
      <Path
        d="M4.5 20C5.5 16.2 8.3 14.5 12 14.5C15.7 14.5 18.5 16.2 19.5 20"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
