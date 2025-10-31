  /*
  # Bunker 24/7 - Sistema de Inventario para Minimarket

  ## Descripción
  Este esquema crea todas las tablas necesarias para un sistema completo de inventario
  de minimarket, incluyendo gestión de productos, categorías, proveedores, movimientos
  de inventario y alertas de stock.

  ## Nuevas Tablas

  ### 1. categories
  - `id` (uuid, primary key)
  - `name` (text) - Nombre de la categoría
  - `description` (text) - Descripción de la categoría
  - `created_at` (timestamptz) - Fecha de creación
  - `updated_at` (timestamptz) - Fecha de actualización

  ### 2. suppliers
  - `id` (uuid, primary key)
  - `name` (text) - Nombre del proveedor
  - `contact_name` (text) - Nombre del contacto
  - `email` (text) - Email del proveedor
  - `phone` (text) - Teléfono
  - `address` (text) - Dirección
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 3. products
  - `id` (uuid, primary key)
  - `name` (text) - Nombre del producto
  - `description` (text) - Descripción
  - `sku` (text, unique) - Código único del producto
  - `barcode` (text) - Código de barras
  - `category_id` (uuid, foreign key) - Referencia a categoría
  - `supplier_id` (uuid, foreign key) - Referencia a proveedor
  - `purchase_price` (numeric) - Precio de compra
  - `sale_price` (numeric) - Precio de venta
  - `current_stock` (integer) - Stock actual
  - `min_stock` (integer) - Stock mínimo (para alertas)
  - `max_stock` (integer) - Stock máximo
  - `unit` (text) - Unidad de medida (unidad, kg, litro, etc.)
  - `image_url` (text) - URL de la imagen del producto
  - `is_active` (boolean) - Si el producto está activo
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. inventory_movements
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key) - Referencia al producto
  - `movement_type` (text) - Tipo: 'entrada' o 'salida'
  - `quantity` (integer) - Cantidad del movimiento
  - `unit_price` (numeric) - Precio unitario
  - `total_price` (numeric) - Precio total
  - `reference` (text) - Referencia del movimiento (factura, pedido, etc.)
  - `notes` (text) - Notas adicionales
  - `created_by` (uuid) - Usuario que creó el movimiento
  - `created_at` (timestamptz)

  ### 5. stock_alerts
  - `id` (uuid, primary key)
  - `product_id` (uuid, foreign key) - Referencia al producto
  - `alert_type` (text) - Tipo: 'low_stock', 'out_of_stock', 'overstock'
  - `is_resolved` (boolean) - Si la alerta fue resuelta
  - `created_at` (timestamptz)
  - `resolved_at` (timestamptz) - Fecha de resolución

  ## Seguridad
  - Se habilita RLS en todas las tablas
  - Se crean políticas para que usuarios autenticados puedan gestionar todos los datos
  - Las alertas de stock se generan automáticamente mediante triggers
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contact_name text,
  email text,
  phone text,
  address text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  sku text UNIQUE NOT NULL,
  barcode text,
  category_id uuid REFERENCES categories(id) ON DELETE SET NULL,
  supplier_id uuid REFERENCES suppliers(id) ON DELETE SET NULL,
  purchase_price numeric(10,2) DEFAULT 0,
  sale_price numeric(10,2) DEFAULT 0,
  current_stock integer DEFAULT 0,
  min_stock integer DEFAULT 0,
  max_stock integer DEFAULT 1000,
  unit text DEFAULT 'unidad',
  image_url text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create inventory_movements table
CREATE TABLE IF NOT EXISTS inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  movement_type text NOT NULL CHECK (movement_type IN ('entrada', 'salida')),
  quantity integer NOT NULL,
  unit_price numeric(10,2) DEFAULT 0,
  total_price numeric(10,2) DEFAULT 0,
  reference text,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Create stock_alerts table
CREATE TABLE IF NOT EXISTS stock_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock')),
  is_resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_supplier ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_created_at ON inventory_movements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_product ON stock_alerts(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_alerts_resolved ON stock_alerts(is_resolved);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update product stock and create alerts
CREATE OR REPLACE FUNCTION update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product stock
  IF NEW.movement_type = 'entrada' THEN
    UPDATE products 
    SET current_stock = current_stock + NEW.quantity
    WHERE id = NEW.product_id;
  ELSIF NEW.movement_type = 'salida' THEN
    UPDATE products 
    SET current_stock = current_stock - NEW.quantity
    WHERE id = NEW.product_id;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update stock on inventory movements
DROP TRIGGER IF EXISTS trigger_update_product_stock ON inventory_movements;
CREATE TRIGGER trigger_update_product_stock
  AFTER INSERT ON inventory_movements
  FOR EACH ROW EXECUTE FUNCTION update_product_stock();

-- Function to check and create stock alerts
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
DECLARE
  v_min_stock integer;
  v_max_stock integer;
BEGIN
  -- Get min and max stock values
  SELECT min_stock, max_stock INTO v_min_stock, v_max_stock
  FROM products WHERE id = NEW.id;
  
  -- Check for out of stock
  IF NEW.current_stock = 0 THEN
    INSERT INTO stock_alerts (product_id, alert_type)
    VALUES (NEW.id, 'out_of_stock')
    ON CONFLICT DO NOTHING;
  -- Check for low stock
  ELSIF NEW.current_stock > 0 AND NEW.current_stock <= v_min_stock THEN
    INSERT INTO stock_alerts (product_id, alert_type)
    VALUES (NEW.id, 'low_stock')
    ON CONFLICT DO NOTHING;
  -- Check for overstock
  ELSIF NEW.current_stock > v_max_stock THEN
    INSERT INTO stock_alerts (product_id, alert_type)
    VALUES (NEW.id, 'overstock')
    ON CONFLICT DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to check stock alerts when product stock changes
DROP TRIGGER IF EXISTS trigger_check_stock_alerts ON products;
CREATE TRIGGER trigger_check_stock_alerts
  AFTER UPDATE OF current_stock ON products
  FOR EACH ROW EXECUTE FUNCTION check_stock_alerts();

-- Enable Row Level Security
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for categories
CREATE POLICY "Authenticated users can view categories"
  ON categories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for suppliers
CREATE POLICY "Authenticated users can view suppliers"
  ON suppliers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert suppliers"
  ON suppliers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update suppliers"
  ON suppliers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete suppliers"
  ON suppliers FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for products
CREATE POLICY "Authenticated users can view products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for inventory_movements
CREATE POLICY "Authenticated users can view inventory movements"
  ON inventory_movements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert inventory movements"
  ON inventory_movements FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update inventory movements"
  ON inventory_movements FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete inventory movements"
  ON inventory_movements FOR DELETE
  TO authenticated
  USING (true);

-- RLS Policies for stock_alerts
CREATE POLICY "Authenticated users can view stock alerts"
  ON stock_alerts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert stock alerts"
  ON stock_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update stock alerts"
  ON stock_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete stock alerts"
  ON stock_alerts FOR DELETE
  TO authenticated
  USING (true);