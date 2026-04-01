export interface InventoryItem {
  id: number;
  name: string;
  nibar: string;
  register_code: string;
  item_code: string;
  specifications: string;
  brand_type: string;
  procurement_year: number;
  user_name: string;
  user_status: string;
  user_position: string;
  location: string;
  condition: 'B' | 'RR' | 'RB';
  photo_url: string;
  notes: string;
  created_at: string;
}

export type NewInventoryItem = Omit<InventoryItem, 'id' | 'created_at'>;

export interface DamageReport {
  id: number;
  item_name: string;
  user_name: string;
  location: string;
  report_date: string;
  description: string;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  repair_location?: string;
  repair_date?: string;
  repair_description?: string;
  created_at: string;
}

export type NewDamageReport = Omit<DamageReport, 'id' | 'created_at'>;

export interface ItemRequest {
  id: number;
  item_name: string;
  user_name: string;
  department: string;
  request_date: string;
  reason: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export type NewItemRequest = Omit<ItemRequest, 'id' | 'created_at'>;
