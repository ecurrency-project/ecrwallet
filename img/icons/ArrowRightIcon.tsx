import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
}

const ArrowRightIcon: FunctionComponent<Props> = ({ size = 20, color }) => (
  <Svg width={size} height={size} viewBox="0 0 20 20" fill="none">
    <Path d="M7.5 15L12.5 10L7.5 5" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  </Svg>
);

export default ArrowRightIcon;
