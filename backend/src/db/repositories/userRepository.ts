import { query, withTransaction } from '../index';
import { 
  UserRow, 
  FarmerProfileRow, 
  BuyerProfileRow, 
  UserRole, 
  SafeUser 
} from '../../types/database';

export interface CreateFarmerInput {
  email?: string;
  phone?: string;
  passwordHash: string;
  name: string;
  village?: string;
  district: string;
  state: string;
}

export interface CreateBuyerInput {
  email?: string;
  phone?: string;
  passwordHash: string;
  name: string;
  buyerType?: string;
  organizationName?: string;
  city?: string;
  district: string;
  state: string;
}

export function toSafeUser(user: UserRow): SafeUser {
  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    role: user.role,
    status: user.status,
    createdAt: user.created_at.toISOString(),
  };
}

export async function findUserById(id: string): Promise<UserRow | null> {
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE id = $1 LIMIT 1',
    [id]
  );
  return result.rows[0] || null;
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE LOWER(email) = $1 LIMIT 1',
    [normalizedEmail]
  );
  return result.rows[0] || null;
}

export async function findUserByPhone(phone: string): Promise<UserRow | null> {
  const cleanPhone = phone.trim();
  const result = await query<UserRow>(
    'SELECT * FROM users WHERE phone = $1 LIMIT 1',
    [cleanPhone]
  );
  return result.rows[0] || null;
}

export async function findUserByIdentifier(identifier: string): Promise<UserRow | null> {
  const clean = identifier.trim();
  if (clean.includes('@')) {
    return findUserByEmail(clean);
  }
  return findUserByPhone(clean);
}

export async function createFarmerUser(input: CreateFarmerInput): Promise<{
  user: UserRow;
  profile: FarmerProfileRow;
}> {
  return withTransaction(async (client) => {
    // 1. Insert user
    const userRes = await client.query<UserRow>(
      `INSERT INTO users (email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, 'FARMER', 'ACTIVE')
       RETURNING *`,
      [input.email ? input.email.trim().toLowerCase() : null, input.phone?.trim() || null, input.passwordHash]
    );
    const user = userRes.rows[0];

    // 2. Insert farmer profile (General location only, exact private address never stored)
    const profileRes = await client.query<FarmerProfileRow>(
      `INSERT INTO farmer_profiles (user_id, name, village, district, state)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [user.id, input.name.trim(), input.village?.trim() || null, input.district.trim(), input.state.trim()]
    );
    const profile = profileRes.rows[0];

    // 3. Record audit log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'USER_REGISTERED', 'user', $2, $3)`,
      [
        user.id,
        user.id,
        JSON.stringify({ role: 'FARMER', district: input.district, state: input.state }),
      ]
    );

    return { user, profile };
  });
}

export async function createBuyerUser(input: CreateBuyerInput): Promise<{
  user: UserRow;
  profile: BuyerProfileRow;
}> {
  return withTransaction(async (client) => {
    // 1. Insert user
    const userRes = await client.query<UserRow>(
      `INSERT INTO users (email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, 'BUYER', 'ACTIVE')
       RETURNING *`,
      [input.email ? input.email.trim().toLowerCase() : null, input.phone?.trim() || null, input.passwordHash]
    );
    const user = userRes.rows[0];

    // 2. Insert buyer profile
    const profileRes = await client.query<BuyerProfileRow>(
      `INSERT INTO buyer_profiles (user_id, name, buyer_type, organization_name, city, district, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        user.id,
        input.name.trim(),
        input.buyerType?.trim() || null,
        input.organizationName?.trim() || null,
        input.city?.trim() || null,
        input.district.trim(),
        input.state.trim(),
      ]
    );
    const profile = profileRes.rows[0];

    // 3. Record audit log
    await client.query(
      `INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, 'USER_REGISTERED', 'user', $2, $3)`,
      [
        user.id,
        user.id,
        JSON.stringify({ role: 'BUYER', buyerType: input.buyerType, district: input.district, state: input.state }),
      ]
    );

    return { user, profile };
  });
}
