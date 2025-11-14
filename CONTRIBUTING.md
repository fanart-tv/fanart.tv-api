# Contributing to @fanart-tv/api

Thank you for your interest in contributing to the official fanart.tv API client!

## Development Setup

```bash
# Clone the repository
git clone https://github.com/fanart-tv/fanart.tv-api.git
cd fanart.tv-api

# No dependencies to install!
# This package uses zero dependencies (native fetch)
```

## Testing

To test the package, you'll need a fanart.tv API key:

1. Get your API key from [fanart.tv](https://fanart.tv/get-an-api-key/)
2. Run the test suite:

```bash
# Basic functionality test
node -e "const Client = require('./src/index.js'); console.log('✅ Loads OK');"

# Manual testing with your API key
node -e "
const Client = require('./src/index.js');
const client = new Client({ apiKey: 'YOUR_KEY', version: 'v3.2' });
client.getMovie(17645).then(m => console.log('✅ Works!', m.name));
"
```

## Code Style

- Use clear, descriptive variable names
- Add JSDoc comments for all public methods
- Keep functions focused and single-purpose
- Follow existing code formatting

## Pull Request Process

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Test your changes thoroughly
5. Commit with clear messages (`git commit -m 'Add amazing feature'`)
6. Push to your fork (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Reporting Bugs

Please open an issue with:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Your Node.js version
- Code example if possible

## Feature Requests

We welcome feature requests! Please open an issue describing:
- The feature you'd like
- Why it would be useful
- How it might work

## Questions?

- Check the [README](README.md) first
- Visit [api.fanart.tv](https://api.fanart.tv) for API documentation
- Open an issue for support

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
