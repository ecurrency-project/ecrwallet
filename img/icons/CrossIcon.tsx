import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
}

const CrossIcon: FunctionComponent<Props> = ({ size = 24, color }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18M6 6L18 18" stroke={color} stroke-linecap="round" stroke-linejoin="round" />
  </Svg>
);

export default CrossIcon;
