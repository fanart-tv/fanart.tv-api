# Examples

This directory contains practical examples for using the @fanart-tv/api client.

## Rate Limit Handling

**File:** `rate-limit-handling.js`

Comprehensive examples showing how to handle rate limits when making multiple API requests:

1. **Basic Error Handling** - Simple try/catch pattern
2. **Batch Processing** - Process multiple items with retry logic
3. **Queue-Based Processing** - Control concurrency and add delays
4. **Exponential Backoff** - Progressive retry delays
5. **Caching Strategy** - Reduce API calls with intelligent caching

### Usage

```bash
# Set your API key
export FANART_API_KEY="your-api-key"

# Run the examples
node examples/rate-limit-handling.js
```

Uncomment the example functions at the bottom of the file to test different strategies.

## Best Practices

### For High-Volume Applications

1. **Use client_key** - Get faster access and potentially higher limits
2. **Implement caching** - Don't request the same data repeatedly
3. **Control concurrency** - Limit parallel requests (2-5 concurrent max)
4. **Add delays** - 100-200ms between requests is polite
5. **Handle 429s gracefully** - The client auto-retries, but you may need additional logic

### For Occasional Use

The client's built-in retry logic (up to 3 attempts) should handle most cases automatically. Just wrap your calls in try/catch:

```javascript
try {
  const movie = await client.getMovie(17645);
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Wait and retry manually if needed
  }
}
```

## Rate Limit Information

From the [fanart.tv API documentation](https://api.fanart.tv):

- Rate limits are applied **per API key**
- Limits vary based on usage patterns
- `client_key` users typically have higher limits
- 429 responses include `Retry-After` header (seconds)

The client automatically:
- ✅ Detects 429 responses
- ✅ Respects `Retry-After` header
- ✅ Retries up to 3 times
- ✅ Uses 1s default delay if no header

## Contributing Examples

Have a useful pattern for working with the API? Submit a PR with your example!
