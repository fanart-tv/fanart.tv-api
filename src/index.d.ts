/**
 * Official fanart.tv API Client TypeScript Definitions
 */

/**
 * Image sizes served by the fanart.tv asset CDN.
 * - 'full': the original upload (the `/fanart/` URL the API returns)
 * - 'preview': thumbnail scaled down to a maximum of 200px (`/preview/`)
 * - 'bigpreview': thumbnail scaled down to a maximum of 400px (`/bigpreview/`)
 */
export type FanartImageSize = 'full' | 'preview' | 'bigpreview';

/** All supported image sizes */
export const IMAGE_SIZES: readonly FanartImageSize[];

export interface FanartTVClientOptions {
  /** Your fanart.tv API key (required) */
  apiKey: string;
  /** Your personal client key for faster updates (optional) */
  clientKey?: string;
  /** API version: 'v3', 'v3.1', or 'v3.2' (default: 'v3.2') */
  version?: 'v3' | 'v3.1' | 'v3.2';
  /** Base API URL (default: 'https://webservice.fanart.tv') */
  baseUrl?: string;
  /** Size of image URLs to return in responses (default: 'full') */
  imageSize?: FanartImageSize;
}

export class RateLimitError extends Error {
  /** Seconds to wait before retrying */
  retryAfter: number;
  constructor(message: string, retryAfter: number);
}

export interface FanartImage {
  /** Unique image ID */
  id: string;
  /**
   * Image URL. Full-size by default; a preview URL when the client's `imageSize`
   * is 'preview' or 'bigpreview'. Use FanartTVClient.imageUrl() to convert between sizes.
   */
  url: string;
  /** Language code (e.g., 'en', 'pt', '00' for language-free) */
  lang: string;
  /** Number of likes */
  likes: string;
  /** Image added date (v3.1+) */
  added?: string;
  /** Image width in pixels (v3.2 only) */
  width?: string;
  /** Image height in pixels (v3.2 only) */
  height?: string;
  /** Disc number for cdArt */
  disc?: string;
  /** Disc type for cdArt */
  disc_type?: string;
  /** Size identifier */
  size?: string;
  /** Season number for TV shows */
  season?: string;
  /** Color identifier */
  colour?: string;
  /** Image fields added by newer API versions are served without a client update */
  [field: string]: string | undefined;
}

/**
 * Value type for dynamic response keys. fanart.tv adds new image types
 * server-side (e.g. movie4kbackground) and they are served without a client
 * update, so the response interfaces accept any image-type key; the matching
 * `<type>_count` keys (v3.2) are numbers.
 */
export type FanartDynamicValue = FanartImage[] | string | number | undefined;

/** Albums field - object map keyed by release_group_id in v3/v3.1, array in v3.2 */
export type AlbumsField = { [releaseGroupId: string]: AlbumData } | AlbumData[];

export interface MovieResponse {
  /** Movie name */
  name: string;
  /** TMDB movie ID */
  tmdb_id: string;
  /** IMDB movie ID */
  imdb_id: string;
  /** Total image count (v3.2 only) */
  image_count?: number;
  /** HD movie logos */
  hdmovielogo?: FanartImage[];
  /** Movie discs */
  moviedisc?: FanartImage[];
  /** Movie logos */
  movielogo?: FanartImage[];
  /** Movie posters */
  movieposter?: FanartImage[];
  /** HD clear art */
  hdmovieclearart?: FanartImage[];
  /** Movie art */
  movieart?: FanartImage[];
  /** Movie backgrounds */
  moviebackground?: FanartImage[];
  /** 4K movie backgrounds */
  movie4kbackground?: FanartImage[];
  /** Movie banners */
  moviebanner?: FanartImage[];
  /** Movie thumbs */
  moviethumb?: FanartImage[];
  [imageType: string]: FanartDynamicValue;
}

export interface TVResponse {
  /** TV show name */
  name: string;
  /** TheTVDB show ID */
  thetvdb_id: string;
  /** Total image count (v3.2 only) */
  image_count?: number;
  /** HD TV logos */
  hdtvlogo?: FanartImage[];
  /** Clear logos */
  clearlogo?: FanartImage[];
  /** HD clear art */
  hdclearart?: FanartImage[];
  /** Show backgrounds */
  showbackground?: FanartImage[];
  /** 4K show backgrounds */
  show4kbackground?: FanartImage[];
  /** TV thumbs */
  tvthumb?: FanartImage[];
  /** Season posters */
  seasonposter?: FanartImage[];
  /** Season thumbs */
  seasonthumb?: FanartImage[];
  /** TV banners */
  tvbanner?: FanartImage[];
  /** Character art */
  characterart?: FanartImage[];
  /** Season banners */
  seasonbanner?: FanartImage[];
  [imageType: string]: FanartDynamicValue;
}

