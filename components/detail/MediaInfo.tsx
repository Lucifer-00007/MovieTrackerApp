/**
 * MediaInfo Component
 * Displays key media information in a horizontal card layout
 * Shows budget/revenue for movies, seasons/episodes for TV
 * 
 * Requirements: 4.2
 */

import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius, ComponentTokens } from '@/constants/theme';
import type { MediaDetails } from '@/types/media';

export interface MediaInfoProps {
  /** Media details */
  details: MediaDetails;
  /** Test ID */
  testID?: string;
}

interface InfoCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconColor: string;
  textColor: string;
  secondaryColor: string;
  backgroundColor: string;
}

function InfoCard({ icon, label, value, iconColor, textColor, secondaryColor, backgroundColor }: InfoCardProps) {
  return (
    <View style={[styles.infoCard, { backgroundColor }]}>
      <Ionicons name={icon} size={20} color={iconColor} style={styles.cardIcon} />
      <Text style={[styles.cardLabel, { color: secondaryColor }]}>{label}</Text>
      <Text style={[styles.cardValue, { color: textColor }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function formatCurrency(amount: number): string {
  if (amount >= 1_000_000_000) {
    return `$${(amount / 1_000_000_000).toFixed(1)}B`;
  }
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount}`;
}

function formatDate(dateString: string): string {
  if (!dateString) return 'TBA';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function MediaInfo({ details, testID }: MediaInfoProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'backgroundSecondary');

  const infoCards: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }[] = [];

  // Common info
  if (details.releaseDate) {
    infoCards.push({
      icon: 'calendar-outline',
      label: 'Release',
      value: formatDate(details.releaseDate),
    });
  }

  if (details.status) {
    infoCards.push({
      icon: 'radio-button-on-outline',
      label: 'Status',
      value: details.status,
    });
  }

  // Movie-specific info
  if (details.mediaType === 'movie') {
    if (details.runtime) {
      const hours = Math.floor(details.runtime / 60);
      const mins = details.runtime % 60;
      infoCards.push({
        icon: 'time-outline',
        label: 'Runtime',
        value: hours > 0 ? `${hours}h ${mins}m` : `${mins}m`,
      });
    }

    if (details.budget && details.budget > 0) {
      infoCards.push({
        icon: 'wallet-outline',
        label: 'Budget',
        value: formatCurrency(details.budget),
      });
    }

    if (details.revenue && details.revenue > 0) {
      infoCards.push({
        icon: 'trending-up-outline',
        label: 'Revenue',
        value: formatCurrency(details.revenue),
      });
    }
  }

  // TV-specific info
  if (details.mediaType === 'tv') {
    if (details.numberOfSeasons) {
      infoCards.push({
        icon: 'layers-outline',
        label: 'Seasons',
        value: `${details.numberOfSeasons}`,
      });
    }

    if (details.numberOfEpisodes) {
      infoCards.push({
        icon: 'play-circle-outline',
        label: 'Episodes',
        value: `${details.numberOfEpisodes}`,
      });
    }
  }

  // Language info
  if (details.spokenLanguages && details.spokenLanguages.length > 0) {
    infoCards.push({
      icon: 'language-outline',
      label: 'Language',
      value: details.spokenLanguages[0].englishName || details.spokenLanguages[0].name,
    });
  }

  // Country info
  if (details.productionCountries && details.productionCountries.length > 0) {
    infoCards.push({
      icon: 'globe-outline',
      label: 'Country',
      value: details.productionCountries[0].name,
    });
  }

  if (infoCards.length === 0) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Information</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {infoCards.map((card, index) => (
          <InfoCard
            key={`${card.label}-${index}`}
            icon={card.icon}
            label={card.label}
            value={card.value}
            iconColor={tintColor}
            textColor={textColor}
            secondaryColor={textSecondary}
            backgroundColor={cardBackground}
          />
        ))}
      </ScrollView>
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  infoCard: {
    minWidth: ComponentTokens.detailPage.infoCardMinWidth,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
  },
  cardIcon: {
    marginBottom: Spacing.xs,
  },
  cardLabel: {
    fontSize: Typography.sizes.xs,
    marginBottom: Spacing.xs,
  },
  cardValue: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    textAlign: 'center',
  },
});

export default MediaInfo;
