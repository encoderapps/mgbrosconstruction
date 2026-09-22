import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function PhoneIcon({ size = 14, color = '#3B6FD4' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 4H9.5L11 8L8.9 9.6C9.7 11.4 11.1 12.8 12.9 13.6L14.5 11.5L18.5 13V16C18.5 17.1046 17.6046 18 16.5 18C10.4249 18 5.5 13.0751 5.5 7C5.5 5.89543 5.66421 5.10457 6.5 4Z"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
