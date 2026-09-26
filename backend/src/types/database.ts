// ============================================================================
// Phase 2 Database Entities & Authentication Types
// Strictly adhering to docs/DATABASE.md, docs/PRD.md, and docs/SECURITY.md
// ============================================================================

export type UserRole = 'FARMER' | 'BUYER' | 'ADMIN';
export type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'DELETED';

export interface UserRow {
  id: string;
  email: string | null;
  phone: string | null;
  password_hash: string;
  role: UserRole;
  status: UserStatus;
  created_at: Date;
  updated_at: Date;
}

export interface FarmerProfileRow {
  id: string;
  user_id: string;
  name: string;
  village: string | null;
  district: string;
  state: string;
  profile_image_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface BuyerProfileRow {
  id: string;
  user_id: string;
  name: string;
  buyer_type: string | null;
  organization_name: string | null;
  city: string | null;
  district: string;
  state: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserSessionRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked_at: Date | null;
  created_at: Date;
}

export interface AuditLogRow {
  id: string;
  actor_user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

// User representation exposed to the client (password_hash is stripped)
export interface SafeUser {
  id: string;
  email: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface FarmerProfileResponse {
  id: string;
  userId: string;
  name: string;
  village: string | null;
  district: string;
  state: string;
  profileImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BuyerProfileResponse {
  id: string;
  userId: string;
  name: string;
  buyerType: string | null;
  organizationName: string | null;
  city: string | null;
  district: string;
  state: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthSessionPayload {
  user: SafeUser;
  farmerProfile?: FarmerProfileResponse | null;
  buyerProfile?: BuyerProfileResponse | null;
  token: string;
}
