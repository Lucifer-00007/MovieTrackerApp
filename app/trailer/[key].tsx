/**
 * Fullscreen Trailer Screen
 * Plays YouTube trailers in fullscreen mode
 * Returns to previous screen when video ends or user closes
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */

import { useCallback } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

import { TrailerPlayer } from '@/components/media';

export default function TrailerScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();

  // Handle video end - return to detail page
  const handleVideoEnd = useCallback(() => {
    router.back();
  }, []);

  // Handle close button press
  const handleClose = useCallback(() => {
    router.back();
  }, []);

  // Handle error
  const handleError = useCallback((error: string) => {
    console.error('Trailer playback error:', error);
  }, []);

  // If no video key, show error state via TrailerPlayer
  if (!key) {
    return (
      <View style={styles.container}>
        <StatusBar hidden />
        <TrailerPlayer
          videoKey=""
          autoPlay={false}
          onClose={handleClose}
          testID="trailer-player"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <TrailerPlayer
        videoKey={key}
        autoPlay={true}
        onVideoEnd={handleVideoEnd}
        onClose={handleClose}
        onError={handleError}
        testID="trailer-player"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
});
