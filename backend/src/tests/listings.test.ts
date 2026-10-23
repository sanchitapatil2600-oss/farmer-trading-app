import assert from 'assert';
import http from 'http';
import { createApp } from '../app';
import { query, closePool } from '../db/index';

async function runListingsTests() {
  console.log('--- Running Phase 3 Produce Listings Integration Tests ---');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    const timestamp = Date.now();

    // Helper: Register a user and return token and user ID
    async function registerUser(name: string, email: string, role: 'FARMER' | 'BUYER') {
      const payload: Record<string, unknown> = {
        name,
        email,
        password: 'TestPassword123!',
        role,
        district: 'Nashik',
        state: 'Maharashtra',
      };
      if (role === 'FARMER') {
        payload.village = 'Pimpalgaon';
      } else {
        payload.buyerType = 'Wholesaler';
      }

      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201, `Failed to register ${name}: ${JSON.stringify(body)}`);
      return {
        token: body.data.token as string,
        userId: body.data.user.id as string,
      };
    }

    console.log('Setting up test accounts (Farmer 1, Farmer 2, Buyer 1)...');
    const farmer1 = await registerUser('Farmer Ramesh', `farmer1_${timestamp}@test.com`, 'FARMER');
    const farmer2 = await registerUser('Farmer Suresh', `farmer2_${timestamp}@test.com`, 'FARMER');
    const buyer1 = await registerUser('Buyer Anita', `buyer1_${timestamp}@test.com`, 'BUYER');
    console.log('✓ Test accounts registered successfully.');

    // 1. POST /api/listings success for FARMER
    console.log('1. Testing POST /api/listings success for FARMER...');
    const uniqueCrop = `Test Wheat ${timestamp}`;
    const createRes = await fetch(`${baseUrl}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1.token}`,
      },
      body: JSON.stringify({
        cropName: uniqueCrop,
        description: 'Premium organic wheat test harvest',
        quantity: 100,
        unit: 'QUINTAL',
        expectedPricePerUnit: 2400,
        availabilityDate: '2026-11-15',
        village: 'Pimpalgaon',
        district: 'Nashik',
        state: 'Maharashtra',
      }),
    });

    assert.strictEqual(createRes.status, 201, 'POST /api/listings should return 201');
    const createBody = await createRes.json();
    assert.strictEqual(createBody.success, true);
    assert.ok(createBody.data.id, 'Listing ID should exist');
    assert.strictEqual(createBody.data.cropName, uniqueCrop);
    assert.strictEqual(createBody.data.farmerId, farmer1.userId);
    assert.strictEqual(createBody.data.status, 'ACTIVE');
    assert.strictEqual(createBody.data.unit, 'QUINTAL');
    const listingId = createBody.data.id as string;
    console.log(`✓ POST /api/listings succeeded with ID: ${listingId}`);

    // 2. POST /api/listings validation failures
    console.log('2. Testing POST /api/listings validation failures...');

    // 2a. Missing crop name
    const failEmptyCrop = await fetch(`${baseUrl}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1.token}`,
      },
      body: JSON.stringify({
        cropName: '',
        quantity: 100,
        unit: 'QUINTAL',
        expectedPricePerUnit: 2400,
        availabilityDate: '2026-11-15',
        district: 'Nashik',
        state: 'Maharashtra',
      }),
    });
    assert.strictEqual(failEmptyCrop.status, 400);

    // 2b. Zero / negative quantity
    const failNegativeQty = await fetch(`${baseUrl}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1.token}`,
      },
      body: JSON.stringify({
        cropName: 'Barley',
        quantity: -10,
        unit: 'QUINTAL',
        expectedPricePerUnit: 2400,
        availabilityDate: '2026-11-15',
        district: 'Nashik',
        state: 'Maharashtra',
      }),
    });
    assert.strictEqual(failNegativeQty.status, 400);

    // 2c. Invalid unit
    const failInvalidUnit = await fetch(`${baseUrl}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1.token}`,
      },
      body: JSON.stringify({
        cropName: 'Barley',
        quantity: 100,
        unit: 'INVALID_UNIT_XYZ',
        expectedPricePerUnit: 2400,
        availabilityDate: '2026-11-15',
        district: 'Nashik',
        state: 'Maharashtra',
      }),
    });
    assert.strictEqual(failInvalidUnit.status, 400);

    // 2d. Negative expected price
    const failNegativePrice = await fetch(`${baseUrl}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1.token}`,
      },
      body: JSON.stringify({
        cropName: 'Barley',
        quantity: 100,
        unit: 'QUINTAL',
        expectedPricePerUnit: -500,
        availabilityDate: '2026-11-15',
        district: 'Nashik',
        state: 'Maharashtra',
      }),
    });
    assert.strictEqual(failNegativePrice.status, 400);

    // 2e. Invalid date format
    const failInvalidDate = await fetch(`${baseUrl}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1.token}`,
      },
      body: JSON.stringify({
        cropName: 'Barley',
        quantity: 100,
        unit: 'QUINTAL',
        expectedPricePerUnit: 2400,
        availabilityDate: '15/11/2026', // Not YYYY-MM-DD
        district: 'Nashik',
        state: 'Maharashtra',
      }),
    });
    assert.strictEqual(failInvalidDate.status, 400);
    console.log('✓ Validation failures correctly rejected with 400.');

    // 3. BUYER cannot create listing
    console.log('3. Testing BUYER cannot create listing...');
    const buyerCreateRes = await fetch(`${baseUrl}/api/listings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({
        cropName: 'Unauthorized Crop',
        quantity: 50,
        unit: 'KG',
        expectedPricePerUnit: 100,
        availabilityDate: '2026-11-15',
        district: 'Pune',
        state: 'Maharashtra',
      }),
    });
    assert.strictEqual(buyerCreateRes.status, 403, 'Buyer should receive 403 Forbidden');
    const buyerCreateBody = await buyerCreateRes.json();
    assert.strictEqual(buyerCreateBody.error.code, 'FORBIDDEN');
    console.log('✓ Buyer correctly prohibited from creating produce listing.');

    // 4. GET marketplace listings
    console.log('4. Testing GET /api/listings...');
    const marketRes = await fetch(`${baseUrl}/api/listings`);
    assert.strictEqual(marketRes.status, 200);
    const marketBody = await marketRes.json();
    assert.strictEqual(marketBody.success, true);
    assert.ok(Array.isArray(marketBody.data), 'data should be an array');
    assert.ok(marketBody.pagination, 'pagination metadata should exist');
    console.log(`✓ GET /api/listings returned ${marketBody.data.length} listings.`);

    // 5. Search filter
    console.log('5. Testing search filter (?search=...)...');
    const searchRes = await fetch(`${baseUrl}/api/listings?search=${encodeURIComponent(uniqueCrop)}`);
    assert.strictEqual(searchRes.status, 200);
    const searchBody = await searchRes.json();
    assert.ok(searchBody.data.length >= 1, 'Should find listing matching search query');
    assert.strictEqual(searchBody.data[0].id, listingId);
    console.log('✓ Search query successfully retrieved target listing.');

    // 6. District filter
    console.log('6. Testing district filter (?district=Nashik)...');
    const distRes = await fetch(`${baseUrl}/api/listings?district=Nashik`);
    assert.strictEqual(distRes.status, 200);
    const distBody = await distRes.json();
    assert.ok(distBody.data.every((l: { district: string }) => l.district.toLowerCase() === 'nashik'));
    console.log('✓ District filter verified.');

    // 7. Status filter
    console.log('7. Testing status filter (?status=ACTIVE)...');
    const statusActiveRes = await fetch(`${baseUrl}/api/listings?status=ACTIVE`);
    assert.strictEqual(statusActiveRes.status, 200);
    const statusActiveBody = await statusActiveRes.json();
    assert.ok(statusActiveBody.data.every((l: { status: string }) => l.status === 'ACTIVE'));

    // 7b. Invalid status (e.g. DRAFT or CLOSED) must return 400
    const invalidStatusRes = await fetch(`${baseUrl}/api/listings?status=DRAFT`);
    assert.strictEqual(invalidStatusRes.status, 400, 'Invalid status DRAFT must return 400');
    console.log('✓ Status filter enforced (strictly ACTIVE / SOLD_OUT).');

    // 8. Pagination and limit <= 50
    console.log('8. Testing pagination bounds & limit <= 50...');
    const pageRes = await fetch(`${baseUrl}/api/listings?page=1&limit=5`);
    assert.strictEqual(pageRes.status, 200);
    const pageBody = await pageRes.json();
    assert.strictEqual(pageBody.pagination.limit, 5);

    // Limit exceeding 50 must return 400
    const limitExceedRes = await fetch(`${baseUrl}/api/listings?limit=51`);
    assert.strictEqual(limitExceedRes.status, 400, 'Limit > 50 must return 400');

    // Invalid page <= 0 must return 400
    const pageZeroRes = await fetch(`${baseUrl}/api/listings?page=0`);
    assert.strictEqual(pageZeroRes.status, 400, 'Page < 1 must return 400');
    console.log('✓ Pagination and limit <= 50 validation verified.');

    // 9. GET listing by valid UUID
    console.log('9. Testing GET /api/listings/:id with valid UUID...');
    const getByIdRes = await fetch(`${baseUrl}/api/listings/${listingId}`);
    assert.strictEqual(getByIdRes.status, 200);
    const getByIdBody = await getByIdRes.json();
    assert.strictEqual(getByIdBody.data.id, listingId);
    assert.strictEqual(getByIdBody.data.cropName, uniqueCrop);
    console.log('✓ GET /api/listings/:id returned expected listing.');

    // 10. GET invalid UUID returns clean 400
    console.log('10. Testing GET /api/listings/:id with invalid UUID format...');
    const invalidUuidRes = await fetch(`${baseUrl}/api/listings/not-a-valid-uuid-12345`);
    assert.strictEqual(invalidUuidRes.status, 400, 'Invalid UUID format must return 400');
    const invalidUuidBody = await invalidUuidRes.json();
    assert.strictEqual(invalidUuidBody.error.code, 'VALIDATION_ERROR');
    console.log('✓ Invalid UUID format correctly returns clean 400 Bad Request.');

    // 11. GET non-existent valid UUID returns 404
    console.log('11. Testing GET /api/listings/:id with non-existent valid UUID...');
    const nonExistentRes = await fetch(`${baseUrl}/api/listings/00000000-0000-0000-0000-000000000000`);
    assert.strictEqual(nonExistentRes.status, 404, 'Non-existent UUID must return 404');
    const nonExistentBody = await nonExistentRes.json();
    assert.strictEqual(nonExistentBody.error.code, 'NOT_FOUND');
    console.log('✓ Non-existent valid UUID correctly returns 404 Not Found.');

    // 12. GET /my returns only authenticated farmer's listings
    console.log('12. Testing GET /api/listings/my...');
    const farmer1MyRes = await fetch(`${baseUrl}/api/listings/my`, {
      headers: { Authorization: `Bearer ${farmer1.token}` },
    });
    assert.strictEqual(farmer1MyRes.status, 200);
    const farmer1MyBody = await farmer1MyRes.json();
    assert.ok(farmer1MyBody.data.some((l: { id: string }) => l.id === listingId));

    const farmer2MyRes = await fetch(`${baseUrl}/api/listings/my`, {
      headers: { Authorization: `Bearer ${farmer2.token}` },
    });
    assert.strictEqual(farmer2MyRes.status, 200);
    const farmer2MyBody = await farmer2MyRes.json();
    assert.ok(!farmer2MyBody.data.some((l: { id: string }) => l.id === listingId), 'Farmer 2 must not see Farmer 1 listing in /my');

    // Buyer cannot access /my
    const buyerMyRes = await fetch(`${baseUrl}/api/listings/my`, {
      headers: { Authorization: `Bearer ${buyer1.token}` },
    });
    assert.strictEqual(buyerMyRes.status, 403, 'Buyer should receive 403 on /my');
    console.log('✓ GET /api/listings/my correctly scopes to authenticated farmer.');

    // 13. PATCH non-owner returns 403
    console.log('13. Testing PATCH /api/listings/:id non-owner returns 403...');
    const patchNonOwnerRes = await fetch(`${baseUrl}/api/listings/${listingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer2.token}`,
      },
      body: JSON.stringify({ quantity: 80 }),
    });
    assert.strictEqual(patchNonOwnerRes.status, 403, 'Non-owner PATCH must return 403');
    const patchNonOwnerBody = await patchNonOwnerRes.json();
    assert.strictEqual(patchNonOwnerBody.error.code, 'FORBIDDEN');
    console.log('✓ Non-owner PATCH rejected with 403.');

    // 14. PATCH owner success
    console.log('14. Testing PATCH /api/listings/:id owner success...');
    const patchOwnerRes = await fetch(`${baseUrl}/api/listings/${listingId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1.token}`,
      },
      body: JSON.stringify({
        quantity: 85,
        expectedPricePerUnit: 2550,
      }),
    });
    assert.strictEqual(patchOwnerRes.status, 200, 'Owner PATCH must return 200');
    const patchOwnerBody = await patchOwnerRes.json();
    assert.strictEqual(patchOwnerBody.data.quantity, 85);
    assert.strictEqual(patchOwnerBody.data.expectedPricePerUnit, 2550);
    console.log('✓ Owner PATCH succeeded.');

    // 15. DELETE non-owner returns 403
    console.log('15. Testing DELETE /api/listings/:id non-owner returns 403...');
    const deleteNonOwnerRes = await fetch(`${baseUrl}/api/listings/${listingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${farmer2.token}` },
    });
    assert.strictEqual(deleteNonOwnerRes.status, 403, 'Non-owner DELETE must return 403');
    console.log('✓ Non-owner DELETE rejected with 403.');

    // 16. DELETE owner success
    console.log('16. Testing DELETE /api/listings/:id owner success...');
    const deleteOwnerRes = await fetch(`${baseUrl}/api/listings/${listingId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${farmer1.token}` },
    });
    assert.strictEqual(deleteOwnerRes.status, 200, 'Owner DELETE must return 200');

    // Confirm it no longer exists
    const checkDeletedRes = await fetch(`${baseUrl}/api/listings/${listingId}`);
    assert.strictEqual(checkDeletedRes.status, 404, 'Deleted listing must return 404');
    console.log('✓ Owner DELETE succeeded and listing is removed.');

    // 17. Audit events verification
    console.log('17. Verifying append-only audit trail records...');
    const auditResult = await query(
      `SELECT action, entity_type, entity_id, actor_user_id
       FROM audit_logs
       WHERE entity_id = $1
       ORDER BY created_at ASC`,
      [listingId]
    );

    assert.ok(auditResult.rows.length >= 3, 'Audit logs should contain CREATE, UPDATE, and DELETE events');
    const actions = auditResult.rows.map((r: { action: string }) => r.action);
    assert.ok(actions.includes('PRODUCE_LISTING_CREATED'), 'Should have PRODUCE_LISTING_CREATED');
    assert.ok(actions.includes('PRODUCE_LISTING_UPDATED'), 'Should have PRODUCE_LISTING_UPDATED');
    assert.ok(actions.includes('PRODUCE_LISTING_DELETED'), 'Should have PRODUCE_LISTING_DELETED');

    assert.ok(
      auditResult.rows.every((r: { actor_user_id: string }) => r.actor_user_id === farmer1.userId),
      'Actor user ID should match farmer 1'
    );
    console.log('✓ Audit trail verified for CREATE, UPDATE, and DELETE events.');

    console.log('--- All Phase 3 Produce Listings Integration Tests Passed Successfully ---');
  } finally {
    server.close();
    await closePool();
  }
}

runListingsTests().catch((err) => {
  console.error('Listings test execution failed:', err);
  process.exit(1);
});
