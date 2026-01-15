/**
 * GuestStarsSection Component
 * Displays episode guest stars in a horizontal carousel
 */

import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Image } from 'expo-image';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { PlaceholderImages, BLURHASH_PLACEHOLDER } from '@/constants/images';
import { getImageUrl } from './episode-utils';
import type { GuestStar } from './types';

export interface GuestStarsSectionProps {
  guestStars: GuestStar[];
  testID?: string;
}

export function GuestStarsSection({ guestStars, testID }: GuestStarsSectionProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');

  if (guestStars.length === 0) return null;

  return (
    <View style={styles.container} testID={testID}>
      <View style={styles.header}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Guest Stars</Text>
        <Text style={[styles.count, { color: textSecondary }]}>
          {guestStars.length} appearances
        </Text>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {guestStars.map((star) => {
          const profileUrl = getImageUrl(star.profilePath, 'w185');
          return (
            <View 
              key={star.id} 
              style={[styles.card, { backgroundColor: cardColor, borderColor: cardBorder }]}
            >
              <View style={styles.imageContainer}>
                {profileUrl ? (
                  <Image
                    source={profileUrl === 'placeholder' ? PlaceholderImages.profile : { uri: profileUrl }}
                    style={styles.image}
                    contentFit="cover"
                    placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.imagePlaceholder, { backgroundColor: backgroundSecondary }]}>
                    <Text style={[styles.initial, { color: textSecondary }]}>
                      {star.name.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: textColor }]} numberOfLines={2}>
                  {star.name}
                </Text>
                <View style={styles.characterRow}>
                  <Text style={[styles.asLabel, { color: textSecondary }]}>as</Text>
                  <Text style={[styles.character, { color: tintColor }]} numberOfLines={2}>
                    {star.character}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
  },
  count: {
    fontSize: Typography.sizes.sm,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  card: {
    width: 140,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    height: 160,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
  },
  info: {
    padding: Spacing.sm,
  },
  name: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
  },
  characterRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
  },
  asLabel: {
    fontSize: Typography.sizes.xs,
    fontStyle: 'italic',
  },
  character: {
    fontSize: Typography.sizes.xs,
    fontWeight: Typography.weights.medium,
    flex: 1,
  },
});

export default GuestStarsSection;
