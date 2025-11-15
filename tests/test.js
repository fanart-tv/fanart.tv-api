/**
 * Basic test file - demonstrates usage
 * Run with: FANART_API_KEY=your_key node tests/test.js
 */

const FanartTVClient = require('../src/index.js');

async function runTests() {
  const apiKey = process.env.FANART_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: FANART_API_KEY environment variable not set');
    console.log('Usage: FANART_API_KEY=your_key node tests/test.js');
    process.exit(1);
  }

  console.log('🧪 Testing @fanart-tv/api\n');

  // Test 1: Constructor validation
  console.log('Test 1: Constructor validation...');
  try {
    new FanartTVClient({});
    console.log('❌ Should have thrown error for missing apiKey');
  } catch (error) {
    console.log('✅ Correctly throws error for missing apiKey');
  }

  // Test 2: Version validation
  console.log('\nTest 2: Version validation...');
  try {
    new FanartTVClient({ apiKey, version: 'v4' });
    console.log('❌ Should have thrown error for invalid version');
  } catch (error) {
    console.log('✅ Correctly throws error for invalid version');
  }

  // Initialize client
  const client = new FanartTVClient({
    apiKey,
    version: 'v3.2'
  });

  // Test 3: Get movie
  console.log('\nTest 3: Get movie data...');
  try {
    const movie = await client.getMovie(17645);
    console.log(`✅ Movie: ${movie.name} (TMDB: ${movie.tmdb_id})`);
    console.log(`   Images: ${movie.image_count || 'N/A'}`);
    console.log(`   Posters: ${movie.movieposter?.length || 0}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 4: Get TV show
  console.log('\nTest 4: Get TV show data...');
  try {
    const show = await client.getShow(121361);
    console.log(`✅ Show: ${show.name} (TVDB: ${show.thetvdb_id})`);
    console.log(`   Images: ${show.image_count || 'N/A'}`);
    console.log(`   Backgrounds: ${show.showbackground?.length || 0}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 5: Get music
  console.log('\nTest 5: Get music data...');
  try {
    const artist = await client.getArtist('f4a31f0a-51dd-4fa7-986d-3095c40c5ed9');
    console.log(`✅ Artist: ${artist.name} (MBID: ${artist.mbid_id})`);
    console.log(`   Images: ${artist.image_count || 'N/A'}`);
    const albumCount = Array.isArray(artist.albums) ? artist.albums.length : Object.keys(artist.albums || {}).length;
    console.log(`   Albums: ${albumCount}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 6: Latest movies
  console.log('\nTest 6: Get latest movies...');
  try {
    const latest = await client.getLatestMovies();
    console.log(`✅ Latest movies: ${latest.length} items`);
    if (latest.length > 0) {
      console.log(`   First: ${latest[0].name} (${latest[0].new_images} new images)`);
    }
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 7: Version switching
  console.log('\nTest 7: Version switching...');
  try {
    client.setVersion('v3');
    const movieV3 = await client.getMovie(17645);
    const hasV3Fields = movieV3.movieposter?.[0]?.id && movieV3.movieposter?.[0]?.url;
    const noV32Fields = !movieV3.image_count;
    console.log(`✅ v3 format: ${hasV3Fields && noV32Fields ? 'Correct' : 'Incorrect'}`);
    
    client.setVersion('v3.2');
    const movieV32 = await client.getMovie(17645);
    const hasV32Fields = movieV32.image_count !== undefined;
    console.log(`✅ v3.2 format: ${hasV32Fields ? 'Correct' : 'Incorrect'}`);
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  // Test 8: Compatibility aliases
  console.log('\nTest 8: Compatibility aliases...');
  try {
    const result1 = await client.getMovieImages(17645);
    const result2 = await client.getShowImages(121361);
    console.log('✅ Compatibility methods work');
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
  }

  console.log('\n✅ All tests completed!');
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
