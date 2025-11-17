/**
 * Rate limit handling test
 * This test demonstrates the automatic retry behavior
 * Run with: FANART_API_KEY=your_key node tests/rate-limit-test.js
 */

const FanartTVClient = require('../src/index.js');

// Mock fetch to simulate rate limiting
const originalFetch = global.fetch;
let callCount = 0;

global.fetch = async (url) => {
  callCount++;
  
  // Simulate 429 on first two calls, then succeed
  if (callCount <= 2) {
    console.log(`  📡 Request ${callCount}: Simulating 429 rate limit...`);
    return {
      status: 429,
      ok: false,
      headers: {
        get: (header) => header === 'Retry-After' ? '1' : null
      }
    };
  }
  
  // Third call succeeds
  console.log(`  📡 Request ${callCount}: Success!`);
  return {
    status: 200,
    ok: true,
    json: async () => ({
      name: 'Test Movie',
      tmdb_id: '12345',
      movieposter: []
    })
  };
};

async function testRateLimitHandling() {
  console.log('🧪 Testing rate limit handling\n');
  
  const client = new FanartTVClient({
    apiKey: 'test-key',
    version: 'v3.2'
  });

  console.log('Test 1: Automatic retry on 429');
  console.log('Expected: Client should retry automatically and succeed on 3rd attempt\n');
  
  try {
    callCount = 0;
    const result = await client.getMovie(12345);
    console.log(`\n✅ Success after ${callCount} attempts`);
    console.log(`   Response: ${result.name}`);
  } catch (error) {
    console.log(`\n❌ Failed: ${error.message}`);
  }

  // Test max retries exceeded
  console.log('\n\nTest 2: Max retries exceeded');
  console.log('Expected: Should fail after 3 retry attempts\n');
  
  // Mock persistent rate limiting
  global.fetch = async (url) => {
    callCount++;
    console.log(`  📡 Request ${callCount}: Simulating 429 rate limit...`);
    return {
      status: 429,
      ok: false,
      headers: {
        get: (header) => header === 'Retry-After' ? '1' : null
      }
    };
  };

  try {
    callCount = 0;
    await client.getMovie(12345);
    console.log('\n❌ Should have thrown an error');
  } catch (error) {
    console.log(`\n✅ Correctly failed after ${callCount} attempts`);
    console.log(`   Error: ${error.message}`);
  }

  // Restore original fetch
  global.fetch = originalFetch;
  
  console.log('\n✅ All rate limit tests completed!');
}

testRateLimitHandling().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
