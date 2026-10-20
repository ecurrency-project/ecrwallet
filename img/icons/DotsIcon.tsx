import React, { FunctionComponent } from 'react';
import { Svg, Path } from 'react-native-svg';

interface Props {
  size?: number;
}

const DotsIcon: FunctionComponent<Props> = ({ size = 30 }) => (
  <Svg width={`${size}`} height={`${size}`} viewBox="0 0 30 30" fill="none">
    <Path
      d="M15 7.5C15.6904 7.5 16.25 6.94036 16.25 6.25C16.25 5.55964 15.6904 5 15 5C14.3096 5 13.75 5.55964 13.75 6.25C13.75 6.94036 14.3096 7.5 15 7.5Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M15 16.25C15.6904 16.25 16.25 15.6904 16.25 15C16.25 14.3096 15.6904 13.75 15 13.75C14.3096 13.75 13.75 14.3096 13.75 15C13.75 15.6904 14.3096 16.25 15 16.25Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M15 25C15.6904 25 16.25 24.4404 16.25 23.75C16.25 23.0596 15.6904 22.5 15 22.5C14.3096 22.5 13.75 23.0596 13.75 23.75C13.75 24.4404 14.3096 25 15 25Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M23.75 7.5C24.4404 7.5 25 6.94036 25 6.25C25 5.55964 24.4404 5 23.75 5C23.0596 5 22.5 5.55964 22.5 6.25C22.5 6.94036 23.0596 7.5 23.75 7.5Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M23.75 16.25C24.4404 16.25 25 15.6904 25 15C25 14.3096 24.4404 13.75 23.75 13.75C23.0596 13.75 22.5 14.3096 22.5 15C22.5 15.6904 23.0596 16.25 23.75 16.25Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M23.75 25C24.4404 25 25 24.4404 25 23.75C25 23.0596 24.4404 22.5 23.75 22.5C23.0596 22.5 22.5 23.0596 22.5 23.75C22.5 24.4404 23.0596 25 23.75 25Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M6.25 7.5C6.94036 7.5 7.5 6.94036 7.5 6.25C7.5 5.55964 6.94036 5 6.25 5C5.55964 5 5 5.55964 5 6.25C5 6.94036 5.55964 7.5 6.25 7.5Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M6.25 16.25C6.94036 16.25 7.5 15.6904 7.5 15C7.5 14.3096 6.94036 13.75 6.25 13.75C5.55964 13.75 5 14.3096 5 15C5 15.6904 5.55964 16.25 6.25 16.25Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
    <Path
      d="M6.25 25C6.94036 25 7.5 24.4404 7.5 23.75C7.5 23.0596 6.94036 22.5 6.25 22.5C5.55964 22.5 5 23.0596 5 23.75C5 24.4404 5.55964 25 6.25 25Z"
      stroke="#EC0000"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </Svg>
);

export default DotsIcon;
