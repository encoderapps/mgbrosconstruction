import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function ClipboardCheckIcon({ size = 18, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="5.5" y="5" width="13" height="16" rx="1.6" stroke={color} strokeWidth={1.6} />
      <Path
        d="M9 4.5C9 3.67157 9.67157 3 10.5 3H13.5C14.3284 3 15 3.67157 15 4.5V5.5H9V4.5Z"
        stroke={color}
        strokeWidth={1.6}
      />
      <Path
        d="M9 13L11 15L15.5 10"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
