import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
}

const EyeClosedIcon: FunctionComponent<Props> = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M15 18L14.278 14.75" stroke={color} stroke-linecap="round" stroke-linejoin="round" />
    <Path
      d="M2 8C2.74835 10.0508 4.10913 11.8219 5.8979 13.0733C7.68667 14.3247 9.81695 14.9959 12 14.9959C14.1831 14.9959 16.3133 14.3247 18.1021 13.0733C19.8909 11.8219 21.2516 10.0508 22 8"
      stroke={color}
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path d="M20 15L18.274 12.95" stroke={color} stroke-linecap="round" stroke-linejoin="round" />
    <Path d="M4 15L5.726 12.95" stroke={color} stroke-linecap="round" stroke-linejoin="round" />
    <Path d="M9 18L9.722 14.75" stroke={color} stroke-linecap="round" stroke-linejoin="round" />
  </Svg>
);

export default EyeClosedIcon;
