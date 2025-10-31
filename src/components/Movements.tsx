import { useEffect, useState } from 'react';
import { supabase, InventoryMovement, Product } from '../lib/supabase';
import { Plus, TrendingUp, TrendingDown, Calendar, FileText } from 'lucide-react';
import { Modal } from './Modal';
import { showSuccess, showError } from '../lib/alerts';

export function Movements() {
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'entrada' | 'salida'>('all');
  const [formData, setFormData] = useState({
    product_id: '',
    movement_type: 'entrada' as 'entrada' | 'salida',
    quantity: 0,
    unit_price: 0,
    reference: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, [filterType]);

  const loadData = async () => {
    try {
      let query = supabase
        .from('inventory_movements')
        .select('*, products(name, sku, unit)')
        .order('created_at', { ascending: false });

      if (filterType !== 'all') {
        query = query.eq('movement_type', filterType);
      }

      const [movementsRes, productsRes] = await Promise.all([
        query,
        supabase.from('products').select('*').eq('is_active', true).order('name'),
      ]);

      setMovements(movementsRes.data || []);
      setProducts(productsRes.data || []);
    } catch (error) {
      console.error('Error loading movements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const total_price = formData.quantity * formData.unit_price;
      await supabase.from('inventory_movements').insert([
        {
          ...formData,
          total_price,
        },
      ]);
      showSuccess('Movimiento registrado', 'El movimiento se registró correctamente.');
      closeModal();
      loadData();
    } catch (error) {
      console.error('Error saving movement:', error);
      showError('Error', 'No se pudo guardar el movimiento.');
    }
  };

  const openModal = () => {
    setFormData({
      product_id: '',
      movement_type: 'entrada',
      quantity: 0,
      unit_price: 0,
      reference: '',
      notes: '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
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
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('entrada')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'entrada'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Entradas
          </button>
          <button
            onClick={() => setFilterType('salida')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filterType === 'salida'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Salidas
          </button>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nuevo Movimiento
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Producto
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Cantidad
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Precio Unit.
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Referencia
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    No hay movimientos disponibles
                  </td>
                </tr>
              ) : (
                movements.map((movement) => (
                  <tr key={movement.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm text-slate-900">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        {new Date(movement.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {movement.movement_type === 'entrada' ? (
                          <>
                            <TrendingUp className="w-5 h-5 text-emerald-600" />
                            <span className="text-sm font-medium text-emerald-600">Entrada</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="w-5 h-5 text-red-600" />
                            <span className="text-sm font-medium text-red-600">Salida</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-slate-900">
                          {movement.products?.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          SKU: {movement.products?.sku}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-slate-900">
                      {movement.quantity} {movement.products?.unit}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      ${movement.unit_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-slate-900">
                      ${movement.total_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {movement.reference ? (
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {movement.reference}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title="Nuevo Movimiento">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tipo de Movimiento *
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, movement_type: 'entrada' })}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.movement_type === 'entrada'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <TrendingUp className="w-5 h-5" />
                <span className="font-medium">Entrada</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, movement_type: 'salida' })}
                className={`flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  formData.movement_type === 'salida'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-slate-300 hover:border-slate-400'
                }`}
              >
                <TrendingDown className="w-5 h-5" />
                <span className="font-medium">Salida</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Producto *
            </label>
            <select
              required
              value={formData.product_id}
              onChange={(e) => setFormData({ ...formData, product_id: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Seleccionar producto...</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} (SKU: {product.sku}) - Stock: {product.current_stock}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Cantidad *
              </label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Precio Unitario *
              </label>
              <input
                type="number"
                step="0.01"
                required
                min="0"
                value={formData.unit_price}
                onChange={(e) =>
                  setFormData({ ...formData, unit_price: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Total
            </label>
            <div className="px-3 py-2 bg-slate-100 rounded-lg text-lg font-bold text-slate-900">
              ${(formData.quantity * formData.unit_price).toFixed(2)}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Referencia
            </label>
            <input
              type="text"
              placeholder="Ej: Factura #123, Pedido #456"
              value={formData.reference}
              onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Notas
            </label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Registrar Movimiento
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
