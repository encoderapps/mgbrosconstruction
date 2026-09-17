import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function BriefcaseIcon({ size = 32, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M9 7V5.5C9 4.67157 9.67157 4 10.5 4H13.5C14.3284 4 15 4.67157 15 5.5V7"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Rect x="3.5" y="7" width="17" height="12" rx="2" stroke={color} strokeWidth={1.6} />
      <Path d="M3.5 12.5H20.5" stroke={color} strokeWidth={1.6} />
      <Rect x="10.5" y="11" width="3" height="3" rx="0.6" stroke={color} strokeWidth={1.4} />
    </Svg>
  );
}
