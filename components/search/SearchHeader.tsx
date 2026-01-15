/**
 * Search Header Component
 * Contains search input and clear functionality
 * 
 * Requirements: 6.1, 6.2
 */

import { useRef } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { SOLID_COLORS } from '@/constants/colors';

interface SearchHeaderProps {
  query: string;
  onQueryChange: (query: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function SearchHeader({ 
  query, 
  onQueryChange, 
  onClear, 
  placeholder = "Search movies, TV shows..." 
}: SearchHeaderProps) {
  const inputRef = useRef<TextInput>(null);
  const textColor = useThemeColor({}, 'text');
  const textSecondary = useThemeColor({}, 'textSecondary');
  const borderColor = useThemeColor({}, 'border');
  const cardBackground = useThemeColor({}, 'card');
  const tintColor = useThemeColor({}, 'tint');

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>
        Search
      </Text>
      <Text style={[styles.subtitle, { color: textSecondary }]}>
        Find movies and TV shows
      </Text>
      
      <View style={[styles.searchContainer, { backgroundColor: cardBackground, borderColor }]}>
        <View style={[styles.searchIconContainer, { backgroundColor: tintColor }]}>
          <Ionicons name="search" size={18} color={SOLID_COLORS.WHITE} />
        </View>
        
        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: textColor }]}
          placeholder={placeholder}
          placeholderTextColor={textSecondary}
          value={query}
          onChangeText={onQueryChange}
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="never"
        />
        
        {query.length > 0 && (
          <Pressable
            onPress={handleClear}
            style={({ pressed }) => [
              styles.clearButton,
              { opacity: pressed ? 0.7 : 1 }
            ]}
            accessibilityLabel="Clear search"
          >
            <Ionicons name="close-circle" size={22} color={textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    paddingTop: Spacing.xxl + Spacing.md,
    gap: Spacing.xs,
  },
  title: {
    fontSize: Typography.sizes.xxxl,
    fontWeight: Typography.weights.bold,
  },
  subtitle: {
    fontSize: Typography.sizes.md,
    marginBottom: Spacing.sm,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingRight: Spacing.sm,
    overflow: 'hidden',
  },
  searchIconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  clearButton: {
    padding: Spacing.xs,
  },
});