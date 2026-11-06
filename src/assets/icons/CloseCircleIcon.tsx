import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

/** A filled circle with a white ×; the counterpart of CheckCircleIcon. */
export function CloseCircleIcon({ size = 16, color = '#E5484D' }: IconProps): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Circle cx="8" cy="8" r="8" fill={color} />
      <Path d="M5.4 5.4L10.6 10.6M10.6 5.4L5.4 10.6" stroke="#FFFFFF" strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}
