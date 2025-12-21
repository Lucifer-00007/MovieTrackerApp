/**
 * Mock data for development and testing when API is unavailable
 * Enable by setting EXPO_PUBLIC_USE_MOCK_DATA=true in .env
 */

import type {
  MediaItem,
  TrendingItem,
  MediaDetails,
  CastMember,
  StreamingProvider,
  Genre,
} from '@/types/media';

/** Mock image path - triggers placeholder image in mock mode */
const MOCK_IMAGE = '/mock-placeholder';

/** Mock genres */
export const MOCK_GENRES: Genre[] = [
  { id: 28, name: 'Action' },
  { id: 12, name: 'Adventure' },
  { id: 16, name: 'Animation' },
  { id: 35, name: 'Comedy' },
  { id: 80, name: 'Crime' },
  { id: 18, name: 'Drama' },
  { id: 14, name: 'Fantasy' },
  { id: 27, name: 'Horror' },
  { id: 10749, name: 'Romance' },
  { id: 878, name: 'Science Fiction' },
  { id: 53, name: 'Thriller' },
];

/** Mock trending movies */
export const MOCK_TRENDING_MOVIES: TrendingItem[] = [
  {
    id: 1,
    title: 'The Adventure Begins',
    originalTitle: 'The Adventure Begins',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'An epic journey through uncharted territories where heroes are made and legends are born.',
    releaseDate: '2024-06-15',
    voteAverage: 8.5,
    voteCount: 12500,
    mediaType: 'movie',
    genreIds: [28, 12, 878],
    rank: 1,
  },
  {
    id: 2,
    title: 'Mystery of the Deep',
    originalTitle: 'Mystery of the Deep',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'A team of scientists discovers something extraordinary beneath the ocean floor.',
    releaseDate: '2024-05-20',
    voteAverage: 7.8,
    voteCount: 8900,
    mediaType: 'movie',
    genreIds: [878, 53],
    rank: 2,
  },
  {
    id: 3,
    title: 'Love in Paris',
    originalTitle: 'Love in Paris',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'Two strangers meet in the city of lights and discover that fate has other plans.',
    releaseDate: '2024-02-14',
    voteAverage: 7.2,
    voteCount: 6500,
    mediaType: 'movie',
    genreIds: [10749, 35],
    rank: 3,
  },
  {
    id: 4,
    title: 'The Last Stand',
    originalTitle: 'The Last Stand',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'When all hope seems lost, one hero rises to defend humanity against impossible odds.',
    releaseDate: '2024-07-04',
    voteAverage: 8.1,
    voteCount: 15000,
    mediaType: 'movie',
    genreIds: [28, 878, 53],
    rank: 4,
  },
  {
    id: 5,
    title: 'Shadows in the Night',
    originalTitle: 'Shadows in the Night',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'A detective uncovers a conspiracy that threatens to destroy everything she holds dear.',
    releaseDate: '2024-03-22',
    voteAverage: 7.6,
    voteCount: 7200,
    mediaType: 'movie',
    genreIds: [80, 53, 18],
    rank: 5,
  },
];

/** Mock trending TV shows */
export const MOCK_TRENDING_TV: TrendingItem[] = [
  {
    id: 101,
    title: 'Kingdom of Dreams',
    originalTitle: 'Kingdom of Dreams',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'A fantasy epic following the rise and fall of kingdoms in a world where magic is real.',
    releaseDate: '2023-09-01',
    voteAverage: 8.9,
    voteCount: 25000,
    mediaType: 'tv',
    genreIds: [14, 18, 28],
    rank: 1,
  },
  {
    id: 102,
    title: 'Tech Titans',
    originalTitle: 'Tech Titans',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'The cutthroat world of Silicon Valley startups and the people who build them.',
    releaseDate: '2024-01-15',
    voteAverage: 8.2,
    voteCount: 18000,
    mediaType: 'tv',
    genreIds: [18, 35],
    rank: 2,
  },
  {
    id: 103,
    title: 'Space Explorers',
    originalTitle: 'Space Explorers',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'A crew of astronauts embarks on humanitys first interstellar mission.',
    releaseDate: '2024-04-10',
    voteAverage: 8.7,
    voteCount: 22000,
    mediaType: 'tv',
    genreIds: [878, 12, 18],
    rank: 3,
  },
];

