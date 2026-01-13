import Animated from 'react-native-reanimated';

import { ANIMATION_DURATION } from '@/constants/animations';
import { DIMENSIONS } from '@/constants/layout';

export function HelloWave() {
  return (
    <Animated.Text
      style={{
        fontSize: DIMENSIONS.ICON_LG,
        lineHeight: DIMENSIONS.ICON_XL,
        marginTop: -6,
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationIterationCount: 4,
        animationDuration: `${ANIMATION_DURATION.WAVE_DURATION}ms`,
      }}>
      👋
    </Animated.Text>
  );
}
