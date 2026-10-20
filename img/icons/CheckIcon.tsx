import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
}

const CheckIcon: FunctionComponent<Props> = ({ size = 96, color }) => (
  <Svg width={size} height={size} viewBox="0 0 96 96" fill="none">
    <Path d="M72 24L28 68L8 48M88 40L58 70L52 64" stroke={color} stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  </Svg>
);

export default CheckIcon;
