import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function ChatIcon({ size = 18, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4.5 6.5C4.5 5.67157 5.17157 5 6 5H18C18.8284 5 19.5 5.67157 19.5 6.5V14.5C19.5 15.3284 18.8284 16 18 16H9L5.5 19V16H6C5.17157 16 4.5 15.3284 4.5 14.5V6.5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