/** Combined mock trending items */
export const MOCK_TRENDING_ALL: TrendingItem[] = [
  ...MOCK_TRENDING_MOVIES.slice(0, 3),
  ...MOCK_TRENDING_TV.slice(0, 2),
].map((item, index) => ({ ...item, rank: index + 1 }));

/** Mock movie details */
export const MOCK_MOVIE_DETAILS: Record<number, MediaDetails> = {
  1: {
    id: 1,
    title: 'The Adventure Begins',
    originalTitle: 'The Adventure Begins',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'An epic journey through uncharted territories where heroes are made and legends are born. Follow a group of unlikely companions as they traverse dangerous lands, face mythical creatures, and discover the true meaning of courage.',
    releaseDate: '2024-06-15',
    voteAverage: 8.5,
    voteCount: 12500,
    mediaType: 'movie',
    genreIds: [28, 12, 878],
    runtime: 142,
    genres: [
      { id: 28, name: 'Action' },
      { id: 12, name: 'Adventure' },
      { id: 878, name: 'Science Fiction' },
    ],
    tagline: 'Every legend has a beginning',
    status: 'Released',
    productionCountries: [{ iso_3166_1: 'US', name: 'United States of America' }],
    spokenLanguages: [{ iso_639_1: 'en', name: 'English', englishName: 'English' }],
    budget: 180000000,
    revenue: 650000000,
  },
};

/** Mock TV details */
export const MOCK_TV_DETAILS: Record<number, MediaDetails> = {
  101: {
    id: 101,
    title: 'Kingdom of Dreams',
    originalTitle: 'Kingdom of Dreams',
    posterPath: MOCK_IMAGE,
    backdropPath: MOCK_IMAGE,
    overview: 'A fantasy epic following the rise and fall of kingdoms in a world where magic is real. Political intrigue, epic battles, and complex characters make this a must-watch series.',
    releaseDate: '2023-09-01',
    voteAverage: 8.9,
    voteCount: 25000,
    mediaType: 'tv',
    genreIds: [14, 18, 28],
    runtime: 55,
    genres: [
      { id: 14, name: 'Fantasy' },
      { id: 18, name: 'Drama' },
      { id: 28, name: 'Action' },
    ],
    tagline: 'Power comes at a price',
    status: 'Returning Series',
    productionCountries: [{ iso_3166_1: 'US', name: 'United States of America' }],
    spokenLanguages: [{ iso_639_1: 'en', name: 'English', englishName: 'English' }],
    numberOfSeasons: 3,
    numberOfEpisodes: 24,
  },
};

/** Mock cast members */
export const MOCK_CAST: CastMember[] = [
  { id: 1001, name: 'John Smith', character: 'Hero', profilePath: MOCK_IMAGE, order: 0 },
  { id: 1002, name: 'Jane Doe', character: 'Heroine', profilePath: MOCK_IMAGE, order: 1 },
  { id: 1003, name: 'Bob Johnson', character: 'Villain', profilePath: MOCK_IMAGE, order: 2 },
  { id: 1004, name: 'Alice Williams', character: 'Mentor', profilePath: MOCK_IMAGE, order: 3 },
  { id: 1005, name: 'Charlie Brown', character: 'Sidekick', profilePath: MOCK_IMAGE, order: 4 },
];

/** Mock streaming providers */
export const MOCK_PROVIDERS: StreamingProvider[] = [
  { providerId: 8, providerName: 'Netflix', logoPath: MOCK_IMAGE, link: '#', type: 'flatrate', isAvailable: true },
  { providerId: 9, providerName: 'Amazon Prime', logoPath: MOCK_IMAGE, link: '#', type: 'flatrate', isAvailable: true },
  { providerId: 337, providerName: 'Disney+', logoPath: MOCK_IMAGE, link: '#', type: 'flatrate', isAvailable: true },
];

/** Mock search results */
export function getMockSearchResults(query: string): { movies: MediaItem[]; tvShows: MediaItem[] } {
  const lowerQuery = query.toLowerCase();
  
  const movies = MOCK_TRENDING_MOVIES.filter(
    m => m.title.toLowerCase().includes(lowerQuery) || m.overview.toLowerCase().includes(lowerQuery)
  );
  
  const tvShows = MOCK_TRENDING_TV.filter(
    t => t.title.toLowerCase().includes(lowerQuery) || t.overview.toLowerCase().includes(lowerQuery)
  );
  
  return { movies, tvShows };
}
