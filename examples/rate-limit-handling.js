/**
 * Example: Handling Rate Limits
 * 
 * This example shows best practices for handling rate limits when
 * making multiple requests to the fanart.tv API.
 */

const FanartTVClient = require('@fanart-tv/api');

const client = new FanartTVClient({
  apiKey: process.env.FANART_API_KEY || 'your-api-key-here',
  clientKey: process.env.FANART_CLIENT_KEY, // Optional: for faster updates
  version: 'v3.2'
});

/**
 * Example 1: Basic error handling
 */
async function basicExample() {
  try {
    const movie = await client.getMovie(17645);
    console.log('✅ Movie:', movie.name);
  } catch (error) {
    if (error.message.includes('rate limit exceeded')) {
      console.error('⚠️ Rate limited - the client already retried 3 times');
      console.error('Consider implementing a backoff strategy');
    } else {
      console.error('❌ Error:', error.message);
    }
  }
}

/**
 * Example 2: Batch processing with rate limit handling
 */
async function batchProcessing(movieIds) {
  const results = [];
  
  for (const id of movieIds) {
    try {
      const movie = await client.getMovie(id);
      results.push({ id, success: true, data: movie });
      
      // Optional: Add small delay between requests to be nice to the API
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      if (error.message.includes('rate limit exceeded')) {
        console.log(`⚠️ Rate limited at movie ${id}, waiting 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Retry once more
        try {
          const movie = await client.getMovie(id);
          results.push({ id, success: true, data: movie });
        } catch (retryError) {
          results.push({ id, success: false, error: retryError.message });
        }
      } else {
        results.push({ id, success: false, error: error.message });
      }
    }
  }
  
  return results;
}

/**
 * Example 3: Queue-based processing with concurrency limit
 */
class RateLimitedQueue {
  constructor(client, concurrency = 2, delayMs = 200) {
    this.client = client;
    this.concurrency = concurrency;
    this.delayMs = delayMs;
    this.queue = [];
    this.running = 0;
  }

  async add(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.running >= this.concurrency || this.queue.length === 0) {
      return;
    }

    this.running++;
    const { fn, resolve, reject } = this.queue.shift();

    try {
      const result = await fn();
      await new Promise(r => setTimeout(r, this.delayMs));
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.running--;
      this.process();
    }
  }

  async processAll(items, fn) {
    const promises = items.map(item => this.add(() => fn(item)));
    return Promise.allSettled(promises);
  }
}

async function queueExample(movieIds) {
  const queue = new RateLimitedQueue(client, 2, 200); // Max 2 concurrent, 200ms delay
  
  const results = await queue.processAll(movieIds, async (id) => {
    const movie = await client.getMovie(id);
    return { id, name: movie.name };
  });

  const successful = results.filter(r => r.status === 'fulfilled');
  const failed = results.filter(r => r.status === 'rejected');
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  return results;
}

/**
 * Example 4: Exponential backoff strategy
 */
async function withExponentialBackoff(fn, maxRetries = 5) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (error.message.includes('rate limit exceeded')) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, 8s, 16s
        console.log(`⚠️ Rate limited, waiting ${waitTime/1000}s (attempt ${attempt + 1}/${maxRetries})`);
        
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else {
          throw new Error(`Max retries (${maxRetries}) exceeded`);
        }
      } else {
        throw error; // Not a rate limit error, rethrow
      }
    }
  }
}

async function exponentialBackoffExample() {
  try {
    const movie = await withExponentialBackoff(() => client.getMovie(17645));
    console.log('✅ Movie:', movie.name);
  } catch (error) {
    console.error('❌ Failed after all retries:', error.message);
  }
}

/**
 * Example 5: Caching to reduce API calls
 */
class CachedFanartClient {
  constructor(client, cacheTTL = 3600000) { // 1 hour default
    this.client = client;
    this.cache = new Map();
    this.cacheTTL = cacheTTL;
  }

  async getMovie(movieId) {
    const cacheKey = `movie:${movieId}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
      console.log(`📦 Cache hit for movie ${movieId}`);
      return cached.data;
    }

    console.log(`🌐 Fetching movie ${movieId} from API`);
    const data = await this.client.getMovie(movieId);
    
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
}

async function cachingExample() {
  const cachedClient = new CachedFanartClient(client, 3600000); // 1 hour cache
  
  // First call hits API
  await cachedClient.getMovie(17645);
  
  // Second call uses cache
  await cachedClient.getMovie(17645);
}

// Run examples (uncomment to test)
if (require.main === module) {
  console.log('🎬 Fanart.tv Rate Limit Handling Examples\n');
  
  // basicExample();
  
  // const movieIds = [17645, 121361, 12345];
  // batchProcessing(movieIds);
  
  // queueExample(movieIds);
  
  // exponentialBackoffExample();
  
  // cachingExample();
}

module.exports = {
  RateLimitedQueue,
  CachedFanartClient,
  withExponentialBackoff
};
