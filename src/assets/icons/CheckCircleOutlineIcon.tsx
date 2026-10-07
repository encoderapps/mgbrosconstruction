import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

/** An open circle with a tick that breaks out through the gap at its top right. */
export function CheckCircleOutlineIcon({ size = 18, color = '#2E7D32' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21 11.17V12a9 9 0 1 1-5.34-8.23"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M21 4.5L12 13.51L9 10.51" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