export interface AlbumData {
  /** Album release group ID (v3.2) */
  release_group_id?: string;
  /** CD art */
  cdart?: FanartImage[];
  /** Album covers */
  albumcover?: FanartImage[];
  /** New album image types are served without a client update */
  [imageType: string]: FanartImage[] | string | undefined;
}

export interface MusicResponse {
  /** Artist name */
  name: string;
  /** MusicBrainz artist ID */
  mbid_id: string;
  /** Total image count (v3.2 only) */
  image_count?: number;
  /** Artist backgrounds */
  artistbackground?: FanartImage[];
  /** 4K artist backgrounds */
  artist4kbackground?: FanartImage[];
  /** Artist thumbs */
  artistthumb?: FanartImage[];
  /** Music logos */
  musiclogo?: FanartImage[];
  /** HD music logos */
  hdmusiclogo?: FanartImage[];
  /** Music banners */
  musicbanner?: FanartImage[];
  /** Albums - object map in v3/v3.1, array in v3.2 */
  albums?: AlbumsField;
  [imageType: string]: FanartDynamicValue | AlbumsField;
}

export interface LabelResponse {
  /** Label name */
  name: string;
  /** MusicBrainz label ID */
  id: string;
  /** Label logos */
  musiclabel?: FanartImage[];
  [imageType: string]: FanartDynamicValue;
}

export interface LatestItem {
  /** Resource ID (TMDB, TheTVDB, or MusicBrainz) */
  id: string;
  /** Resource name */
  name: string;
  /** Number of new images */
  new_images: string;
  /** Total images */
  total_images: string;
  /** TMDB ID (movies only) */
  tmdb_id?: string;
  /** IMDB ID (movies only) */
  imdb_id?: string;
  /** TheTVDB ID (TV only) */
  thetvdb_id?: string;
  /** MusicBrainz ID (music only) */
  mbid_id?: string;
}

export default class FanartTVClient {
  constructor(options: FanartTVClientOptions);

  // Image URL helpers (static - no API request is made)
  /** Convert an image URL to the given size (default 'preview'); non-fanart.tv URLs are returned unchanged */
  static imageUrl(url: string, size?: FanartImageSize): string;
  /** Get the small preview (max 200px) URL for an image */
  static previewUrl(url: string): string;
  /** Get the large preview (max 400px) URL for an image */
  static bigPreviewUrl(url: string): string;
  /** Get the full-size URL for an image (reverses previewUrl/bigPreviewUrl) */
  static fullUrl(url: string): string;

  // Movie methods
  getMovie(movieId: string | number): Promise<MovieResponse>;
  getMovieImages(movieId: string | number): Promise<MovieResponse>;
  getLatestMovies(timestamp?: number): Promise<LatestItem[]>;
  getLatestMoviesImages(timestamp?: number): Promise<LatestItem[]>;

  // TV methods
  getShow(tvId: string | number): Promise<TVResponse>;
  getShowImages(tvId: string | number): Promise<TVResponse>;
  getLatestShows(timestamp?: number): Promise<LatestItem[]>;
  getLatestShowsImages(timestamp?: number): Promise<LatestItem[]>;

  // Music methods
  getArtist(artistId: string): Promise<MusicResponse>;
  getArtistImages(artistId: string): Promise<MusicResponse>;
  getAlbum(albumId: string): Promise<MusicResponse>;
  getAlbumImages(albumId: string): Promise<MusicResponse>;
  getLabel(labelId: string): Promise<LabelResponse>;
  getLabelImages(labelId: string): Promise<LabelResponse>;
  getLatestMusic(timestamp?: number): Promise<LatestItem[]>;
  getLatestArtistsImages(timestamp?: number): Promise<LatestItem[]>;

  // Configuration methods
  setVersion(version: 'v3' | 'v3.1' | 'v3.2'): void;
  setClientKey(clientKey: string): void;
  setImageSize(size: FanartImageSize): void;
}
