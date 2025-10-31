import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Category {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  barcode: string | null;
  category_id: string | null;
  supplier_id: string | null;
  purchase_price: number;
  sale_price: number;
  current_stock: number;
  min_stock: number;
  max_stock: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category;
  suppliers?: Supplier;
}

export interface InventoryMovement {
  id: string;
  product_id: string;
  movement_type: 'entrada' | 'salida';
  quantity: number;
  unit_price: number;
  total_price: number;
  reference: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  products?: Product;
}

export interface StockAlert {
  id: string;
  product_id: string;
  alert_type: 'low_stock' | 'out_of_stock' | 'overstock';
  is_resolved: boolean;
  created_at: string;
  resolved_at: string | null;
  products?: Product;
}
