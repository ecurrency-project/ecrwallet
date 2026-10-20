import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
}

const TranslateIcon: FunctionComponent<Props> = ({ size = 30 }) => (
  <Svg width={`${size}`} height={`${size}`} viewBox="0 0 30 30" fill="none">
    <Path
      d="M16.1413 21.25H25.1087M16.1413 21.25L13.75 26.25M16.1413 21.25L19.7229 13.7613C20.0115 13.1578 20.1558 12.8561 20.3532 12.7608C20.5249 12.6779 20.7251 12.6779 20.8968 12.7608C21.0942 12.8561 21.2385 13.1578 21.5271 13.7613L25.1087 21.25M25.1087 21.25L27.5 26.25M2.5 6.25H10M10 6.25H14.375M10 6.25V3.75M14.375 6.25H17.5M14.375 6.25C13.7548 9.94661 12.3157 13.2952 10.2069 16.1055M12.5 17.5C11.7343 17.156 10.9533 16.6776 10.2069 16.1055M10.2069 16.1055C8.51628 14.8097 7.00345 13.0333 6.25 11.25M10.2069 16.1055C8.20107 18.7787 5.58929 20.9648 2.5 22.5"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default TranslateIcon;
