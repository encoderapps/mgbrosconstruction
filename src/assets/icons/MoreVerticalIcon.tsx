import React from 'react';
import Svg, { Circle } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function MoreVerticalIcon({ size = 20, color = '#6B625B' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx="12" cy="5" r="1.8" />
      <Circle cx="12" cy="12" r="1.8" />
      <Circle cx="12" cy="19" r="1.8" />
    </Svg>
  );
}
