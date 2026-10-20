import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
}

const SignalIcon: FunctionComponent<Props> = ({ size = 30 }) => (
  <Svg width={`${size}`} height={`${size}`} viewBox="0 0 30 30" fill="none">
    <Path
      d="M20.3033 9.69667C23.2322 12.6256 23.2322 17.3743 20.3033 20.3033M9.6967 20.3032C6.76777 17.3743 6.76777 12.6256 9.6967 9.69662M6.16117 23.8388C1.27961 18.9572 1.27961 11.0427 6.16117 6.16113M23.8388 6.16119C28.7204 11.0427 28.7204 18.9573 23.8388 23.8389M17.5 15C17.5 16.3807 16.3807 17.5 15 17.5C13.6193 17.5 12.5 16.3807 12.5 15C12.5 13.6193 13.6193 12.5 15 12.5C16.3807 12.5 17.5 13.6193 17.5 15Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default SignalIcon;
