/**
 * GDPR Consent Modal Component
 * First-launch consent dialog for privacy compliance
 * 
 * Requirements: 19.2
 * - Request consent for analytics tracking (GDPR compliance)
 * - Persist consent to preferences
 */

import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { useLocalization } from '@/hooks/use-localization';
import { Colors, Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS } from '@/constants/colors';

interface GdprConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
  isLoading?: boolean;
}

export function GdprConsentModal({
  visible,
  onAccept,
  onDecline,
  isLoading = false,
}: GdprConsentModalProps) {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];
  const { t } = useLocalization();
  const [showDetails, setShowDetails] = useState(false);

  const handleAccept = () => {
    if (isLoading) return;
    onAccept();
  };

  const handleDecline = () => {
    if (isLoading) return;
    
    Alert.alert(
      t('gdpr.declineTitle'),
      t('gdpr.declineMessage'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        { text: t('gdpr.decline'), style: 'destructive', onPress: onDecline },
      ]
    );
  };

  const toggleDetails = () => {
    setShowDetails(!showDetails);
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => {}} // Prevent dismissal
    >
      <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: colors.tint }]}>
                <Ionicons name="shield-checkmark" size={32} color={SOLID_COLORS.WHITE} />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>
                {t('gdpr.title')}
              </Text>
            </View>

            {/* Main content */}
            <View style={styles.mainContent}>
              <Text style={[styles.description, { color: colors.text }]}>
                {t('gdpr.description')}
              </Text>

              <View style={styles.bulletPoints}>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                    {t('gdpr.benefits.features')}
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                    {t('gdpr.benefits.bugs')}
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                    {t('gdpr.benefits.privacy')}
                  </Text>
                </View>
              </View>

              {/* Details toggle */}
              <Pressable
                onPress={toggleDetails}
                style={({ pressed }) => [
                  styles.detailsToggle,
                  { 
                    backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                    borderColor: colors.border,
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={showDetails ? t('gdpr.hideDetails') : t('gdpr.showDetails')}
              >
                <Text style={[styles.detailsToggleText, { color: colors.tint }]}>
                  {showDetails ? t('gdpr.hideDetails') : t('gdpr.showDetails')}
                </Text>
                <Ionicons 
                  name={showDetails ? "chevron-up" : "chevron-down"} 
                  size={16} 
                  color={colors.tint} 
                />
              </Pressable>

              {/* Expandable details */}
              {showDetails && (
                <View style={[styles.details, { backgroundColor: colors.backgroundSecondary }]}>
                  <Text style={[styles.detailsTitle, { color: colors.text }]}>
                    {t('gdpr.dataWeCollect')}
                  </Text>
                  <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                    {t('gdpr.dataWeCollectList')}
                  </Text>
                  
                  <Text style={[styles.detailsTitle, { color: colors.text }]}>
                    {t('gdpr.dataWeDontCollect')}
                  </Text>
                  <Text style={[styles.detailsText, { color: colors.textSecondary }]}>
                    {t('gdpr.dataWeDontCollectList')}
                  </Text>

                  <Text style={[styles.detailsNote, { color: colors.textMuted }]}>
                    {t('gdpr.changeAnytime')}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Action buttons */}
          <View style={[styles.actions, { borderTopColor: colors.border }]}>
            <Pressable
              onPress={handleDecline}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.button,
                styles.declineButton,
                { 
                  backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                  borderColor: colors.border,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('gdpr.decline')}
            >
              <Text style={[styles.buttonText, { color: colors.text }]}>
                {t('gdpr.decline')}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleAccept}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.button,
                styles.acceptButton,
                { 
                  backgroundColor: pressed ? colors.primaryLight : colors.tint,
                  opacity: isLoading ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t('gdpr.accept')}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Text style={[styles.buttonText, { color: SOLID_COLORS.WHITE }]}>
                    {t('gdpr.saving')}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.buttonText, { color: SOLID_COLORS.WHITE }]}>
                  {t('gdpr.accept')}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.md,
  },
  header: {
    alignItems: 'center',
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
  },
  mainContent: {
    paddingHorizontal: Spacing.lg,
  },
  description: {
    fontSize: Typography.sizes.md,
    lineHeight: Typography.sizes.md * Typography.lineHeights.relaxed,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  bulletPoints: {
    marginBottom: Spacing.lg,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  bulletText: {
    fontSize: Typography.sizes.sm,
    marginLeft: Spacing.sm,
    flex: 1,
    lineHeight: Typography.sizes.sm * Typography.lineHeights.normal,
  },
  detailsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  detailsToggleText: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.medium,
    marginRight: Spacing.xs,
  },
  details: {
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  detailsTitle: {
    fontSize: Typography.sizes.sm,
    fontWeight: Typography.weights.semibold,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  detailsText: {
    fontSize: Typography.sizes.xs,
    lineHeight: Typography.sizes.xs * Typography.lineHeights.relaxed,
    marginBottom: Spacing.sm,
  },
  detailsNote: {
    fontSize: Typography.sizes.xs,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  declineButton: {
    borderWidth: 1,
  },
  acceptButton: {
    // No additional styles needed
  },
  buttonText: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});