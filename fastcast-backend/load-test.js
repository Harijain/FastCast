/**
 * FastCast – k6 Load Simulation Script
 *
 * Covers:
 *  1. Auth (register + login)
 *  2. Video list (cache warm + repeated hits)
 *  3. Video metadata by ID (cache comparison)
 *  4. Streaming startup (master.m3u8 latency = TTFF proxy)
 *  5. Concurrent user ramp-up (100 → 500)
 *
 * Run:
 *   k6 run load-test.js
 *
 * With custom base URL:
 *   k6 run -e BASE_URL=http://your-server:8080 load-test.js
 *
 * Install k6: https://k6.io/docs/getting-started/installation/
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// ── Custom metrics ────────────────────────────────────────────────────────────
const errorRate          = new Rate('fastcast_errors');
const ttffTrend          = new Trend('fastcast_ttff_ms',         true);
const cachedLatency      = new Trend('fastcast_cached_latency_ms', true);
const uncachedLatency    = new Trend('fastcast_uncached_latency_ms', true);
const successfulRequests = new Counter('fastcast_successful_requests');

// ── Config ────────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Pre-seed: put a READY video ID here after uploading one manually, or leave
// empty and the test will attempt to pick up the first video returned by the list.
const KNOWN_VIDEO_ID = __ENV.VIDEO_ID || '';

// ── Load profile ──────────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // Scenario 1: Ramp up to 100 concurrent users — baseline
    baseline: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '30s', target: 10  },  // warm up
        { duration: '60s', target: 100 },  // ramp to 100
        { duration: '60s', target: 100 },  // hold
        { duration: '15s', target: 0   },  // ramp down
      ],
      gracefulRampDown: '10s',
      exec: 'videoReadWorkload',
    },

    // Scenario 2: Spike test — burst to 500
    spike: {
      executor: 'ramping-vus',
      startVUs: 0,
      startTime: '3m',   // start after baseline
      stages: [
        { duration: '10s', target: 500 },  // spike
        { duration: '30s', target: 500 },  // hold spike
        { duration: '10s', target: 0   },  // recover
      ],
      gracefulRampDown: '10s',
      exec: 'videoReadWorkload',
    },

    // Scenario 3: Streaming TTFF — dedicated scenario
    streamingStartup: {
      executor: 'constant-vus',
      vus: 20,
      duration: '60s',
      startTime: '1m',
      exec: 'streamingWorkload',
    },
  },

  thresholds: {
    // PRD targets
    'http_req_duration{scenario:baseline}': ['p(95)<200'],      // <200ms cached API
    'fastcast_ttff_ms':                     ['p(95)<2000'],      // <2s streaming startup
    'fastcast_errors':                      ['rate<0.01'],       // <1% error rate
    'http_req_failed':                      ['rate<0.01'],
  },
};

// ── Shared state ──────────────────────────────────────────────────────────────
let authToken  = '';
let videoId    = KNOWN_VIDEO_ID;

// ── Setup: authenticate once and grab a video ID ──────────────────────────────
export function setup() {
  // Register or login
  const email    = `k6-user-${Date.now()}@fastcast.test`;
  const password = 'K6testpass1!';

  const regRes = http.post(
    `${BASE_URL}/api/v1/auth/register`,
    JSON.stringify({ name: 'k6 Bot', email, password }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  let token = '';
  if (regRes.status === 200) {
    token = regRes.json('data.token');
  } else {
    // Already registered — try login
    const loginRes = http.post(
      `${BASE_URL}/api/v1/auth/login`,
      JSON.stringify({ email, password }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    if (loginRes.status === 200) token = loginRes.json('data.token');
  }

  // Discover a READY video
  let vid = KNOWN_VIDEO_ID;
  if (!vid) {
    const listRes = http.get(
      `${BASE_URL}/api/v1/videos/by-status?status=READY`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (listRes.status === 200) {
      const videos = listRes.json('data');
      if (videos && videos.length > 0) vid = videos[0].id;
    }
  }

  return { token, videoId: vid };
}

// ── Main workload: metadata read (cache-heavy) ────────────────────────────────
export function videoReadWorkload(data) {
  const headers = {
    Authorization: `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  group('Video List', () => {
    // First call may be a cache miss; subsequent calls hit Redis
    const res = http.get(`${BASE_URL}/api/v1/videos`, { headers });
    const ok  = check(res, { 'list 200': (r) => r.status === 200 });
    errorRate.add(!ok);
    if (ok) successfulRequests.add(1);

    // Simulate cache-hit read (same endpoint twice)
    const res2 = http.get(`${BASE_URL}/api/v1/videos`, { headers });
    if (res2.status === 200) {
      cachedLatency.add(res2.timings.duration);
      successfulRequests.add(1);
    } else {
      errorRate.add(1);
    }
  });

  if (data.videoId) {
    group('Video Metadata', () => {
      // First hit: likely uncached
      const r1 = http.get(`${BASE_URL}/api/v1/videos/${data.videoId}`, { headers });
      const ok1 = check(r1, { 'metadata 200': (r) => r.status === 200 });
      errorRate.add(!ok1);
      if (ok1) {
        uncachedLatency.add(r1.timings.duration);
        successfulRequests.add(1);
      }

      // Second hit: should be cached
      const r2 = http.get(`${BASE_URL}/api/v1/videos/${data.videoId}`, { headers });
      const ok2 = check(r2, { 'metadata cached 200': (r) => r.status === 200 });
      errorRate.add(!ok2);
      if (ok2) {
        cachedLatency.add(r2.timings.duration);
        successfulRequests.add(1);
      }
    });

    group('Video Status', () => {
      const r = http.get(`${BASE_URL}/api/v1/videos/${data.videoId}/status`, { headers });
      const ok = check(r, { 'status 200': (r) => r.status === 200 });
      errorRate.add(!ok);
      if (ok) successfulRequests.add(1);
    });
  }

  group('Metrics', () => {
    const r = http.get(`${BASE_URL}/api/v1/metrics/summary`, { headers });
    check(r, { 'metrics 200': (r) => r.status === 200 });
  });

  sleep(Math.random() * 1 + 0.5); // think time: 0.5–1.5s
}

// ── Streaming workload: HLS startup latency ───────────────────────────────────
export function streamingWorkload(data) {
  if (!data.videoId) {
    sleep(1);
    return;
  }

  const headers = { Authorization: `Bearer ${data.token}` };

  group('HLS Startup (TTFF)', () => {
    const start = Date.now();
    const r = http.get(
      `${BASE_URL}/api/v1/stream/${data.videoId}/master.m3u8`,
      { headers }
    );
    const elapsed = Date.now() - start;

    const ok = check(r, {
      'master.m3u8 200': (res) => res.status === 200,
      'content is m3u8': (res) => res.body.includes('#EXTM3U'),
      'ttff < 2000ms':   () => elapsed < 2000,
    });

    ttffTrend.add(elapsed);
    errorRate.add(!ok);
    if (ok) successfulRequests.add(1);
  });

  group('Quality Playlist', () => {
    const r = http.get(
      `${BASE_URL}/api/v1/stream/${data.videoId}/720p/index.m3u8`,
      { headers }
    );
    const ok = check(r, { '720p playlist 200': (res) => res.status === 200 });
    errorRate.add(!ok);
  });

  group('Streaming Info', () => {
    const r = http.get(
      `${BASE_URL}/api/v1/stream/${data.videoId}/info`,
      { headers }
    );
    check(r, { 'info 200': (res) => res.status === 200 });
  });

  sleep(Math.random() * 2 + 1);
}

// ── Teardown: print summary ───────────────────────────────────────────────────
export function teardown(data) {
  console.log('=== FastCast Load Test Complete ===');
  console.log(`Token was: ${data.token ? 'obtained' : 'MISSING'}`);
  console.log(`Video ID tested: ${data.videoId || 'NONE (upload a READY video first)'}`);
}
