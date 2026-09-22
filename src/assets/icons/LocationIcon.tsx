import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function LocationIcon({ size = 14, color = '#3B6FD4' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21C12 21 19 14.6 19 10C19 6.13401 15.866 3 12 3C8.13401 3 5 6.13401 5 10C5 14.6 12 21 12 21Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="10" r="2.5" stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}
