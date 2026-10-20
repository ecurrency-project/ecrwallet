import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
}

const ArrowLeftIcon: FunctionComponent<Props> = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5L5 12L12 19M5 12H19" stroke={color} stroke-linecap="round" stroke-linejoin="round"/>
  </Svg>
);

export default ArrowLeftIcon;
