/**
 * Settings Modals for Profile Screen
 * Language and Theme selection modals
 */

import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEffectiveColorScheme } from '@/hooks/use-effective-color-scheme';
import { Colors, Spacing, Typography } from '@/constants/theme';
import { LANGUAGES, THEME_MODES } from '@/constants/profile';
import type { ThemeMode } from '@/types/user';

/** Language modal props */
export interface LanguageModalProps {
  visible: boolean;
  currentLanguage: string;
  onSelect: (language: string) => void;
  onClose: () => void;
}

/** Language selection modal */
export function LanguageModal({
  visible,
  currentLanguage,
  onSelect,
  onClose,
}: LanguageModalProps) {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Select Language</Text>
          <Pressable onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {LANGUAGES.map((language) => (
            <Pressable
              key={language.code}
              onPress={() => {
                onSelect(language.code);
                onClose();
              }}
              style={({ pressed }) => [
                styles.languageOption,
                { 
                  backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                  borderBottomColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.languageOptionText, { color: colors.text }]}>
                {language.name}
              </Text>
              {currentLanguage === language.code && (
                <Ionicons name="checkmark" size={20} color={colors.tint} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

/** Theme modal props */
export interface ThemeModalProps {
  visible: boolean;
  currentTheme: ThemeMode;
  onSelect: (theme: ThemeMode) => void;
  onClose: () => void;
}

/** Theme selection modal */
export function ThemeModal({
  visible,
  currentTheme,
  onSelect,
  onClose,
}: ThemeModalProps) {
  const colorScheme = useEffectiveColorScheme();
  const colors = Colors[colorScheme];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Select Theme</Text>
          <Pressable onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>
        
        <ScrollView style={styles.modalContent}>
          {THEME_MODES.map((theme) => (
            <Pressable
              key={theme.value}
              onPress={() => {
                onSelect(theme.value);
                onClose();
              }}
              style={({ pressed }) => [
                styles.themeOption,
                { 
                  backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
                  borderBottomColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.themeOptionContent}>
                <Text style={[styles.themeOptionTitle, { color: colors.text }]}>
                  {theme.label}
                </Text>
                <Text style={[styles.themeOptionDescription, { color: colors.textSecondary }]}>
                  {theme.description}
                </Text>
              </View>
              {currentTheme === theme.value && (
                <Ionicons name="checkmark" size={20} color={colors.tint} />
              )}
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  modalTitle: {
    fontSize: Typography.sizes.xl,
    fontWeight: Typography.weights.bold,
  },
  modalCloseButton: {
    padding: Spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    flex: 1,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    minHeight: 60,
  },
  languageOptionText: {
    fontSize: Typography.sizes.md,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    minHeight: 80,
  },
  themeOptionContent: {
    flex: 1,
  },
  themeOptionTitle: {
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
  },
  themeOptionDescription: {
    fontSize: Typography.sizes.sm,
    marginTop: Spacing.xs,
  },
});
