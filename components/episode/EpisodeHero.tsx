/**
 * EpisodeHero Component
 * Displays episode still image with play button and series info overlay
 */

import { StyleSheet, View, Pressable, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography } from '@/constants/theme';
import { SOLID_COLORS, OVERLAY_COLORS } from '@/constants/colors';
import { PlaceholderImages, BLURHASH_PLACEHOLDER } from '@/constants/images';
import { getImageUrl } from './episode-utils';

export interface EpisodeHeroProps {
  stillPath: string | null;
  seriesTitle: string;
  seasonNumber: number;
  episodeNumber: number;
  onPlayPress: () => void;
  testID?: string;
}

export function EpisodeHero({
  stillPath,
  seriesTitle,
  seasonNumber,
  episodeNumber,
  onPlayPress,
  testID,
}: EpisodeHeroProps) {
  const tintColor = useThemeColor({}, 'tint');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');
  const textSecondary = useThemeColor({}, 'textSecondary');

  const stillUrl = getImageUrl(stillPath, 'w780');

  return (
    <View style={styles.container} testID={testID}>
      {stillUrl ? (
        <Image
          source={stillUrl === 'placeholder' ? PlaceholderImages.backdrop : { uri: stillUrl }}
          style={styles.image}
          contentFit="cover"
          placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
          transition={300}
          priority="high"
          cachePolicy="memory-disk"
        />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: backgroundSecondary }]}>
          <Ionicons name="film-outline" size={64} color={textSecondary} />
        </View>
      )}
      
      <LinearGradient
        colors={['transparent', OVERLAY_COLORS.BLACK_70, OVERLAY_COLORS.BLACK_95]}
        style={styles.gradient}
        locations={[0, 0.6, 1]}
      />

      <Pressable
        onPress={onPlayPress}
        style={({ pressed }) => [styles.playButton, { opacity: pressed ? 0.8 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="Play episode"
      >
        <View style={[styles.playButtonInner, { backgroundColor: tintColor }]}>
          <Ionicons name="play" size={32} color={SOLID_COLORS.WHITE} style={styles.playIcon} />
        </View>
      </Pressable>

      <View style={styles.content}>
        <Text style={styles.seriesTitle} numberOfLines={1}>
          {seriesTitle}
        </Text>
        <Text style={styles.episodeLabel}>
          Season {seasonNumber} • Episode {episodeNumber}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 280,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  playButton: {
    position: 'absolute',
    top: '40%',
    left: '50%',
    marginLeft: -35,
    marginTop: -35,
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 4,
  },
  content: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  seriesTitle: {
    color: SOLID_COLORS.WHITE,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    marginBottom: Spacing.xs,
  },
  episodeLabel: {
    color: OVERLAY_COLORS.WHITE_70,
    fontSize: Typography.sizes.sm,
  },
});

export default EpisodeHero;
