import assert from 'assert';
import http from 'http';
import { createApp } from '../app';

async function runRouteTests() {
  console.log('--- Running Phase 2 Route Validation & RBAC Integration Tests ---');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // Test 1: Health check remains functional
    console.log('1. Testing GET /api/health...');
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(healthRes.status, 200, 'Health check should return 200');
    const healthBody = await healthRes.json();
    assert.strictEqual(healthBody.success, true);
    assert.strictEqual(healthBody.data.status, 'operational');
    console.log('✓ GET /api/health verified operational.');

    // Test 2: Protected route without token returns 401
    console.log('2. Testing GET /api/auth/me without token...');
    const meRes = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(meRes.status, 401, 'Unauthenticated request should return 401');
    const meBody = await meRes.json();
    assert.strictEqual(meBody.success, false);
    assert.strictEqual(meBody.error.code, 'UNAUTHORIZED');
    console.log('✓ Protected route correctly rejects unauthenticated request.');

    // Test 3: Farmer profile without token returns 401
    console.log('3. Testing GET /api/farmers/me without token...');
    const farmerRes = await fetch(`${baseUrl}/api/farmers/me`);
    assert.strictEqual(farmerRes.status, 401, 'Unauthenticated farmer request should return 401');
    console.log('✓ Farmer profile endpoint correctly enforces authentication.');

    // Test 4: Buyer profile without token returns 401
    console.log('4. Testing GET /api/buyers/me without token...');
    const buyerRes = await fetch(`${baseUrl}/api/buyers/me`);
    assert.strictEqual(buyerRes.status, 401, 'Unauthenticated buyer request should return 401');
    console.log('✓ Buyer profile endpoint correctly enforces authentication.');

    // Test 5: Registration rejects empty / invalid payload
    console.log('5. Testing POST /api/auth/register with empty payload...');
    const regEmptyRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(regEmptyRes.status, 400, 'Empty registration should return 400');
    const regEmptyBody = await regEmptyRes.json();
    assert.strictEqual(regEmptyBody.success, false);
    assert.strictEqual(regEmptyBody.error.code, 'VALIDATION_ERROR');
    console.log('✓ Empty registration payload correctly rejected.');

    // Test 6: Registration rejects ADMIN role attempt (Correction 4)
    console.log('6. Testing POST /api/auth/register with role ADMIN...');
    const regAdminRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Malicious Admin',
        email: 'admin@hack.local',
        password: 'AdminPassword123!',
        role: 'ADMIN',
        district: 'Central',
        state: 'State',
      }),
    });
    assert.strictEqual(regAdminRes.status, 400, 'Self-registration as ADMIN must return 400');
    const regAdminBody = await regAdminRes.json();
    assert.strictEqual(regAdminBody.success, false);
    assert.strictEqual(regAdminBody.error.code, 'INVALID_ROLE');
    console.log('✓ Public registration correctly blocks ADMIN self-registration.');

    // Test 7: Registration rejects password under 6 characters
    console.log('7. Testing POST /api/auth/register with short password...');
    const regShortRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ramesh Farmer',
        email: 'ramesh@test.com',
        password: '123',
        role: 'FARMER',
        district: 'Nashik',
        state: 'Maharashtra',
      }),
    });
    assert.strictEqual(regShortRes.status, 400, 'Short password must return 400');
    const regShortBody = await regShortRes.json();
    assert.strictEqual(regShortBody.success, false);
    assert.strictEqual(regShortBody.error.code, 'VALIDATION_ERROR');
    console.log('✓ Short password correctly rejected.');

    // Test 8: Login rejects empty payload
    console.log('8. Testing POST /api/auth/login with missing credentials...');
    const loginEmptyRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(loginEmptyRes.status, 400, 'Empty login should return 400');
    const loginEmptyBody = await loginEmptyRes.json();
    assert.strictEqual(loginEmptyBody.success, false);
    assert.strictEqual(loginEmptyBody.error.code, 'VALIDATION_ERROR');
    console.log('✓ Empty login payload correctly rejected.');

    console.log('--- All Route Integration Tests Passed Successfully ---');
  } finally {
    server.close();
  }
}

runRouteTests().catch((err) => {
  console.error('Route test execution failed:', err);
  process.exit(1);
});
