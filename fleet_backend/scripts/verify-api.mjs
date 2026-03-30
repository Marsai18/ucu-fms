/**
 * Smoke-test API routes (health, auth, major GET handlers).
 * Usage (from fleet_backend): npm run api:verify
 * Requires API running; uses demo-token (masai/masai123) unless VERIFY_* env overrides.
 */
import '../src/config/loadEnv.js';

const PORT = process.env.PORT || 5000;
const BASE =
  process.env.VERIFY_API_BASE?.replace(/\/$/, '') || `http://127.0.0.1:${PORT}`;

const DEMO_USER = process.env.VERIFY_DEMO_USER || 'masai';
const DEMO_PASS = process.env.VERIFY_DEMO_PASSWORD || 'masai123';

async function req(method, path, { token, body } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const r = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { _raw: text };
  }
  return { status: r.status, json, ok: r.ok };
}

function fail(msg) {
  console.error('FAIL:', msg);
  process.exit(1);
}

async function main() {
  console.log(`Base URL: ${BASE}\n`);

  let r = await req('GET', '/health');
  if (r.status !== 200 || r.json?.status !== 'OK') {
    fail(`/health → ${r.status} (is the backend running on ${BASE}?)`);
  }
  console.log('OK  GET /health');

  r = await req('GET', '/api/vehicles');
  if (r.status !== 401) {
    fail(`/api/vehicles without token → expected 401, got ${r.status}`);
  }
  console.log('OK  GET /api/vehicles → 401 without token');

  r = await req('POST', '/api/auth/demo-token', {
    body: { username: DEMO_USER, password: DEMO_PASS },
  });
  if (!r.ok || !r.json?.token) {
    console.error(r.json);
    fail(
      `/api/auth/demo-token failed (${r.status}). Set VERIFY_DEMO_USER / VERIFY_DEMO_PASSWORD or fix demo users in authController.`
    );
  }
  const token = r.json.token;
  console.log('OK  POST /api/auth/demo-token');

  const authedGets = [
    ['/api/auth/me', [200]],
    ['/api/vehicles', [200]],
    ['/api/drivers', [200]],
    ['/api/bookings', [200]],
    ['/api/trips', [200]],
    ['/api/dashboard/stats', [200]],
    ['/api/notifications', [200]],
    ['/api/users', [200]],
    ['/api/fuel', [200]],
    ['/api/fuel/statistics', [200]],
    ['/api/maintenance', [200]],
    ['/api/maintenance/alerts', [200]],
    ['/api/routes', [200]],
    ['/api/incidents', [200]],
  ];

  for (const [path, okStatuses] of authedGets) {
    const res = await req('GET', path, { token });
    if (!okStatuses.includes(res.status)) {
      console.error(path, res.status, res.json);
      fail(`${path} → ${res.status} (expected one of ${okStatuses.join(',')})`);
    }
    console.log(`OK  GET ${path} → ${res.status}`);
  }

  // Gate passes (admin create + public scan + driver list)
  r = await req('POST', '/api/gate-passes', {});
  if (r.status !== 401) {
    fail(`/api/gate-passes without token → expected 401, got ${r.status}`);
  }
  console.log('OK  POST /api/gate-passes → 401 without token');

  r = await req('POST', '/api/gate-passes/scan', {
    body: { token: 'invalid-token' },
  });
  if (r.status !== 404) {
    fail(`/api/gate-passes/scan with invalid token → expected 404, got ${r.status}`);
  }
  console.log('OK  POST /api/gate-passes/scan invalid token → 404');

  // Try real gate-pass generation with a trip
  const tripsRes = await req('GET', '/api/trips', { token });
  const trips = Array.isArray(tripsRes.json) ? tripsRes.json : [];
  const inProgressAssigned = trips.find(
    (t) => String(t.status || '').toLowerCase() === 'in progress' && t.driverId != null && String(t.driverId).trim() !== ''
  );
  if (inProgressAssigned) {
    const gpGen = await req('POST', '/api/gate-passes', { token, body: { tripId: inProgressAssigned.id } });
    if (!gpGen.ok) {
      console.error(gpGen.status, gpGen.json);
      fail(`/api/gate-passes generate → expected 201/200, got ${gpGen.status}`);
    }
    console.log('OK  POST /api/gate-passes generate (happy path)');
  } else {
    console.log('SKIP gate-pass generation (no in-progress assigned trips found)');
  }

  const driverTok = await req('POST', '/api/auth/demo-token', {
    body: { username: 'david.ssebunya@ucu.ac.ug', password: 'driver123' },
  });
  if (driverTok.ok && driverTok.json?.token) {
    const d = await req('GET', '/api/driver/profile', { token: driverTok.json.token });
    if (d.status !== 200) {
      console.error('/api/driver/profile', d.status, d.json);
      fail(`driver profile → ${d.status}`);
    }
    console.log('OK  GET /api/driver/profile (driver token) → 200');

    const gp = await req('GET', '/api/gate-passes/driver', { token: driverTok.json.token });
    if (!gp.ok) {
      console.error(gp.status, gp.json);
      fail('/api/gate-passes/driver → expected 200');
    }
    console.log('OK  GET /api/gate-passes/driver → 200');
  } else {
    console.log('SKIP GET /api/driver/profile (demo driver token failed)');
  }

  console.log('\nAll checked routes responded as expected.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
