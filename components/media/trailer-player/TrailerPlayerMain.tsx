/**
 * Main TrailerPlayer Component
 * Entry point that switches between mock and real player
 * 
 * Requirements: 5.1, 5.2
 */

import { MockTrailerPlayer } from './MockTrailerPlayer';
import { RealTrailerPlayer } from './RealTrailerPlayer';
import type { TrailerPlayerProps } from './types';

/** Check if mock data mode is enabled */
function isMockDataMode(): boolean {
  return process.env.EXPO_PUBLIC_USE_MOCK_DATA === 'true';
}

export function TrailerPlayer(props: TrailerPlayerProps) {
  if (isMockDataMode()) {
    return (
      <MockTrailerPlayer
        onClose={props.onClose}
        onVideoEnd={props.onVideoEnd}
        testID={props.testID}
      />
    );
  }

  return <RealTrailerPlayer {...props} />;
}