export type ProduceUnit =
  | 'KG'
  | 'QUINTAL'
  | 'TON'
  | 'DOZEN'
  | 'BAG'
  | 'OTHER';

export type ProduceListingStatus =
  | 'ACTIVE'
  | 'SOLD_OUT';

export interface ProduceListingRow {
  id: string;
  farmer_id: string;
  crop_name: string;
  description: string | null;
  quantity: string;
  unit: ProduceUnit;
  expected_price_per_unit: string;
  availability_date: string;
  village: string | null;
  district: string;
  state: string;
  image_url: string | null;
  status: ProduceListingStatus;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProduceListingInput {
  farmerId: string;
  cropName: string;
  description?: string;
  quantity: number;
  unit: ProduceUnit;
  expectedPricePerUnit: number;
  availabilityDate: string;
  village?: string;
  district: string;
  state: string;
  imageUrl?: string;
}

export interface UpdateProduceListingInput {
  cropName?: string;
  description?: string | null;
  quantity?: number;
  unit?: ProduceUnit;
  expectedPricePerUnit?: number;
  availabilityDate?: string;
  village?: string | null;
  district?: string;
  state?: string;
  imageUrl?: string | null;
  status?: ProduceListingStatus;
}

export interface ProduceListingResponse {
  id: string;
  farmerId: string;
  cropName: string;
  description: string | null;
  quantity: number;
  unit: ProduceUnit;
  expectedPricePerUnit: number;
  availabilityDate: string;
  village: string | null;
  district: string;
  state: string;
  imageUrl: string | null;
  status: ProduceListingStatus;
  createdAt: string;
  updatedAt: string;
}