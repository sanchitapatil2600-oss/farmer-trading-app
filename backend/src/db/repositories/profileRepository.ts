import { query } from '../index';
import { 
  FarmerProfileRow, 
  BuyerProfileRow, 
  FarmerProfileResponse, 
  BuyerProfileResponse 
} from '../../types/database';

export function toFarmerProfileResponse(row: FarmerProfileRow): FarmerProfileResponse {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    village: row.village,
    district: row.district,
    state: row.state,
    profileImageUrl: row.profile_image_url,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export function toBuyerProfileResponse(row: BuyerProfileRow): BuyerProfileResponse {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    buyerType: row.buyer_type,
    organizationName: row.organization_name,
    city: row.city,
    district: row.district,
    state: row.state,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function getFarmerProfileByUserId(userId: string): Promise<FarmerProfileRow | null> {
  const result = await query<FarmerProfileRow>(
    'SELECT * FROM farmer_profiles WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function updateFarmerProfile(
  userId: string,
  data: {
    name?: string;
    village?: string;
    district?: string;
    state?: string;
    profileImageUrl?: string;
  }
): Promise<FarmerProfileRow> {
  const current = await getFarmerProfileByUserId(userId);
  if (!current) {
    throw new Error('Farmer profile not found for this user.');
  }

  const name = data.name !== undefined ? data.name.trim() : current.name;
  const village = data.village !== undefined ? (data.village.trim() || null) : current.village;
  const district = data.district !== undefined ? data.district.trim() : current.district;
  const state = data.state !== undefined ? data.state.trim() : current.state;
  const profileImageUrl = data.profileImageUrl !== undefined ? (data.profileImageUrl.trim() || null) : current.profile_image_url;

  const result = await query<FarmerProfileRow>(
    `UPDATE farmer_profiles
     SET name = $1, village = $2, district = $3, state = $4, profile_image_url = $5, updated_at = NOW()
     WHERE user_id = $6
     RETURNING *`,
    [name, village, district, state, profileImageUrl, userId]
  );

  return result.rows[0];
}

export async function getBuyerProfileByUserId(userId: string): Promise<BuyerProfileRow | null> {
  const result = await query<BuyerProfileRow>(
    'SELECT * FROM buyer_profiles WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  return result.rows[0] || null;
}

export async function updateBuyerProfile(
  userId: string,
  data: {
    name?: string;
    buyerType?: string;
    organizationName?: string;
    city?: string;
    district?: string;
    state?: string;
  }
): Promise<BuyerProfileRow> {
  const current = await getBuyerProfileByUserId(userId);
  if (!current) {
    throw new Error('Buyer profile not found for this user.');
  }

  const name = data.name !== undefined ? data.name.trim() : current.name;
  const buyerType = data.buyerType !== undefined ? (data.buyerType.trim() || null) : current.buyer_type;
  const organizationName = data.organizationName !== undefined ? (data.organizationName.trim() || null) : current.organization_name;
  const city = data.city !== undefined ? (data.city.trim() || null) : current.city;
  const district = data.district !== undefined ? data.district.trim() : current.district;
  const state = data.state !== undefined ? data.state.trim() : current.state;

  const result = await query<BuyerProfileRow>(
    `UPDATE buyer_profiles
     SET name = $1, buyer_type = $2, organization_name = $3, city = $4, district = $5, state = $6, updated_at = NOW()
     WHERE user_id = $7
     RETURNING *`,
    [name, buyerType, organizationName, city, district, state, userId]
  );

  return result.rows[0];
}
