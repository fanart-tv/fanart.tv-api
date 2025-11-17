# @fanart-tv/api

> Official fanart.tv API client for Node.js

[![npm version](https://img.shields.io/npm/v/@fanart-tv/api.svg)](https://www.npmjs.com/package/@fanart-tv/api)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

A lightweight, zero-dependency Node.js client for the [fanart.tv API](https://api.fanart.tv). Get high-quality artwork for movies, TV shows, and music with full support for API versions v3, v3.1, and v3.2.

## Features

- ✅ **Zero dependencies** - Uses native `fetch` API (Node 18+)
- ✅ **Full API v3.2 support** - Including `width`, `height`, and `image_count` fields
- ✅ **Personal API keys** - Support for `client_key` for faster image updates
- ✅ **TypeScript definitions** - Complete type safety out of the box
- ✅ **Version flexibility** - Switch between v3, v3.1, and v3.2 easily
- ✅ **Backward compatible** - Works as drop-in replacement for existing packages
- ✅ **Automatic retry** - Handles 429 rate limits with exponential backoff

## Installation

```bash
npm install @fanart-tv/api
```

## Quick Start

```javascript
const FanartTVClient = require('@fanart-tv/api');

// Initialize with your API key
const client = new FanartTVClient({
  apiKey: 'your-api-key-here',
  version: 'v3.2' // Optional: defaults to 'v3.2' (includes width, height, image_count)
});

// Get movie artwork
const movie = await client.getMovie(17645); // TMDB ID
console.log(movie.movieposter); // Array of poster images

// Get TV show artwork
const show = await client.getShow(121361); // TheTVDB ID
console.log(show.hdtvlogo); // Array of HD logos

// Get music artwork
const artist = await client.getArtist('f4a31f0a-51dd-4fa7-986d-3095c40c5ed9'); // MusicBrainz ID
console.log(artist.albums); // Album artwork
```

## API Reference

For complete API documentation, visit **[https://api.fanart.tv](https://api.fanart.tv)**

### Constructor Options

```javascript
const client = new FanartTVClient({
  apiKey: 'your-api-key',        // Required: Your fanart.tv API key
  clientKey: 'your-client-key',  // Optional: Personal key for faster updates
  version: 'v3.2',               // Optional: 'v3', 'v3.1', or 'v3.2' (default: 'v3.2')
  baseUrl: 'https://...'         // Optional: Custom base URL
});
```

### Movies

```javascript
// Get movie artwork by TMDB ID
await client.getMovie(17645);

// Get movie artwork by IMDB ID
await client.getMovie('tt0037884');

// Get latest movie updates
await client.getLatestMovies();

// Get movies updated since timestamp
await client.getLatestMovies(1699920000);
```

**Movie Response Fields:**
- `hdmovielogo` - HD transparent movie logos
- `movieposter` - Movie posters
- `moviebackground` - Backgrounds/fanart
- `hdmovieclearart` - HD clear art
- `moviebanner` - Banners
- `moviethumb` - Thumbnails
- `moviedisc` - Disc images
- `movielogo` - Standard logos
- `movieart` - Additional art

### TV Shows

```javascript
// Get TV show artwork by TheTVDB ID
await client.getShow(121361);

// Get latest TV updates
await client.getLatestShows();

// Get shows updated since timestamp
await client.getLatestShows(1699920000);
```

**TV Response Fields:**
- `hdtvlogo` - HD transparent TV logos
- `clearlogo` - Clear logos
- `hdclearart` - HD clear art
- `showbackground` - Show backgrounds/fanart
- `tvthumb` - Show thumbnails
- `seasonposter` - Season posters
- `seasonthumb` - Season thumbnails
- `tvbanner` - TV banners
- `characterart` - Character art
- `seasonbanner` - Season banners

### Music

```javascript
// Get artist artwork by MusicBrainz ID
await client.getArtist('f4a31f0a-51dd-4fa7-986d-3095c40c5ed9');

// Get album artwork by MusicBrainz Release Group ID
await client.getAlbum('f6c334ab-42cd-4bbb-b33d-2c2ae7670c20');

// Get label artwork by MusicBrainz Label ID
await client.getLabel('e832b688-546b-45e3-83e5-9f8db5dcde1d');

// Get latest music updates
await client.getLatestMusic();

// Get music updated since timestamp
await client.getLatestMusic(1699920000);
```

**Music Response Fields:**
- `artistbackground` - Artist backgrounds
- `artistthumb` - Artist thumbnails
- `musiclogo` - Music logos
- `hdmusiclogo` - HD music logos
- `musicbanner` - Music banners
- `albums` - Album artwork (includes `cdart` and `albumcover`)

## API Version Differences

### v3 (Default)
Basic image data without timestamps or dimensions:
```javascript
{
  id: "267393",
  url: "https://assets.fanart.tv/...",
  lang: "en",
  likes: "3"
}
```

### v3.1
Adds `added` timestamp field:
```javascript
{
  id: "267393",
  url: "https://assets.fanart.tv/...",
  lang: "en",
  likes: "3",
  added: "2019-08-16 22:52:46"
}
```

### v3.2 (Recommended)
Adds image dimensions and total count:
```javascript
{
  id: "267393",
  url: "https://assets.fanart.tv/...",
  lang: "en",
  likes: "3",
  added: "2019-08-16 22:52:46",
  width: "1000",
  height: "562"
}

// Response also includes:
{
  image_count: 9,  // Total images
  // ... other fields
}
```

**Change version at runtime:**
```javascript
client.setVersion('v3.2');
const images = await client.getMovie(17645); // Now includes width/height
```

## Personal API Keys (client_key)

Personal API keys provide **faster access to new images** (2-day delay instead of 7 days for standard API keys).

```javascript
const client = new FanartTVClient({
  apiKey: 'your-api-key',
  clientKey: 'your-personal-client-key'
});

// Or set it later
client.setClientKey('your-personal-client-key');
```

Get your personal API key from your [fanart.tv account settings](https://fanart.tv/get-an-api-key/).

## Access Tiers

| Tier | Key Type | Image Delay | Limit |
|------|----------|-------------|-------|
| **Project** | `api_key` only | 7 days | Unlimited |
| **Personal** | `api_key` + `client_key` | 2 days | Unlimited |
| **VIP** | Active VIP membership | Real-time | Unlimited |

Learn more at [https://api.fanart.tv](https://api.fanart.tv)

## Rate Limiting

The fanart.tv API may rate limit requests for API keys that exceed usage thresholds. This client automatically handles 429 rate limit responses:

- **Automatic retry**: Retries up to 3 times when rate limited
- **Respects Retry-After**: Waits the duration specified by the server
- **Exponential backoff**: Uses 1 second default if no Retry-After header

**Example error handling:**

```javascript
try {
  const movie = await client.getMovie(17645);
} catch (error) {
  if (error.message.includes('rate limit exceeded')) {
    console.log('Rate limited - the client already retried 3 times');
    // Implement your own backoff strategy here
  }
}
```

Rate limits are applied per API key and vary based on usage patterns. Consider:
- Using `client_key` for personal access (less restrictive)
- Implementing request queuing for high-volume applications
- Caching responses when appropriate

## Full Examples

### Movie Posters with Error Handling

```javascript
const FanartTVClient = require('@fanart-tv/api');

const client = new FanartTVClient({
  apiKey: process.env.FANART_API_KEY,
  version: 'v3.2'
});

async function getMoviePosters(tmdbId) {
  try {
    const data = await client.getMovie(tmdbId);
    
    // Filter for English posters only
    const englishPosters = data.movieposter?.filter(p => p.lang === 'en') || [];
    
    // Sort by likes (popularity)
    englishPosters.sort((a, b) => parseInt(b.likes) - parseInt(a.likes));
    
    return englishPosters;
  } catch (error) {
    console.error('Failed to fetch movie posters:', error.message);
    return [];
  }
}

getMoviePosters(17645).then(posters => {
  console.log(`Found ${posters.length} English posters`);
  posters.forEach(p => {
    console.log(`${p.url} (${p.width}x${p.height}, ${p.likes} likes)`);
  });
});
```

### TV Show Backgrounds

```javascript
async function getShowBackgrounds(tvdbId, minLikes = 5) {
  const data = await client.getShow(tvdbId);
  
  // Get high-quality backgrounds with minimum likes
  return data.showbackground
    ?.filter(bg => parseInt(bg.likes) >= minLikes)
    .sort((a, b) => parseInt(b.likes) - parseInt(a.likes)) || [];
}

const backgrounds = await getShowBackgrounds(121361, 10);
console.log(`Found ${backgrounds.length} popular backgrounds`);
```

### Music Album Art

```javascript
async function getAlbumCovers(albumId) {
  const data = await client.getAlbum(albumId);
  
  // In v3.1+, albums is an array with release_group_id
  const album = Array.isArray(data.albums) 
    ? data.albums[0] 
    : data.albums[albumId]; // v3 format
  
  return album?.albumcover || [];
}

const covers = await getAlbumCovers('f6c334ab-42cd-4bbb-b33d-2c2ae7670c20');
console.log(`Found ${covers.length} album covers`);
```

### Latest Updates Dashboard

```javascript
async function getLatestUpdates() {
  const [movies, shows, music] = await Promise.all([
    client.getLatestMovies(),
    client.getLatestShows(),
    client.getLatestMusic()
  ]);
  
  return {
    movies: movies.slice(0, 10),  // Top 10
    shows: shows.slice(0, 10),
    music: music.slice(0, 10)
  };
}

const updates = await getLatestUpdates();
console.log('Latest Updates:');
console.log('Movies:', updates.movies.map(m => m.name));
console.log('Shows:', updates.shows.map(s => s.name));
console.log('Music:', updates.music.map(a => a.name));
```

## Compatibility Aliases

This package includes aliases for compatibility with existing packages:

```javascript
// These all work the same:
await client.getMovie(123);
await client.getMovieImages(123);

await client.getShow(456);
await client.getShowImages(456);

await client.getLatestMovies();
await client.getLatestMoviesImages();
```

## TypeScript Support

Full TypeScript definitions are included:

```typescript
import FanartTVClient, { FanartTVClientOptions, MovieResponse } from '@fanart-tv/api';

const options: FanartTVClientOptions = {
  apiKey: 'your-key',
  version: 'v3.2'
};

const client = new FanartTVClient(options);

const movie: MovieResponse = await client.getMovie(17645);
console.log(movie.image_count); // Type-safe!
```

## Requirements

- Node.js 18.0.0 or higher (for native `fetch` support)

## Migration Guide

### From `fanart.tv-api` (2.0.1)

```javascript
// OLD
const FanartTvApi = require('fanart.tv-api');
const fanart = new FanartTvApi({ apiKey: 'key' });

// NEW - Use version: 'v3' for drop-in compatibility
const FanartTVClient = require('@fanart-tv/api');
const fanart = new FanartTVClient({ apiKey: 'key', version: 'v3' });

// All methods work the same!
await fanart.getMovieImages(123);
```

### From `fanart.tv` (3.0.1)

```javascript
// OLD
const fanart = new(require('fanart.tv'))('your-api-key');
await fanart.movies.get(123);

// NEW - Use version: 'v3' for drop-in compatibility
const FanartTVClient = require('@fanart-tv/api');
const fanart = new FanartTVClient({ apiKey: 'your-api-key', version: 'v3' });
await fanart.getMovie(123);
```

## License

MIT License - Copyright (c) 2024 fanart.tv

## Links

- **API Documentation**: [https://api.fanart.tv](https://api.fanart.tv)
- **Get API Key**: [https://fanart.tv/get-an-api-key/](https://fanart.tv/get-an-api-key/)
- **npm Package**: [https://www.npmjs.com/package/@fanart-tv/api](https://www.npmjs.com/package/@fanart-tv/api)
- **GitHub Repository**: [https://github.com/fanart-tv/fanart.tv-api](https://github.com/fanart-tv/fanart.tv-api)
- **Report Issues**: [https://github.com/fanart-tv/fanart.tv-api/issues](https://github.com/fanart-tv/fanart.tv-api/issues)

## Support

For API support and questions:
- Visit the [API documentation](https://api.fanart.tv)
- Join the [fanart.tv community on Discord](https://discord.gg/r9VufRk)
- Report bugs on [GitHub Issues](https://github.com/fanart-tv/fanart.tv-api/issues)
