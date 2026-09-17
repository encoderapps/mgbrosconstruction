import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function LoginIcon({ size = 18, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="9" y="3" width="6" height="3" rx="1" stroke={color} strokeWidth={1.6} />
      <Path
        d="M9 4.5H6.5C5.67157 4.5 5 5.17157 5 6V19C5 19.8284 5.67157 20.5 6.5 20.5H17.5C18.3284 20.5 19 19.8284 19 19V6C19 5.17157 18.3284 4.5 17.5 4.5H15"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8.5 13L10.5 15L15.5 10"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
