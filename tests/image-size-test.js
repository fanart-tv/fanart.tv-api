/**
 * Offline tests for image size handling - no API key required
 * Run with: node tests/image-size-test.js
 */

const assert = require('assert');
const { test } = require('node:test');
const FanartTVClient = require('../src/index.js');
const { IMAGE_SIZES } = FanartTVClient;

const FULL = 'https://assets.fanart.tv/fanart/music/76f88542-fd2f-47a1-9be0-5d55df793aab/albumcover/seul-69d81a74ee439.jpg';
const PREVIEW = 'https://assets.fanart.tv/preview/music/76f88542-fd2f-47a1-9be0-5d55df793aab/albumcover/seul-69d81a74ee439.jpg';
const BIGPREVIEW = 'https://assets.fanart.tv/bigpreview/music/76f88542-fd2f-47a1-9be0-5d55df793aab/albumcover/seul-69d81a74ee439.jpg';

test('IMAGE_SIZES export', () => {
  assert.deepStrictEqual(IMAGE_SIZES, ['full', 'preview', 'bigpreview']);
});

test('imageUrl() defaults to preview', () => {
  assert.strictEqual(FanartTVClient.imageUrl(FULL), PREVIEW);
});

test('imageUrl() converts between every size', () => {
  assert.strictEqual(FanartTVClient.imageUrl(FULL, 'bigpreview'), BIGPREVIEW);
  assert.strictEqual(FanartTVClient.imageUrl(PREVIEW, 'full'), FULL);
  assert.strictEqual(FanartTVClient.imageUrl(BIGPREVIEW, 'preview'), PREVIEW);
});

test('previewUrl(), bigPreviewUrl() and fullUrl() shortcuts', () => {
  assert.strictEqual(FanartTVClient.previewUrl(FULL), PREVIEW);
  assert.strictEqual(FanartTVClient.bigPreviewUrl(FULL), BIGPREVIEW);
  assert.strictEqual(FanartTVClient.fullUrl(BIGPREVIEW), FULL);
});

test('imageUrl() only touches the first path segment', () => {
  const tricky = 'https://assets.fanart.tv/fanart/movies/550/moviebackground/fanart-preview-4fa1c551a3e87.jpg';
  assert.strictEqual(
    FanartTVClient.imageUrl(tricky, 'preview'),
    'https://assets.fanart.tv/preview/movies/550/moviebackground/fanart-preview-4fa1c551a3e87.jpg'
  );
});

test('imageUrl() leaves non-fanart.tv URLs and non-strings unchanged', () => {
  assert.strictEqual(FanartTVClient.imageUrl('https://example.com/fanart/x.jpg', 'preview'), 'https://example.com/fanart/x.jpg');
  assert.strictEqual(FanartTVClient.imageUrl('https://assets.fanart.tv/other/x.jpg', 'preview'), 'https://assets.fanart.tv/other/x.jpg');
  assert.strictEqual(FanartTVClient.imageUrl(undefined, 'preview'), undefined);
  assert.strictEqual(FanartTVClient.imageUrl(null, 'preview'), null);
});

test('IMAGE_SIZES is frozen', () => {
  assert.ok(Object.isFrozen(IMAGE_SIZES));
});

test('imageUrl() rejects invalid sizes', () => {
  assert.throws(() => FanartTVClient.imageUrl(FULL, 'huge'), /imageSize must be one of/);
});

test('constructor validates imageSize', () => {
  assert.throws(() => new FanartTVClient({ apiKey: 'k', imageSize: 'thumb' }), /imageSize must be one of/);
  assert.strictEqual(new FanartTVClient({ apiKey: 'k' }).imageSize, 'full');
  assert.strictEqual(new FanartTVClient({ apiKey: 'k', imageSize: 'bigpreview' }).imageSize, 'bigpreview');
});

test('setImageSize() validates and updates', () => {
  const client = new FanartTVClient({ apiKey: 'k' });
  client.setImageSize('preview');
  assert.strictEqual(client.imageSize, 'preview');
  assert.throws(() => client.setImageSize('nope'), /imageSize must be one of/);
});

// Responses below go through the public request path with fetch stubbed out
function withResponse(body, fn) {
  const originalFetch = global.fetch;
  global.fetch = async () => ({ ok: true, status: 200, json: async () => body });
  return fn().finally(() => { global.fetch = originalFetch; });
}

const v32Response = () => ({
  name: 'Artist',
  mbid_id: 'abc',
  image_count: 3,
  artistbackground: [{ id: '1', url: FULL, lang: 'en', likes: '2' }],
  albums: [{ release_group_id: 'rg1', albumcover: [{ id: '2', url: FULL, lang: '00', likes: '0' }] }]
});

const v3Response = () => ({
  name: 'Artist',
  mbid_id: 'abc',
  albums: { rg1: { cdart: [{ id: '3', url: FULL, lang: '00', likes: '0' }] } }
});

test('responses are untouched when imageSize is full', () =>
  withResponse(v32Response(), async () => {
    const data = await new FanartTVClient({ apiKey: 'k' }).getArtist('abc');
    assert.strictEqual(data.artistbackground[0].url, FULL);
    assert.strictEqual(data.albums[0].albumcover[0].url, FULL);
  }));

test('nested urls in v3.2 responses are rewritten', () =>
  withResponse(v32Response(), async () => {
    const data = await new FanartTVClient({ apiKey: 'k', imageSize: 'preview' }).getArtist('abc');
    assert.strictEqual(data.artistbackground[0].url, PREVIEW);
    assert.strictEqual(data.albums[0].albumcover[0].url, PREVIEW);
    assert.strictEqual(data.name, 'Artist');
    assert.strictEqual(data.image_count, 3);
  }));

test('urls inside v3 album maps are rewritten', () =>
  withResponse(v3Response(), async () => {
    const data = await new FanartTVClient({ apiKey: 'k', version: 'v3', imageSize: 'bigpreview' }).getArtist('abc');
    assert.strictEqual(data.albums.rg1.cdart[0].url, BIGPREVIEW);
  }));

test('image size is fixed when the request is issued, not when it resolves', () =>
  withResponse(v32Response(), async () => {
    const client = new FanartTVClient({ apiKey: 'k', imageSize: 'preview' });
    const pending = client.getArtist('abc');
    client.setImageSize('full');
    assert.strictEqual((await pending).artistbackground[0].url, PREVIEW);
  }));

test('latest-style arrays and empty responses pass through', async () => {
  const client = new FanartTVClient({ apiKey: 'k', imageSize: 'preview' });
  const latest = () => [{ id: '1', name: 'x', new_images: '1', total_images: '2' }];
  await withResponse(latest(), async () => {
    assert.deepStrictEqual(await client.getLatestMovies(), latest());
  });
  await withResponse({}, async () => {
    assert.deepStrictEqual(await client.getMovie(1), {});
  });
});
