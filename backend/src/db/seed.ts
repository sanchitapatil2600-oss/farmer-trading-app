import { query } from './index';
import { hashPassword } from '../utils/password';

export async function runSeed(): Promise<void> {
  try {
    const passwordHash = await hashPassword('Password123!');

    // 1. Seed standard demo farmer
    const existingFarmer = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`,
      ['farmer@agrihub.local']
    );

    let farmerId: string;
    if (existingFarmer.rows.length === 0) {
      const farmerRes = await query<{ id: string }>(
        `INSERT INTO users (email, phone, password_hash, role)
         VALUES ($1, $2, $3, 'FARMER')
         RETURNING id`,
        ['farmer@agrihub.local', '9823012345', passwordHash]
      );
      farmerId = farmerRes.rows[0].id;

      await query(
        `INSERT INTO farmer_profiles (user_id, name, village, district, state)
         VALUES ($1, $2, $3, $4, $5)`,
        [farmerId, 'Ramesh Patil', 'Pimpalgaon Baswant', 'Nashik', 'Maharashtra']
      );
    } else {
      farmerId = existingFarmer.rows[0].id;
    }

    // 2. Seed standard demo buyer
    const existingBuyer = await query<{ id: string }>(
      `SELECT id FROM users WHERE email = $1`,
      ['buyer@agrihub.local']
    );

    let buyerId: string;
    if (existingBuyer.rows.length === 0) {
      const buyerRes = await query<{ id: string }>(
        `INSERT INTO users (email, phone, password_hash, role)
         VALUES ($1, $2, $3, 'BUYER')
         RETURNING id`,
        ['buyer@agrihub.local', '9823098765', passwordHash]
      );
      buyerId = buyerRes.rows[0].id;

      await query(
        `INSERT INTO buyer_profiles (user_id, name, buyer_type, organization_name, city, district, state)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [buyerId, 'Rohit Gupta', 'Wholesaler', 'Gupta Agro Trading', 'Vashi', 'Thane', 'Maharashtra']
      );
    } else {
      buyerId = existingBuyer.rows[0].id;
    }

    // 3. Seed produce listings if empty
    const listingCountRes = await query<{ count: string }>(
      `SELECT count(*) FROM produce_listings WHERE status = 'ACTIVE'`
    );
    const listingCount = parseInt(listingCountRes.rows[0].count, 10);

    if (listingCount === 0) {
      const sampleListings = [
        {
          cropName: 'Sharbati Golden Wheat',
          description: 'Premium grade harvest wheat from Pimpalgaon mandi cluster. Moisture content under 11%, machine-cleaned grain.',
          quantity: 80,
          unit: 'QUINTAL',
          expectedPricePerUnit: 2450,
          availabilityDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          village: 'Pimpalgaon Baswant',
          district: 'Nashik',
          state: 'Maharashtra',
        },
        {
          cropName: 'Nashik Red Onion (Garwa Grade)',
          description: 'Naturally dried summer harvest onion batch with solid pink outer peel, sorted for medium-to-large grading and 4-month shelf life.',
          quantity: 120,
          unit: 'QUINTAL',
          expectedPricePerUnit: 2150,
          availabilityDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          village: 'Lasalgaon Mandi Cluster',
          district: 'Nashik',
          state: 'Maharashtra',
        },
        {
          cropName: 'Yellow Soybean (JS 335)',
          description: 'Certified JS-335 bold yellow grain with high oil ratio (>19%), dry cleaned and bagged in standard 50kg jute packaging.',
          quantity: 60,
          unit: 'QUINTAL',
          expectedPricePerUnit: 4600,
          availabilityDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          village: 'Karanja Farmgate',
          district: 'Akola',
          state: 'Maharashtra',
        },
        {
          cropName: 'Desi Chana (Bengal Gram)',
          description: 'Unpolished desi gram grown in Marathwada deep black soil, minimal moisture and verified high protein content.',
          quantity: 50,
          unit: 'QUINTAL',
          expectedPricePerUnit: 5200,
          availabilityDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          village: 'Ausa APMC Cluster',
          district: 'Latur',
          state: 'Maharashtra',
        },
        {
          cropName: 'Alphonso Mango (Ratnagiri Export Grade)',
          description: 'Naturally ripened GI-tagged Ratnagiri Hapus mangoes, uniform grading (220-250g per fruit) packed in padded corrugated boxes.',
          quantity: 30,
          unit: 'QUINTAL',
          expectedPricePerUnit: 8500,
          availabilityDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          village: 'Deogad Coastal Belt',
          district: 'Ratnagiri',
          state: 'Maharashtra',
        },
      ];

      for (const item of sampleListings) {
        await query(
          `INSERT INTO produce_listings (
             farmer_id,
             crop_name,
             description,
             quantity,
             unit,
             expected_price_per_unit,
             availability_date,
             village,
             district,
             state,
             status
           )
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')`,
          [
            farmerId,
            item.cropName,
            item.description,
            item.quantity,
            item.unit,
            item.expectedPricePerUnit,
            item.availabilityDate,
            item.village,
            item.district,
            item.state,
          ]
        );
      }
      console.log(`[Seed] Seeded ${sampleListings.length} initial active produce listings.`);
    }

    console.log('[Seed] Database initialization and seed completed successfully.');
  } catch (err) {
    console.error('[Seed] Error running seed:', err);
  }
}

// If invoked directly from CLI
if (require.main === module) {
  runSeed().then(() => process.exit(0)).catch(() => process.exit(1));
}
