/**
 * CrewSection Component
 * Displays episode crew members with profile images
 */

import { StyleSheet, View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { PlaceholderImages, BLURHASH_PLACEHOLDER } from '@/constants/images';
import { getImageUrl } from './episode-utils';
import type { CrewMember } from './types';

export interface CrewSectionProps {
  crew: CrewMember[];
  testID?: string;
}

export function CrewSection({ crew, testID }: CrewSectionProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const cardColor = useThemeColor({}, 'card');
  const cardBorder = useThemeColor({}, 'cardBorder');
  const backgroundSecondary = useThemeColor({}, 'backgroundSecondary');

  if (crew.length === 0) return null;

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Crew</Text>
      <View style={styles.grid}>
        {crew.map((member) => {
          const profileUrl = getImageUrl(member.profilePath, 'w185');
          return (
            <View 
              key={member.id} 
              style={[styles.card, { backgroundColor: cardColor, borderColor: cardBorder }]}
            >
              <View style={styles.profileContainer}>
                {profileUrl ? (
                  <Image
                    source={profileUrl === 'placeholder' ? PlaceholderImages.profile : { uri: profileUrl }}
                    style={styles.profile}
                    contentFit="cover"
                    placeholder={{ blurhash: BLURHASH_PLACEHOLDER }}
                    transition={200}
                    cachePolicy="memory-disk"
                  />
                ) : (
                  <View style={[styles.profilePlaceholder, { backgroundColor: backgroundSecondary }]}>
                    <Ionicons name="person" size={24} color={textSecondary} />
                  </View>
                )}
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: textColor }]} numberOfLines={1}>
                  {member.name}
                </Text>
                <Text style={[styles.job, { color: tintColor }]} numberOfLines={1}>
                  {member.job}
                </Text>
                <Text style={[styles.department, { color: textSecondary }]} numberOfLines={1}>
                  {member.department}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  grid: {
    gap: Spacing.sm,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  profileContainer: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  profile: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  name: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.semibold,
    marginBottom: 2,
  },
  job: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginBottom: 2,
  },
  department: {
    fontSize: Typography.sizes.xs,
  },
});

export default CrewSection;
