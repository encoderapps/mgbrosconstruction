import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function DocumentIcon({ size = 32, color = '#84726C' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 3.5H14L18 7.5V19.5C18 20.0523 17.5523 20.5 17 20.5H7C6.44772 20.5 6 20.0523 6 19.5V4.5C6 3.94772 6.44772 3.5 7 3.5Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M14 3.5V7.5H18" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M9 12.5H15" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M9 15.5H15" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M9 9.5H11" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}
