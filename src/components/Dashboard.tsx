import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Package, AlertTriangle, TrendingUp, TrendingDown, DollarSign, ShoppingCart } from 'lucide-react';

interface DashboardStats {
  totalProducts: number;
  lowStockProducts: number;
  totalValue: number;
  recentMovements: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    recentMovements: 0,
  });
  const [recentMovements, setRecentMovements] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [productsRes, alertsRes, movementsRes] = await Promise.all([
        supabase.from('products').select('*, categories(name)'),
        supabase.from('stock_alerts').select('*').eq('is_resolved', false),
        supabase
          .from('inventory_movements')
          .select('*, products(name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      const products = productsRes.data || [];
      const totalValue = products.reduce(
        (sum, p) => sum + (p.current_stock * p.sale_price),
        0
      );

      const topProductsList = [...products]
        .sort((a, b) => b.current_stock * b.sale_price - a.current_stock * a.sale_price)
        .slice(0, 5);

      setStats({
        totalProducts: products.length,
        lowStockProducts: alertsRes.data?.length || 0,
        totalValue,
        recentMovements: movementsRes.data?.length || 0,
      });

      setRecentMovements(movementsRes.data || []);
      setTopProducts(topProductsList);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Productos"
          value={stats.totalProducts}
          icon={Package}
          color="bg-blue-500"
        />
        <StatCard
          title="Stock Bajo"
          value={stats.lowStockProducts}
          icon={AlertTriangle}
          color="bg-amber-500"
        />
        <StatCard
          title="Valor Total"
          value={`$${stats.totalValue.toFixed(2)}`}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          title="Movimientos"
          value={stats.recentMovements}
          icon={ShoppingCart}
          color="bg-violet-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Movimientos Recientes</h3>
          <div className="space-y-3">
            {recentMovements.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No hay movimientos recientes</p>
            ) : (
              recentMovements.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {movement.movement_type === 'entrada' ? (
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900">{movement.products?.name}</p>
                      <p className="text-sm text-slate-500">
                        {movement.movement_type === 'entrada' ? 'Entrada' : 'Salida'} - {movement.quantity} unidades
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-slate-600">
                    ${movement.total_price.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Productos por Valor</h3>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No hay productos</p>
            ) : (
              topProducts.map((product) => {
                const value = product.current_stock * product.sale_price;
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{product.name}</p>
                      <p className="text-sm text-slate-500">
                        {product.current_stock} unidades - ${product.sale_price.toFixed(2)} c/u
                      </p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">
                      ${value.toFixed(2)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: any;
  color: string;
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{title}</p>
          <p className="text-2xl font-bold text-slate-900 mt-2">{value}</p>
        </div>
        <div className={`${color} w-12 h-12 rounded-lg flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
}
