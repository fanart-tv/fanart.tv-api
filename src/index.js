/**
 * Official fanart.tv API Client
 * Supports API versions v3, v3.1, and v3.2
 * Uses native fetch - zero dependencies
 */
class FanartTVClient {
  /**
   * Create a new fanart.tv API client
   * @param {Object} options - Configuration options
   * @param {string} options.apiKey - Your fanart.tv API key (required)
   * @param {string} [options.clientKey] - Your personal client key for faster updates (optional)
   * @param {string} [options.version='v3.2'] - API version: 'v3', 'v3.1', or 'v3.2'
   * @param {string} [options.baseUrl='https://webservice.fanart.tv'] - Base API URL
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
  }

  /**
   * Make an API request
   * @private
   */
  async _request(endpoint, retryCount = 0) {
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
        return this._request(endpoint, retryCount + 1);
      }
      
      // Max retries exceeded
      throw new Error(`fanart.tv API rate limit exceeded. Please wait ${waitTime/1000}s before retrying.`);
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`fanart.tv API error (${response.status}): ${errorText}`);
    }

    return response.json();
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
