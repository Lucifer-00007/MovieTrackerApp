/**
 * ProductionInfo Component
 * Displays production companies, countries, and languages
 * 
 * Requirements: 4.2
 */

import { StyleSheet, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import type { MediaDetails } from '@/types/media';

export interface ProductionInfoProps {
  /** Media details */
  details: MediaDetails;
  /** Test ID */
  testID?: string;
}

interface InfoRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  iconColor: string;
  textColor: string;
  secondaryColor: string;
}

function InfoRow({ icon, label, value, iconColor, textColor, secondaryColor }: InfoRowProps) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.labelContainer}>
        <Ionicons name={icon} size={18} color={iconColor} style={styles.icon} />
        <Text style={[styles.label, { color: secondaryColor }]}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: textColor }]} numberOfLines={2}>{value}</Text>
    </View>
  );
}

export function ProductionInfo({ details, testID }: ProductionInfoProps) {
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const tintColor = useThemeColor({}, 'tint');
  const cardBackground = useThemeColor({}, 'backgroundSecondary');
  const borderColor = useThemeColor({}, 'border');

  const hasProductionCountries = details.productionCountries && details.productionCountries.length > 0;
  const hasLanguages = details.spokenLanguages && details.spokenLanguages.length > 0;

  if (!hasProductionCountries && !hasLanguages) {
    return null;
  }

  return (
    <View style={styles.container} testID={testID}>
      <Text style={[styles.sectionTitle, { color: textColor }]}>Production Details</Text>
      
      <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
        {hasProductionCountries && (
          <InfoRow
            icon="globe-outline"
            label="Countries"
            value={details.productionCountries!.map(c => c.name).join(', ')}
            iconColor={tintColor}
            textColor={textColor}
            secondaryColor={textSecondary}
          />
        )}
        
        {hasLanguages && (
          <>
            {hasProductionCountries && <View style={[styles.divider, { backgroundColor: borderColor }]} />}
            <InfoRow
              icon="language-outline"
              label="Languages"
              value={details.spokenLanguages!.map(l => l.englishName || l.name).join(', ')}
              iconColor={tintColor}
              textColor={textColor}
              secondaryColor={textSecondary}
            />
          </>
        )}

        {details.status && (
          <>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <InfoRow
              icon="radio-button-on-outline"
              label="Status"
              value={details.status}
              iconColor={tintColor}
              textColor={textColor}
              secondaryColor={textSecondary}
            />
          </>
        )}

        {details.originalTitle && details.originalTitle !== details.title && (
          <>
            <View style={[styles.divider, { backgroundColor: borderColor }]} />
            <InfoRow
              icon="text-outline"
              label="Original Title"
              value={details.originalTitle}
              iconColor={tintColor}
              textColor={textColor}
              secondaryColor={textSecondary}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  sectionTitle: {
    fontSize: Typography.sizes.lg,
    fontWeight: Typography.weights.bold,
    marginBottom: Spacing.sm,
  },
  card: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    marginRight: Spacing.sm,
  },
  label: {
    fontSize: Typography.sizes.sm,
  },
  value: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    flex: 1,
    textAlign: 'right',
    marginLeft: Spacing.md,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
  },
});

export default ProductionInfo;
