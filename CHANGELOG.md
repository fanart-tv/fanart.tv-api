# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-11-14

### Added
- Initial release of official fanart.tv API client
- Support for API versions v3, v3.1, and v3.2
- Zero dependencies - uses native fetch API
- Complete TypeScript definitions
- Full support for all endpoints:
  - Movies (by TMDB ID or IMDB ID)
  - TV Shows (by TheTVDB ID)
  - Music Artists (by MusicBrainz ID)
  - Music Albums (by MusicBrainz Release Group ID)
  - Music Labels (by MusicBrainz Label ID)
  - Latest updates for all categories
- `client_key` support for personal API access (faster updates)
- Runtime API version switching with `setVersion()`
- Compatibility aliases for existing packages
- Comprehensive documentation and examples
- Error handling with descriptive messages

### Features
- **v3 support**: Basic image fields (id, url, lang, likes)
- **v3.1 support**: Adds `added` timestamp field
- **v3.2 support**: Adds `width`, `height`, and `image_count` fields
- **Personal keys**: 2-day image delay vs 7-day for project keys
- **Type safety**: Full TypeScript definitions included
- **ES6 ready**: Modern JavaScript with async/await

### Documentation
- Comprehensive README with examples
- TypeScript definition file
- Example usage file with 6 practical examples
- Test suite demonstrating all features
- Publishing guide for maintainers
- MIT License

## [Unreleased]

### Planned
- Consider adding request retry logic
- Add optional caching layer
- Support for custom user agents
- Rate limiting helpers
- Batch request methods

---

## Version History

- **1.0.0** (2024-11-14) - Initial release

## Migration from Other Packages

### From `fanart.tv-api` (2.0.1)
```javascript
// OLD
const FanartTvApi = require('fanart.tv-api');
const fanart = new FanartTvApi({ apiKey: 'key' });

// NEW  
const FanartTVClient = require('@fanart-tv/api');
const fanart = new FanartTVClient({ apiKey: 'key' });
// All methods work the same!
```

### From `fanart.tv` (3.0.1)
```javascript
// OLD
const fanart = new(require('fanart.tv'))('your-api-key');
await fanart.movies.get(123);

// NEW
const FanartTVClient = require('@fanart-tv/api');
const fanart = new FanartTVClient({ apiKey: 'your-api-key' });
await fanart.getMovie(123);
```

## Support

- Report issues: https://github.com/fanart-tv/fanart.tv-api/issues
- API docs: https://api.fanart.tv
- Get API key: https://fanart.tv/get-an-api-key/
