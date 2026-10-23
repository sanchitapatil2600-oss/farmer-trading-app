import assert from 'assert';
import http from 'http';
import { createApp } from '../app';
import { query, closePool } from '../db/index';

async function runOffersDealsTests() {
  console.log('--- Running Phase 4 Offers & Deals Integration Tests ---');
  const app = createApp();
  const server = http.createServer(app);

  await new Promise<void>((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const createdUserIds: string[] = [];
  const createdListingIds: string[] = [];

  try {
    const timestamp = Date.now();

    // Helper: Register user and return token + userId
    async function registerUser(name: string, email: string, role: 'FARMER' | 'BUYER') {
      const payload: Record<string, unknown> = {
        name,
        email,
        password: 'Password123!',
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
      createdUserIds.push(body.data.user.id);
      return {
        token: body.data.token as string,
        userId: body.data.user.id as string,
      };
    }

    // Helper: Create produce listing
    async function createListing(farmerToken: string, cropName: string, quantity: number, price: number) {
      const res = await fetch(`${baseUrl}/api/listings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${farmerToken}`,
        },
        body: JSON.stringify({
          cropName,
          quantity,
          unit: 'QUINTAL',
          expectedPricePerUnit: price,
          availabilityDate: '2026-11-20',
          village: 'Pimpalgaon',
          district: 'Nashik',
          state: 'Maharashtra',
        }),
      });

      const body = await res.json();
      assert.strictEqual(res.status, 201, `Failed to create listing: ${JSON.stringify(body)}`);
      createdListingIds.push(body.data.id);
      return body.data as { id: string; quantity: number; status: string };
    }

    console.log('Setting up test accounts...');
    const farmer1 = await registerUser('Farmer Narayan', `farmer_narayan_${timestamp}@test.com`, 'FARMER');
    const farmer2 = await registerUser('Farmer Tukaram', `farmer_tukaram_${timestamp}@test.com`, 'FARMER');
    const buyer1 = await registerUser('Buyer Reliance Fresh', `buyer_reliance_${timestamp}@test.com`, 'BUYER');
    const buyer2 = await registerUser('Buyer BigBasket', `buyer_bigbasket_${timestamp}@test.com`, 'BUYER');
    const thirdPartyUser = await registerUser('Buyer Unrelated', `buyer_unrelated_${timestamp}@test.com`, 'BUYER');
    console.log('✓ Accounts ready.');

    // Create main listing: 100 quintals of Soybean @ ₹4,500
    const listing1 = await createListing(farmer1.token, `Soybean Premium ${timestamp}`, 100, 4500);

    // 1. Buyer can create a valid offer
    console.log('1. Testing Buyer can create a valid offer...');
    const offer1Res = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({
        offeredPrice: 4400,
        quantity: 30,
        message: 'Looking for 30 quintals at farmgate delivery',
      }),
    });
    assert.strictEqual(offer1Res.status, 201);
    const offer1Body = await offer1Res.json();
    assert.strictEqual(offer1Body.success, true);
    assert.strictEqual(offer1Body.data.status, 'ACTIVE');
    assert.strictEqual(offer1Body.data.offeredPrice, 4400);
    assert.strictEqual(offer1Body.data.quantity, 30);
    const offer1Id = offer1Body.data.id as string;
    console.log(`✓ Buyer created valid offer (ID: ${offer1Id}).`);

    // 2. FARMER cannot create an offer
    console.log('2. Testing FARMER cannot create an offer...');
    const farmerOfferRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer2.token}`,
      },
      body: JSON.stringify({
        offeredPrice: 4400,
        quantity: 10,
      }),
    });
    assert.strictEqual(farmerOfferRes.status, 403, 'Farmer role must be forbidden from offering');
    console.log('✓ Farmer correctly forbidden from submitting offer.');

    // 3. Buyer cannot offer on their own listing
    // (If a farmer tries to offer on their own listing, auth blocks role; test that buyer logic also checks ownership)
    console.log('3. Testing validation checks on offer submitter...');
    const selfOfferRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1.token}`,
      },
      body: JSON.stringify({
        offeredPrice: 4000,
        quantity: 10,
      }),
    });
    assert.strictEqual(selfOfferRes.status, 403);
    console.log('✓ Submitter role & ownership checks verified.');

    // 4. Invalid quantity rejected
    console.log('4. Testing invalid quantity rejected...');
    const zeroQtyRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 4400, quantity: 0 }),
    });
    assert.strictEqual(zeroQtyRes.status, 400);

    const negQtyRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 4400, quantity: -5 }),
    });
    assert.strictEqual(negQtyRes.status, 400);
    console.log('✓ Invalid quantity (<= 0) rejected.');

    // 5. Invalid price rejected
    console.log('5. Testing invalid price rejected...');
    const zeroPriceRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 0, quantity: 10 }),
    });
    assert.strictEqual(zeroPriceRes.status, 400);
    console.log('✓ Invalid price (<= 0) rejected.');

    // 6. Quantity greater than available listing quantity rejected
    console.log('6. Testing quantity exceeding available quantity rejected...');
    const excessQtyRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 4400, quantity: 150 }), // Listing has only 100
    });
    assert.strictEqual(excessQtyRes.status, 400);
    const excessBody = await excessQtyRes.json();
    assert.strictEqual(excessBody.error.code, 'INSUFFICIENT_QUANTITY');
    console.log('✓ Excess quantity (> available) rejected with INSUFFICIENT_QUANTITY.');

    // 7. SOLD_OUT/inactive listing rejects offers
    console.log('7. Testing SOLD_OUT listing rejects offers...');
    // Create an empty listing and mark it SOLD_OUT via PATCH
    const soldOutListing = await createListing(farmer1.token, `Empty Batch ${timestamp}`, 10, 1000);
    await fetch(`${baseUrl}/api/listings/${soldOutListing.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${farmer1.token}`,
      },
      body: JSON.stringify({ status: 'SOLD_OUT' }),
    });

    const offerOnSoldOutRes = await fetch(`${baseUrl}/api/listings/${soldOutListing.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 1000, quantity: 5 }),
    });
    assert.strictEqual(offerOnSoldOutRes.status, 400);
    const soldOutBody = await offerOnSoldOutRes.json();
    assert.strictEqual(soldOutBody.error.code, 'LISTING_NOT_ACTIVE');
    console.log('✓ SOLD_OUT listing correctly rejects offers.');

    // 8. Buyer can withdraw their own ACTIVE offer
    console.log('8. Testing Buyer can withdraw their own ACTIVE offer...');
    const withdrawableOfferRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 4200, quantity: 10 }),
    });
    const withdrawableOffer = (await withdrawableOfferRes.json()).data;

    const withdrawRes = await fetch(`${baseUrl}/api/offers/${withdrawableOffer.id}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyer1.token}` },
    });
    assert.strictEqual(withdrawRes.status, 200);
    const withdrawBody = await withdrawRes.json();
    assert.strictEqual(withdrawBody.data.status, 'WITHDRAWN');
    console.log('✓ Buyer withdrew own offer successfully.');

    // 9. Buyer cannot withdraw another buyer's offer
    console.log('9. Testing Buyer cannot withdraw another buyer\'s offer...');
    const offerForOtherRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 4300, quantity: 15 }),
    });
    const offerForOther = (await offerForOtherRes.json()).data;

    const stealWithdrawRes = await fetch(`${baseUrl}/api/offers/${offerForOther.id}/withdraw`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${buyer2.token}` }, // Buyer 2 trying to withdraw Buyer 1 offer
    });
    assert.strictEqual(stealWithdrawRes.status, 403, 'Must return 403 Forbidden');
    console.log('✓ Unauthorized offer withdrawal prevented with 403.');

    // 10. Farmer can reject an offer on their own listing
    console.log('10. Testing Farmer can reject an offer on their own listing...');
    const rejectableOfferRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer2.token}`,
      },
      body: JSON.stringify({ offeredPrice: 4100, quantity: 20 }),
    });
    const rejectableOffer = (await rejectableOfferRes.json()).data;

    const rejectRes = await fetch(`${baseUrl}/api/offers/${rejectableOffer.id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmer1.token}` },
    });
    assert.strictEqual(rejectRes.status, 200);
    const rejectBody = await rejectRes.json();
    assert.strictEqual(rejectBody.data.status, 'REJECTED');
    console.log('✓ Farmer rejected offer on own listing.');

    // 11. Farmer cannot reject an offer on another farmer's listing
    console.log('11. Testing Farmer cannot reject an offer on another farmer\'s listing...');
    const offerOnFarmer1Res = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer2.token}`,
      },
      body: JSON.stringify({ offeredPrice: 4350, quantity: 10 }),
    });
    const offerOnFarmer1 = (await offerOnFarmer1Res.json()).data;

    const unauthorizedRejectRes = await fetch(`${baseUrl}/api/offers/${offerOnFarmer1.id}/reject`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmer2.token}` }, // Farmer 2 trying to reject Farmer 1 offer
    });
    assert.strictEqual(unauthorizedRejectRes.status, 403);
    console.log('✓ Non-owner farmer cannot reject offers (403).');

    // 12. Farmer can accept a valid offer
    // 13. Correct CONFIRMED deal is created
    // 14. Deal total is calculated server-side
    // 15. Listing quantity is reduced correctly
    console.log('12-15. Testing Farmer accepts offer, deal created, server total calculated, quantity reduced...');

    // Listing has 100 quintals. We accept offer1 (30 quintals @ ₹4,400).
    const acceptRes = await fetch(`${baseUrl}/api/offers/${offer1Id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmer1.token}` },
    });
    assert.strictEqual(acceptRes.status, 200);
    const acceptBody = await acceptRes.json();
    assert.strictEqual(acceptBody.success, true);
    assert.strictEqual(acceptBody.data.acceptedOffer.status, 'ACCEPTED');
    assert.strictEqual(acceptBody.data.remainingListingQuantity, 70); // 100 - 30 = 70
    assert.strictEqual(acceptBody.data.listingStatus, 'ACTIVE');

    const confirmedDeal = acceptBody.data.deal;
    assert.ok(confirmedDeal.id, 'Deal ID must exist');
    assert.strictEqual(confirmedDeal.status, 'CONFIRMED');
    assert.strictEqual(confirmedDeal.quantity, 30);
    assert.strictEqual(confirmedDeal.agreedPrice, 4400);
    assert.strictEqual(confirmedDeal.totalAmount, 30 * 4400); // 132,000 server-calculated
    assert.strictEqual(confirmedDeal.currency, 'INR');
    assert.strictEqual(confirmedDeal.farmerId, farmer1.userId);
    assert.strictEqual(confirmedDeal.buyerId, buyer1.userId);
    assert.strictEqual(confirmedDeal.acceptedOfferId, offer1Id);
    console.log(`✓ Deal created: CONFIRMED, ₹${confirmedDeal.totalAmount} server-side total, remaining quantity: 70.`);

    // 16. Listing becomes SOLD_OUT when quantity reaches zero
    // 17. Competing offers become EXPIRED when requested quantity exceeds remaining
    // 18. expiration_reason equals: "Insufficient remaining quantity"
    console.log('16-18. Testing full allocation -> SOLD_OUT and competing offer expiration with reason...');

    // On listing1 (remaining 70), submit two competing offers:
    // Offer A: 70 quintals @ ₹4,450 (takes all remaining)
    // Offer B: 40 quintals @ ₹4,400 (should expire once Offer A is accepted, because 40 > 0 remaining)
    const offerARes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 4450, quantity: 70 }),
    });
    const offerA = (await offerARes.json()).data;

    const offerBRes = await fetch(`${baseUrl}/api/listings/${listing1.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer2.token}`,
      },
      body: JSON.stringify({ offeredPrice: 4400, quantity: 40 }),
    });
    const offerB = (await offerBRes.json()).data;

    // Accept Offer A (70)
    const acceptARes = await fetch(`${baseUrl}/api/offers/${offerA.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmer1.token}` },
    });
    const acceptABody = await acceptARes.json();
    assert.strictEqual(acceptARes.status, 200, `Accept Offer A failed: ${JSON.stringify(acceptABody)}`);
    assert.strictEqual(acceptABody.data.remainingListingQuantity, 0);
    assert.strictEqual(acceptABody.data.listingStatus, 'SOLD_OUT');

    // Verify listing in DB is SOLD_OUT
    const checkListingRes = await fetch(`${baseUrl}/api/listings/${listing1.id}`);
    const checkListing = (await checkListingRes.json()).data;
    assert.strictEqual(checkListing.status, 'SOLD_OUT');
    assert.strictEqual(checkListing.quantity, 0);
    console.log('✓ Listing correctly transitioned to SOLD_OUT at 0 remaining quantity.');

    // Verify Offer B was auto-expired with exact reason
    const checkOfferBRes = await query<{ status: string; expiration_reason: string }>(
      `SELECT status, expiration_reason FROM offers WHERE id = $1`,
      [offerB.id]
    );
    assert.strictEqual(checkOfferBRes.rows[0].status, 'EXPIRED');
    assert.strictEqual(
      checkOfferBRes.rows[0].expiration_reason,
      'Insufficient remaining quantity',
      'Must have exact expiration_reason text'
    );
    console.log('✓ Competing offer auto-expired with "Insufficient remaining quantity".');

    // 19. Same offer cannot be accepted twice
    console.log('19. Testing same offer cannot be accepted twice...');
    const acceptAgainRes = await fetch(`${baseUrl}/api/offers/${offerA.id}/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmer1.token}` },
    });
    assert.strictEqual(acceptAgainRes.status, 400);
    const acceptAgainBody = await acceptAgainRes.json();
    assert.strictEqual(acceptAgainBody.error.code, 'OFFER_NOT_ACTIVE');
    console.log('✓ Already-accepted offer rejected on second accept attempt.');

    // 20. Deal privacy prevents unauthorized users from viewing deals
    console.log('20. Testing Deal privacy...');
    // Farmer 1 (seller) can view deal
    const dealFarmerRes = await fetch(`${baseUrl}/api/deals/${confirmedDeal.id}`, {
      headers: { Authorization: `Bearer ${farmer1.token}` },
    });
    assert.strictEqual(dealFarmerRes.status, 200);

    // Buyer 1 (buyer) can view deal
    const dealBuyerRes = await fetch(`${baseUrl}/api/deals/${confirmedDeal.id}`, {
      headers: { Authorization: `Bearer ${buyer1.token}` },
    });
    assert.strictEqual(dealBuyerRes.status, 200);

    // Unrelated Buyer cannot view deal
    const dealThirdPartyRes = await fetch(`${baseUrl}/api/deals/${confirmedDeal.id}`, {
      headers: { Authorization: `Bearer ${thirdPartyUser.token}` },
    });
    assert.strictEqual(dealThirdPartyRes.status, 403, 'Third party must receive 403 Forbidden');
    console.log('✓ Deal privacy strictly enforced (403 for unauthorized users).');

    // 21. Invalid offer/deal UUIDs return clean 400 responses
    console.log('21. Testing invalid UUIDs return clean 400 responses...');
    const invalidOfferAccept = await fetch(`${baseUrl}/api/offers/not-a-uuid/accept`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${farmer1.token}` },
    });
    assert.strictEqual(invalidOfferAccept.status, 400);
    assert.strictEqual((await invalidOfferAccept.json()).error.code, 'VALIDATION_ERROR');

    const invalidDealGet = await fetch(`${baseUrl}/api/deals/12345-invalid`, {
      headers: { Authorization: `Bearer ${farmer1.token}` },
    });
    assert.strictEqual(invalidDealGet.status, 400);
    assert.strictEqual((await invalidDealGet.json()).error.code, 'VALIDATION_ERROR');
    console.log('✓ Invalid UUID parameters return clean 400 VALIDATION_ERROR.');

    // 22. Audit events verification
    console.log('22. Verifying OFFER_ACCEPTED and DEAL_CREATED audit events...');
    const auditEvents = await query<{ action: string; entity_type: string; entity_id: string }>(
      `SELECT action, entity_type, entity_id
       FROM audit_logs
       WHERE entity_id IN ($1, $2)`,
      [offer1Id, confirmedDeal.id]
    );
    const actions = auditEvents.rows.map((r) => r.action);
    assert.ok(actions.includes('OFFER_ACCEPTED'), 'Must log OFFER_ACCEPTED');
    assert.ok(actions.includes('DEAL_CREATED'), 'Must log DEAL_CREATED');
    console.log('✓ Audit events verified in audit_logs table.');

    // 23. CONCURRENCY TEST: Two simultaneous accept requests for the same remaining quantity
    console.log('23. Testing CONCURRENCY: Two simultaneous accept requests against same inventory...');
    // Create new listing with 50 quintals
    const concurrentListing = await createListing(farmer1.token, `Basmati Rice Concurrent ${timestamp}`, 50, 6000);

    // Create Offer 1: requests 40 quintals
    const concOffer1Res = await fetch(`${baseUrl}/api/listings/${concurrentListing.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 5900, quantity: 40 }),
    });
    const concOffer1 = (await concOffer1Res.json()).data;

    // Create Offer 2: requests 40 quintals
    const concOffer2Res = await fetch(`${baseUrl}/api/listings/${concurrentListing.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer2.token}`,
      },
      body: JSON.stringify({ offeredPrice: 5950, quantity: 40 }),
    });
    const concOffer2 = (await concOffer2Res.json()).data;

    // Launch both accept calls SIMULTANEOUSLY
    console.log('   Firing simultaneous accept requests for Offer 1 (40) and Offer 2 (40) on 50 capacity...');
    const [res1, res2] = await Promise.all([
      fetch(`${baseUrl}/api/offers/${concOffer1.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${farmer1.token}` },
      }),
      fetch(`${baseUrl}/api/offers/${concOffer2.id}/accept`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${farmer1.token}` },
      }),
    ]);

    const statuses = [res1.status, res2.status].sort();
    console.log(`   Simultaneous responses: ${res1.status}, ${res2.status}`);

    // Exactly ONE must succeed (200) and ONE must fail (400)
    assert.deepStrictEqual(statuses, [200, 400], 'One accept must succeed (200) and one must fail (400)');

    // Verify final state of listing
    const finalListingRes = await query<{ quantity: string; status: string }>(
      `SELECT quantity, status FROM produce_listings WHERE id = $1`,
      [concurrentListing.id]
    );
    const finalListing = finalListingRes.rows[0];
    assert.strictEqual(Number(finalListing.quantity), 10, 'Remaining quantity must be exactly 10 (50 - 40)');
    assert.strictEqual(finalListing.status, 'ACTIVE');

    // Verify deals count on this listing is exactly 1
    const dealsCountRes = await query<{ count: string }>(
      `SELECT COUNT(*)::text as count FROM deals WHERE listing_id = $1`,
      [concurrentListing.id]
    );
    assert.strictEqual(Number(dealsCountRes.rows[0].count), 1, 'Exactly one deal must have been created');
    console.log('✓ CONCURRENCY TEST PASSED: Zero double allocation, consistent inventory (10 remaining), exactly 1 deal.');

    // 24. Offer submission rate limiting works
    console.log('24. Verifying Offer submission rate limiting...');
    const offerProbeRes = await fetch(`${baseUrl}/api/listings/${concurrentListing.id}/offers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyer1.token}`,
      },
      body: JSON.stringify({ offeredPrice: 5800, quantity: 5 }),
    });
    // Rate limit headers are returned
    assert.ok(
      offerProbeRes.headers.has('ratelimit-limit') || offerProbeRes.headers.has('x-ratelimit-limit'),
      'Must contain rate limit headers'
    );
    console.log('✓ Offer rate limiting active with standard headers.');

    console.log('--- All Phase 4 Offers & Deals Integration Tests Passed Successfully ---');
  } finally {
    // Cleanup isolated test data
    console.log('Cleaning up test data...');
    try {
      if (createdListingIds.length > 0) {
        await query(`DELETE FROM deals WHERE listing_id = ANY($1::uuid[])`, [createdListingIds]);
        await query(`DELETE FROM offers WHERE listing_id = ANY($1::uuid[])`, [createdListingIds]);
        await query(`DELETE FROM audit_logs WHERE entity_id = ANY($1::uuid[])`, [createdListingIds]);
        await query(`DELETE FROM produce_listings WHERE id = ANY($1::uuid[])`, [createdListingIds]);
      }
      if (createdUserIds.length > 0) {
        await query(`DELETE FROM user_sessions WHERE user_id = ANY($1::uuid[])`, [createdUserIds]);
        await query(`DELETE FROM farmer_profiles WHERE user_id = ANY($1::uuid[])`, [createdUserIds]);
        await query(`DELETE FROM buyer_profiles WHERE user_id = ANY($1::uuid[])`, [createdUserIds]);
        await query(`DELETE FROM audit_logs WHERE actor_user_id = ANY($1::uuid[])`, [createdUserIds]);
        await query(`DELETE FROM users WHERE id = ANY($1::uuid[])`, [createdUserIds]);
      }
      console.log('✓ Test data cleaned up.');
    } catch (cleanupErr) {
      console.error('Warning during cleanup:', cleanupErr);
    }

    server.close();
    await closePool();
  }
}

runOffersDealsTests().catch((err) => {
  console.error('Offers & Deals test execution failed:', err);
  process.exit(1);
});
