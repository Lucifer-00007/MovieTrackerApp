/**
 * Country Hub Screen
 * Displays ranked content list for a specific country with filtering
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 17.2
 */

import { useState, useCallback, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';

import { useThemeColor } from '@/hooks/use-theme-color';
import { discoverByCountry } from '@/services/api';
import { CountryHubHeader } from '@/components/country/CountryHubHeader';
import { CountryHubFilters, type CountryHubFilters as FiltersType } from '@/components/country/CountryHubFilters';
import { CountryContentList } from '@/components/country/CountryContentList';
import { ErrorState } from '@/components/ui/ErrorState';

export default function CountryHubScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const backgroundColor = useThemeColor({}, 'background');

  // Filter state
  const [filters, setFilters] = useState<FiltersType>({
    contentType: 'all',
    genre: null,
    year: null,
  });

  // Query key for caching
  const queryKey = useMemo(() => [
    'country-content',
    code,
    filters.contentType,
    filters.genre,
    filters.year,
  ], [code, filters]);

  // Infinite query for paginated content
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
  } = useInfiniteQuery({
    queryKey,
    queryFn: async ({ pageParam = 1 }) => {
      if (!code) throw new Error('Country code is required');

      // Determine media type for API call
      let mediaType: 'movie' | 'tv' = 'movie';
      if (filters.contentType === 'tv') {
        mediaType = 'tv';
      } else if (filters.contentType === 'all') {
        // For 'all', we'll fetch movies by default
        // In a real app, you might want to fetch both and merge
        mediaType = 'movie';
      }

      return await discoverByCountry(mediaType, code, {
        page: pageParam,
        genre: filters.genre || undefined,
        year: filters.year || undefined,
      });
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.totalPages > pages.length ? pages.length + 1 : undefined;
    },
    enabled: !!code,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  // Flatten paginated data
  const contentItems = useMemo(() => {
    return data?.pages.flatMap(page => page.items) || [];
  }, [data]);

  // Handlers
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleLoadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleFiltersChange = useCallback((newFilters: FiltersType) => {
    setFilters(newFilters);
  }, []);

  if (!code) {
    return (
      <View style={[styles.container, { backgroundColor }]}>
        <CountryHubHeader countryCode="" />
        <View style={styles.content}>
          <ErrorState
            title="Invalid Country"
            message="Country code is required"
            onRetry={() => {}}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      <CountryHubHeader countryCode={code} />
      
      <CountryHubFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
      />

      <View style={styles.content}>
        <CountryContentList
          data={contentItems}
          isLoading={isLoading}
          isError={isError}
          error={error}
          isRefreshing={isRefetching}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onRefresh={handleRefresh}
          onLoadMore={handleLoadMore}
          onRetry={handleRetry}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});