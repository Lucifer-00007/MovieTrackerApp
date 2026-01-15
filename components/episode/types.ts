/**
 * Episode component types
 */

/** Crew member type */
export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string | null;
}

/** Guest star type */
export interface GuestStar {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
}

/** Episode detail type */
export interface EpisodeDetail {
  id: number;
  episodeNumber: number;
  seasonNumber: number;
  name: string;
  overview: string;
  stillPath: string | null;
  airDate: string;
  runtime: number | null;
  voteAverage: number;
  voteCount: number;
  crew: CrewMember[];
  guestStars: GuestStar[];
}
