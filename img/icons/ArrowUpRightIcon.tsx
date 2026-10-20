import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
}

const ArrowUpRightIcon: FunctionComponent<Props> = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 17V7H7M17 7L7 17" stroke={color} stroke-linecap="round" stroke-linejoin="round"/>
  </Svg>
);

export default ArrowUpRightIcon;
