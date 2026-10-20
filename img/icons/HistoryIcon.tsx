import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color: string;
}

const HistoryIcon: FunctionComponent<Props> = ({ size = 48, color }) => (
  <Svg width={`${size}`} height={`${size}`} viewBox="0 0 48 48" fill="none">
    <Path
      d="M6 24C6 27.5601 7.05568 31.0402 9.03355 34.0003C11.0114 36.9603 13.8226 39.2675 17.1117 40.6298C20.4008 41.9922 24.02 42.3487 27.5116 41.6541C31.0033 40.9596 34.2106 39.2453 36.7279 36.7279C39.2453 34.2106 40.9596 31.0033 41.6541 27.5116C42.3487 24.02 41.9922 20.4008 40.6298 17.1117C39.2675 13.8226 36.9603 11.0114 34.0003 9.03355C31.0402 7.05568 27.5601 6 24 6C18.9679 6.01893 14.1379 7.98245 10.52 11.48L6 16M6 16V6M6 16H16M24 14V24L32 28"
      stroke={`${color}`}
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default HistoryIcon;
