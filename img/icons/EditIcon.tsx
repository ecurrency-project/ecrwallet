import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
}

const EditIcon: FunctionComponent<Props> = ({ size = 30 }) => (
  <Svg width={`${size}`} height={`${size}`} viewBox="0 0 30 30" fill="none">
    <Path
      d="M15 25.0003H26.25M3.75 25.0003H5.84318C6.45466 25.0003 6.76039 25.0003 7.04811 24.9312C7.3032 24.87 7.54706 24.769 7.77075 24.6319C8.02304 24.4773 8.23923 24.2611 8.67161 23.8287L24.375 8.12528C25.4106 7.08975 25.4106 5.41082 24.375 4.37528C23.3395 3.33975 21.6606 3.33975 20.625 4.37528L4.92158 20.0787C4.4892 20.5111 4.27301 20.7273 4.1184 20.9796C3.98133 21.2033 3.88032 21.4471 3.81908 21.7022C3.75 21.9899 3.75 22.2957 3.75 22.9071V25.0003Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default EditIcon;
