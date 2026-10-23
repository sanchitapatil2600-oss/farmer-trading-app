import { query } from '../index';
import {
  CreateProduceListingInput,
  ProduceListingResponse,
  ProduceListingRow,
  ProduceListingStatus,
  UpdateProduceListingInput,
} from '../../types/produce';

export interface MarketplaceFilters {
  search?: string;
  district?: string;
  status?: ProduceListingStatus;
  page?: number;
  limit?: number;
}

export interface MarketplaceResult {
  listings: ProduceListingResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

function toProduceListingResponse(
  row: ProduceListingRow
): ProduceListingResponse {
  return {
    id: row.id,
    farmerId: row.farmer_id,
    cropName: row.crop_name,
    description: row.description,
    quantity: Number(row.quantity),
    unit: row.unit,
    expectedPricePerUnit: Number(row.expected_price_per_unit),
    availabilityDate: row.availability_date,
    village: row.village,
    district: row.district,
    state: row.state,
    imageUrl: row.image_url,
    status: row.status,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function createProduceListing(
  input: CreateProduceListingInput
): Promise<ProduceListingResponse> {
  const result = await query<ProduceListingRow>(
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
      image_url,
      status
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'ACTIVE')
    RETURNING *`,
    [
      input.farmerId,
      input.cropName.trim(),
      input.description?.trim() || null,
      input.quantity,
      input.unit,
      input.expectedPricePerUnit,
      input.availabilityDate,
      input.village?.trim() || null,
      input.district.trim(),
      input.state.trim(),
      input.imageUrl?.trim() || null,
    ]
  );

  return toProduceListingResponse(result.rows[0]);
}

export async function findProduceListingById(
  id: string
): Promise<ProduceListingResponse | null> {
  const result = await query<ProduceListingRow>(
    `SELECT *
     FROM produce_listings
     WHERE id = $1
     LIMIT 1`,
    [id]
  );

  return result.rows[0]
    ? toProduceListingResponse(result.rows[0])
    : null;
}

export async function findProduceListingsByFarmer(
  farmerId: string
): Promise<ProduceListingResponse[]> {
  const result = await query<ProduceListingRow>(
    `SELECT *
     FROM produce_listings
     WHERE farmer_id = $1
     ORDER BY created_at DESC`,
    [farmerId]
  );

  return result.rows.map(toProduceListingResponse);
}

export async function updateProduceListing(
  id: string,
  input: UpdateProduceListingInput
): Promise<ProduceListingResponse | null> {
  const fields: string[] = [];
  const values: unknown[] = [];
  let parameterIndex = 1;

  const addField = (column: string, value: unknown) => {
    fields.push(`${column} = $${parameterIndex}`);
    values.push(value);
    parameterIndex += 1;
  };

  if (input.cropName !== undefined) {
    addField('crop_name', input.cropName.trim());
  }

  if (input.description !== undefined) {
    addField(
      'description',
      input.description?.trim() || null
    );
  }

  if (input.quantity !== undefined) {
    addField('quantity', input.quantity);
  }

  if (input.unit !== undefined) {
    addField('unit', input.unit);
  }

  if (input.expectedPricePerUnit !== undefined) {
    addField(
      'expected_price_per_unit',
      input.expectedPricePerUnit
    );
  }

  if (input.availabilityDate !== undefined) {
    addField('availability_date', input.availabilityDate);
  }

  if (input.village !== undefined) {
    addField(
      'village',
      input.village?.trim() || null
    );
  }

  if (input.district !== undefined) {
    addField('district', input.district.trim());
  }

  if (input.state !== undefined) {
    addField('state', input.state.trim());
  }

  if (input.imageUrl !== undefined) {
    addField(
      'image_url',
      input.imageUrl?.trim() || null
    );
  }

  if (input.status !== undefined) {
    addField('status', input.status);
  }

  if (fields.length === 0) {
    return findProduceListingById(id);
  }

  addField('updated_at', new Date());

  values.push(id);

  const result = await query<ProduceListingRow>(
    `UPDATE produce_listings
     SET ${fields.join(', ')}
     WHERE id = $${parameterIndex}
     RETURNING *`,
    values
  );

  return result.rows[0]
    ? toProduceListingResponse(result.rows[0])
    : null;
}

export async function deleteProduceListing(
  id: string
): Promise<boolean> {
  const result = await query(
    `DELETE FROM produce_listings
     WHERE id = $1`,
    [id]
  );

  return result.rowCount === 1;
}

export async function findMarketplaceListings(
  filters: MarketplaceFilters = {}
): Promise<MarketplaceResult> {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 12));
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: unknown[] = [];
  let parameterIndex = 1;

  if (filters.search?.trim()) {
    conditions.push(
      `(crop_name ILIKE $${parameterIndex}
        OR district ILIKE $${parameterIndex})`
    );
    values.push(`%${filters.search.trim()}%`);
    parameterIndex += 1;
  }

  if (filters.district?.trim()) {
    conditions.push(
      `district ILIKE $${parameterIndex}`
    );
    values.push(filters.district.trim());
    parameterIndex += 1;
  }

  if (filters.status) {
    conditions.push(
      `status = $${parameterIndex}`
    );
    values.push(filters.status);
    parameterIndex += 1;
  }

  const whereClause =
    conditions.length > 0
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM produce_listings
     ${whereClause}`,
    values
  );

  const total = Number(countResult.rows[0]?.count ?? 0);

  const listingsResult = await query<ProduceListingRow>(
    `SELECT *
     FROM produce_listings
     ${whereClause}
     ORDER BY created_at DESC
     LIMIT $${parameterIndex}
     OFFSET $${parameterIndex + 1}`,
    [...values, limit, offset]
  );

  return {
    listings: listingsResult.rows.map(toProduceListingResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}