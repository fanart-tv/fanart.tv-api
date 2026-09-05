/**
 * Official fanart.tv API Client
 * Supports API versions v3, v3.1, and v3.2
 * Uses native fetch - zero dependencies
 */

/**
 * Error thrown when the API rate limit is exceeded and retries are exhausted
 */
class RateLimitError extends Error {
  /**
   * @param {string} message - Error message
   * @param {number} retryAfter - Seconds to wait before retrying
   */
  constructor(message, retryAfter) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Image sizes served by the fanart.tv asset CDN.
 * The API always returns full-size URLs under the `/fanart/` path segment; the CDN
 * also serves pre-generated thumbnails of every image under `/preview/` (max 200px)
 * and `/bigpreview/` (max 400px). Maps each size to its CDN path segment.
 */
const IMAGE_SIZE_SEGMENTS = { full: 'fanart', preview: 'preview', bigpreview: 'bigpreview' };
const IMAGE_SIZES = Object.freeze(Object.keys(IMAGE_SIZE_SEGMENTS));

// Matches the CDN origin and size segment at the start of a fanart.tv asset URL
const ASSET_URL_PATTERN = /^(https?:\/\/assets\.fanart\.tv)\/(fanart|preview|bigpreview)\//i;

function assertImageSize(size) {
  if (!IMAGE_SIZES.includes(size)) {
    throw new Error(`imageSize must be one of: ${IMAGE_SIZES.join(', ')}`);
  }
}

// Convert one asset URL to the given (already validated) size; anything else is returned as is
function toImageSize(url, size) {
  return typeof url === 'string' ? url.replace(ASSET_URL_PATTERN, `$1/${IMAGE_SIZE_SEGMENTS[size]}/`) : url;
}

// Rewrite every image `url` in an API response in place to the given size
function rewriteImageUrls(data, size) {
  for (const key of Object.keys(data)) {
    const value = data[key];
    if (key === 'url') {
      data[key] = toImageSize(value, size);
    } else if (value !== null && typeof value === 'object') {
      rewriteImageUrls(value, size);
    }
  }
}

class FanartTVClient {
  /**
   * Create a new fanart.tv API client
   * @param {Object} options - Configuration options
   * @param {string} options.apiKey - Your fanart.tv API key (required)
   * @param {string} [options.clientKey] - Your personal client key for faster updates (optional)
   * @param {string} [options.version='v3.2'] - API version: 'v3', 'v3.1', or 'v3.2'
   * @param {string} [options.baseUrl='https://webservice.fanart.tv'] - Base API URL
   * @param {string} [options.imageSize='full'] - Size of image URLs to return: 'full', 'preview' (max 200px), or 'bigpreview' (max 400px)
   */
  constructor(options = {}) {
    if (!options.apiKey) {
      throw new Error('apiKey is required');
    }

    this.apiKey = options.apiKey;
    this.clientKey = options.clientKey || null;
    this.version = options.version || 'v3.2';
    this.baseUrl = options.baseUrl || 'https://webservice.fanart.tv';

    // Validate version
    if (!['v3', 'v3.1', 'v3.2'].includes(this.version)) {
      throw new Error('version must be one of: v3, v3.1, v3.2');
    }

    this.setImageSize(options.imageSize || 'full');
  }

  /**
   * Convert a fanart.tv image URL to a different size.
   * Swaps the `/fanart/` path segment for `/preview/` or `/bigpreview/` (or back to `/fanart/`).
   * URLs that are not fanart.tv asset URLs are returned unchanged.
   * @param {string} url - Image URL as returned by the API
   * @param {string} [size='preview'] - 'full', 'preview' (max 200px), or 'bigpreview' (max 400px)
   * @returns {string} Image URL for the requested size
   * @example
   * FanartTVClient.imageUrl('https://assets.fanart.tv/fanart/fight-club-5d5d5d5d5d5d5.jpg', 'bigpreview');
   * // => 'https://assets.fanart.tv/bigpreview/fight-club-5d5d5d5d5d5d5.jpg'
   */
  static imageUrl(url, size = 'preview') {
    assertImageSize(size);
    return toImageSize(url, size);
  }

  /**
   * Get the small preview (max 200px) URL for an image
   * @param {string} url - Image URL as returned by the API
   * @returns {string}
   */
  static previewUrl(url) {
    return FanartTVClient.imageUrl(url, 'preview');
  }

  /**
   * Get the large preview (max 400px) URL for an image
   * @param {string} url - Image URL as returned by the API
   * @returns {string}
   */
  static bigPreviewUrl(url) {
    return FanartTVClient.imageUrl(url, 'bigpreview');
  }

  /**
   * Get the full-size URL for an image (reverses previewUrl/bigPreviewUrl)
   * @param {string} url - Image URL, possibly already a preview URL
   * @returns {string}
   */
  static fullUrl(url) {
    return FanartTVClient.imageUrl(url, 'full');
  }

  /**
   * Make an API request
   * @private
   */
  async _request(endpoint, retryCount = 0, imageSize = this.imageSize) {
    const url = new URL(`${this.baseUrl}/${this.version}${endpoint}`);
    url.searchParams.append('api_key', this.apiKey);
    
    if (this.clientKey) {
      url.searchParams.append('client_key', this.clientKey);
    }

    const response = await fetch(url.toString());

    // Handle rate limiting (429 Too Many Requests)
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000; // Default 1 second
      
      // Retry up to 3 times
      if (retryCount < 3) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this._request(endpoint, retryCount + 1, imageSize);
      }
      
