import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { BarChart3, TrendingUp, TrendingDown, Package, DollarSign } from 'lucide-react';

interface ReportData {
  totalInvestment: number;
  totalRevenue: number;
  profit: number;
  totalEntries: number;
  totalExits: number;
  productsByCategory: { category: string; count: number }[];
  lowStockProducts: { name: string; stock: number; minStock: number }[];
  topSellingProducts: { name: string; quantity: number }[];
}

export function Reports() {
  const [data, setData] = useState<ReportData>({
    totalInvestment: 0,
    totalRevenue: 0,
    profit: 0,
    totalEntries: 0,
    totalExits: 0,
    productsByCategory: [],
    lowStockProducts: [],
    topSellingProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const [movementsRes, productsRes] = await Promise.all([
        supabase.from('inventory_movements').select('*'),
        supabase.from('products').select('*, categories(name)'),
      ]);

      const movements = movementsRes.data || [];
      const products = productsRes.data || [];

      const entries = movements.filter((m) => m.movement_type === 'entrada');
      const exits = movements.filter((m) => m.movement_type === 'salida');

      const totalInvestment = entries.reduce((sum, m) => sum + m.total_price, 0);
      const totalRevenue = exits.reduce((sum, m) => sum + m.total_price, 0);

      const productsByCategory: { [key: string]: number } = {};
      products.forEach((p) => {
        const catName = p.categories?.name || 'Sin categoría';
        productsByCategory[catName] = (productsByCategory[catName] || 0) + 1;
      });

      const lowStockProducts = products
        .filter((p) => p.current_stock <= p.min_stock)
        .map((p) => ({
          name: p.name,
          stock: p.current_stock,
          minStock: p.min_stock,
        }))
        .slice(0, 5);

      const exitsByProduct: { [key: string]: { name: string; quantity: number } } = {};
      exits.forEach((exit) => {
        const productId = exit.product_id;
        if (!exitsByProduct[productId]) {
          const product = products.find((p) => p.id === productId);
          exitsByProduct[productId] = {
            name: product?.name || 'Desconocido',
            quantity: 0,
          };
        }
        exitsByProduct[productId].quantity += exit.quantity;
      });

      const topSellingProducts = Object.values(exitsByProduct)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      setData({
        totalInvestment,
        totalRevenue,
        profit: totalRevenue - totalInvestment,
        totalEntries: entries.length,
        totalExits: exits.length,
        productsByCategory: Object.entries(productsByCategory).map(([category, count]) => ({
          category,
          count,
        })),
        lowStockProducts,
        topSellingProducts,
      });
    } catch (error) {
      console.error('Error loading reports:', error);
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
          title="Inversión Total"
          value={`$${data.totalInvestment.toFixed(2)}`}
          icon={TrendingDown}
          color="bg-red-500"
        />
        <StatCard
          title="Ingresos Totales"
          value={`$${data.totalRevenue.toFixed(2)}`}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          title="Ganancia"
          value={`$${data.profit.toFixed(2)}`}
          icon={TrendingUp}
          color={data.profit >= 0 ? 'bg-blue-500' : 'bg-red-500'}
        />
        <StatCard
          title="Total Movimientos"
          value={data.totalEntries + data.totalExits}
          icon={BarChart3}
          color="bg-violet-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Package className="w-5 h-5 text-emerald-600" />
            Productos por Categoría
          </h3>
          <div className="space-y-3">
            {data.productsByCategory.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No hay datos</p>
            ) : (
              data.productsByCategory.map((item, index) => {
                const maxCount = Math.max(...data.productsByCategory.map((i) => i.count));
                const percentage = (item.count / maxCount) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{item.category}</span>
                      <span className="text-slate-600">{item.count} productos</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-emerald-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Productos Más Vendidos
          </h3>
          <div className="space-y-3">
            {data.topSellingProducts.length === 0 ? (
              <p className="text-slate-500 text-center py-4">No hay ventas registradas</p>
            ) : (
              data.topSellingProducts.map((item, index) => {
                const maxQuantity = Math.max(...data.topSellingProducts.map((i) => i.quantity));
                const percentage = (item.quantity / maxQuantity) * 100;
                return (
                  <div key={index}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{item.name}</span>
                      <span className="text-slate-600">{item.quantity} unidades</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingDown className="w-5 h-5 text-amber-600" />
          Productos con Stock Bajo
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Producto
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Stock Actual
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Stock Mínimo
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 uppercase">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {data.lowStockProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-500">
                    No hay productos con stock bajo
                  </td>
                </tr>
              ) : (
                data.lowStockProducts.map((item, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                    <td className="px-4 py-3 text-slate-600">{item.stock}</td>
                    <td className="px-4 py-3 text-slate-600">{item.minStock}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
                        Stock Bajo
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Entradas</p>
              <p className="text-3xl font-bold mt-2">{data.totalEntries}</p>
              <p className="text-emerald-100 text-sm mt-1">Movimientos de entrada</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-8 h-8" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-sm p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-red-100 text-sm font-medium">Total Salidas</p>
              <p className="text-3xl font-bold mt-2">{data.totalExits}</p>
              <p className="text-red-100 text-sm mt-1">Movimientos de salida</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <TrendingDown className="w-8 h-8" />
            </div>
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
