import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
}

const SwitchVerticalIcon: FunctionComponent<Props> = ({ size = 30 }) => (
  <Svg width={`${size}`} height={`${size}`} viewBox="0 0 30 30" fill="none">
    <Path
      d="M17 4V20M17 20L13 16M17 20L21 16M7 20V4M7 4L3 8M7 4L11 8"
      stroke="black"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default SwitchVerticalIcon;
