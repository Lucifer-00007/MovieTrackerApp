/**
 * CastCarousel Component
 * Displays horizontally scrollable cast members with photos and character names
 * Limited to top 10 cast members by default
 * 
 * Requirements: 4.4, 4.5
 */

import { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
} from 'react-native';
import { Image } from 'expo-image';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, BorderRadius, Typography, ComponentTokens } from '@/constants/theme';
import type { CastMember } from '@/types/media';
import {
  getProfileUrl,
  getLimitedCast,
  shouldShowCast,
  generateCastAccessibilityLabel,
  MAX_CAST_DISPLAY,
} from './detail-utils';

const ITEM_WIDTH = ComponentTokens.cast.itemWidth;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

export interface CastCarouselProps {
  /** Array of cast members */
  cast: CastMember[];
  /** Maximum number of cast members to display (default: 10) */
  maxDisplay?: number;
  /** Test ID for testing */
  testID?: string;
}

export function CastCarousel({
  cast,
  maxDisplay = MAX_CAST_DISPLAY,
  testID,
}: CastCarouselProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const cardBackground = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');

  // Don't render if no cast
  if (!shouldShowCast(cast)) {
    return null;
  }

  const limitedCast = getLimitedCast(cast, maxDisplay);

  const renderCastMember = useCallback(
    ({ item }: { item: CastMember }) => {
      const profileUrl = getProfileUrl(item.profilePath);
      const accessibilityLabel = generateCastAccessibilityLabel(item);

      return (
        <View
          style={styles.castItem}
          accessibilityLabel={accessibilityLabel}
          testID={testID ? `${testID}-member-${item.id}` : undefined}
        >
          <View style={[styles.imageContainer, { backgroundColor: cardBorder }]}>
            {profileUrl ? (
              <Image
                source={{ uri: profileUrl }}
                style={styles.profileImage}
                contentFit="cover"
                transition={200}
                testID={testID ? `${testID}-member-${item.id}-image` : undefined}
              />
            ) : (
              <View 
                style={[styles.placeholder, { backgroundColor: cardBackground }]}
                testID={testID ? `${testID}-member-${item.id}-placeholder` : undefined}
              >
                <Text style={[styles.placeholderText, { color: textSecondary }]}>
                  {item.name.charAt(0)}
                </Text>
              </View>
            )}
          </View>
          
          <Text
            style={[styles.actorName, { color: textColor }]}
            numberOfLines={2}
            testID={testID ? `${testID}-member-${item.id}-name` : undefined}
          >
            {item.name}
          </Text>
          
          <Text
            style={[styles.characterName, { color: textSecondary }]}
            numberOfLines={2}
            testID={testID ? `${testID}-member-${item.id}-character` : undefined}
          >
            {item.character}
          </Text>
        </View>
      );
    },
    [textColor, textSecondary, cardBackground, cardBorder, testID]
  );

  return (
    <View style={styles.container} testID={testID}>
      <Text
        style={[styles.sectionTitle, { color: textColor }]}
        accessibilityRole="header"
      >
        Cast
      </Text>
      
      <FlatList
        data={limitedCast}
        renderItem={renderCastMember}
        keyExtractor={(item) => `cast-${item.id}`}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        getItemLayout={(_, index) => ({
          length: ITEM_WIDTH + Spacing.md,
          offset: (ITEM_WIDTH + Spacing.md) * index,
          index,
        })}
        testID={testID ? `${testID}-list` : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  castItem: {
    width: ITEM_WIDTH,
    marginRight: Spacing.md,
  },
  imageContainer: {
    width: ITEM_WIDTH,
    height: ITEM_HEIGHT,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
  },
  actorName: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  characterName: {
    fontSize: Typography.sizes.xs,
  },
});

export default CastCarousel;