      // Max retries exceeded
      throw new RateLimitError(`fanart.tv API rate limit exceeded. Please wait ${waitTime/1000}s before retrying.`, waitTime / 1000);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`fanart.tv API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    if (imageSize !== 'full' && data !== null && typeof data === 'object') {
      rewriteImageUrls(data, imageSize);
    }
    return data;
  }

  /**
   * Get movie images
   * @param {string|number} movieId - TMDB movie ID or IMDB ID (tt1234567)
   * @returns {Promise<Object>} Movie artwork data
   * @example
   * const images = await client.getMovie(17645);
   * const imagesByImdb = await client.getMovie('tt0037884');
   */
  async getMovie(movieId) {
    return this._request(`/movies/${movieId}`);
  }

  /**
   * Alias for getMovie() - for compatibility
   */
  async getMovieImages(movieId) {
    return this.getMovie(movieId);
  }

  /**
   * Get latest movie images
   * @param {number} [timestamp] - Unix timestamp to get images since (optional)
   * @returns {Promise<Array>} Array of recently updated movies
   * @example
   * const latest = await client.getLatestMovies();
   * const since = await client.getLatestMovies(1699920000);
   */
  async getLatestMovies(timestamp) {
    const endpoint = timestamp 
      ? `/movies/latest?date=${timestamp}`
      : '/movies/latest';
    return this._request(endpoint);
  }

  /**
   * Alias for getLatestMovies() - for compatibility
   */
  async getLatestMoviesImages(timestamp) {
    return this.getLatestMovies(timestamp);
  }

  /**
   * Get TV show images
   * @param {string|number} tvId - TheTVDB show ID
   * @returns {Promise<Object>} TV show artwork data
   * @example
   * const images = await client.getShow(121361);
   */
  async getShow(tvId) {
    return this._request(`/tv/${tvId}`);
  }

  /**
   * Alias for getShow() - for compatibility
   */
  async getShowImages(tvId) {
    return this.getShow(tvId);
  }

  /**
   * Get latest TV show images
   * @param {number} [timestamp] - Unix timestamp to get images since (optional)
   * @returns {Promise<Array>} Array of recently updated TV shows
   * @example
   * const latest = await client.getLatestShows();
   */
  async getLatestShows(timestamp) {
    const endpoint = timestamp 
      ? `/tv/latest?date=${timestamp}`
      : '/tv/latest';
    return this._request(endpoint);
  }

  /**
   * Alias for getLatestShows() - for compatibility
   */
  async getLatestShowsImages(timestamp) {
    return this.getLatestShows(timestamp);
  }

  /**
   * Get artist images (music)
   * @param {string} artistId - MusicBrainz artist ID
   * @returns {Promise<Object>} Artist artwork data including albums
   * @example
   * const images = await client.getArtist('f4a31f0a-51dd-4fa7-986d-3095c40c5ed9');
   */
  async getArtist(artistId) {
    return this._request(`/music/${artistId}`);
  }

  /**
   * Alias for getArtist() - for compatibility
   */
  async getArtistImages(artistId) {
    return this.getArtist(artistId);
  }

  /**
   * Get album images (music)
   * @param {string} albumId - MusicBrainz release group ID
   * @returns {Promise<Object>} Album artwork data
   * @example
   * const images = await client.getAlbum('f6c334ab-42cd-4bbb-b33d-2c2ae7670c20');
   */
  async getAlbum(albumId) {
    return this._request(`/music/albums/${albumId}`);
  }

  /**
   * Alias for getAlbum() - for compatibility
   */
  async getAlbumImages(albumId) {
    return this.getAlbum(albumId);
  }

  /**
   * Get label images (music)
   * @param {string} labelId - MusicBrainz label ID
   * @returns {Promise<Object>} Label artwork data
   * @example
   * const images = await client.getLabel('e832b688-546b-45e3-83e5-9f8db5dcde1d');
   */
  async getLabel(labelId) {
    return this._request(`/music/labels/${labelId}`);
  }

  /**
   * Alias for getLabel() - for compatibility
   */
  async getLabelImages(labelId) {
    return this.getLabel(labelId);
  }

  /**
   * Get latest music images
   * @param {number} [timestamp] - Unix timestamp to get images since (optional)
   * @returns {Promise<Array>} Array of recently updated artists
   * @example
   * const latest = await client.getLatestMusic();
   */
  async getLatestMusic(timestamp) {
    const endpoint = timestamp 
      ? `/music/latest?date=${timestamp}`
      : '/music/latest';
    return this._request(endpoint);
  }

  /**
   * Alias for getLatestMusic() - for compatibility
   */
  async getLatestArtistsImages(timestamp) {
    return this.getLatestMusic(timestamp);
  }

  /**
   * Change API version for subsequent requests
   * @param {string} version - API version: 'v3', 'v3.1', or 'v3.2'
   * @example
   * client.setVersion('v3.2'); // Get width, height, and image_count fields
   */
  setVersion(version) {
    if (!['v3', 'v3.1', 'v3.2'].includes(version)) {
      throw new Error('version must be one of: v3, v3.1, v3.2');
    }
    this.version = version;
  }

  /**
   * Change the size of image URLs returned by subsequent requests
   * @param {string} size - 'full' (default), 'preview' (max 200px), or 'bigpreview' (max 400px)
   * @example
   * client.setImageSize('preview'); // All image urls now point at 200px thumbnails
   */
  setImageSize(size) {
    assertImageSize(size);
    this.imageSize = size;
  }

  /**
   * Update client key for personal API access
   * @param {string} clientKey - Your personal client key
   * @example
   * client.setClientKey('your-client-key-here');
   */
  setClientKey(clientKey) {
    this.clientKey = clientKey;
  }
}

module.exports = FanartTVClient;
// Named export so `import { RateLimitError }` and `require(...).RateLimitError` both work
module.exports.RateLimitError = RateLimitError;
module.exports.IMAGE_SIZES = IMAGE_SIZES;
