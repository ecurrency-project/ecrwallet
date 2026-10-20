import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
}

const ArrowDownLeftIcon: FunctionComponent<Props> = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M17 7L7 17M7 7V17H17" stroke={color} stroke-linecap="round" stroke-linejoin="round"/>
  </Svg>
);

export default ArrowDownLeftIcon;
