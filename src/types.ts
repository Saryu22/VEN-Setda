export interface InventoryItem {
  id: number;
  name: string;
  user_name: string;
  procurement_year: number;
  location: string;
  condition: 'Good' | 'Fair' | 'Poor' | 'Broken';
  specifications: string;
  photo_url: string;
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
