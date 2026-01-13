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

  const handleClear = () => {
    onClear();
    inputRef.current?.focus();
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: textColor }]}>
        Search
      </Text>
      
      <View style={[styles.searchContainer, { backgroundColor: cardBackground, borderColor }]}>
        <Ionicons 
          name="search" 
          size={20} 
          color={textSecondary} 
          style={styles.searchIcon} 
        />
        
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
            <Ionicons name="close-circle" size={20} color={textSecondary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  title: {
    fontSize: Typography.sizes.xxl,
    fontWeight: Typography.weights.bold,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  searchIcon: {
    flexShrink: 0,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.sizes.md,
    fontWeight: Typography.weights.medium,
    paddingVertical: 0,
  },
  clearButton: {
    flexShrink: 0,
  },
});