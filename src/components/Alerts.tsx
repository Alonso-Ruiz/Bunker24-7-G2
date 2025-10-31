import { useEffect, useState } from 'react';
import { supabase, StockAlert } from '../lib/supabase';
import { AlertTriangle, AlertCircle, TrendingUp, CheckCircle } from 'lucide-react';
import { showSuccess, showError } from '../lib/alerts';

export function Alerts() {
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    try {
      let query = supabase
        .from('stock_alerts')
        .select('*, products(name, sku, current_stock, min_stock, max_stock)')
        .order('created_at', { ascending: false });

      if (filter === 'unresolved') {
        query = query.eq('is_resolved', false);
      }

      const { data } = await query;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      await supabase
        .from('stock_alerts')
        .update({ is_resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', id);
      loadAlerts();
      showSuccess('Alerta resuelta', 'La alerta se marcó como resuelta.');
    } catch (error) {
      console.error('Error resolving alert:', error);
      showError('Error', 'No se pudo resolver la alerta.');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      case 'low_stock':
        return <AlertTriangle className="w-6 h-6 text-amber-600" />;
      case 'overstock':
        return <TrendingUp className="w-6 h-6 text-blue-600" />;
      default:
        return <AlertCircle className="w-6 h-6 text-slate-600" />;
    }
  };

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return 'bg-red-50 border-red-200';
      case 'low_stock':
        return 'bg-amber-50 border-amber-200';
      case 'overstock':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getAlertLabel = (type: string) => {
    switch (type) {
      case 'out_of_stock':
        return 'Sin Stock';
      case 'low_stock':
        return 'Stock Bajo';
      case 'overstock':
        return 'Sobrestock';
      default:
        return type;
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
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('unresolved')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'unresolved'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Pendientes
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            Todas
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {filter === 'unresolved' ? '¡Todo en orden!' : 'No hay alertas'}
            </h3>
            <p className="text-slate-600">
              {filter === 'unresolved'
                ? 'No hay alertas pendientes por revisar'
                : 'No se han generado alertas de stock'}
            </p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl shadow-sm border-2 p-6 transition-all ${
                alert.is_resolved ? 'bg-slate-50 border-slate-200 opacity-60' : getAlertColor(alert.alert_type)
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  <div className={alert.is_resolved ? 'opacity-50' : ''}>
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-slate-900">
                        {alert.products?.name}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          alert.alert_type === 'out_of_stock'
                            ? 'bg-red-100 text-red-700'
                            : alert.alert_type === 'low_stock'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {getAlertLabel(alert.alert_type)}
                      </span>
                      {alert.is_resolved && (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">
                          Resuelta
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-slate-600 mb-1">SKU</p>
                        <p className="font-medium text-slate-900">{alert.products?.sku}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Stock Actual</p>
                        <p className="font-bold text-slate-900">{alert.products?.current_stock}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-600 mb-1">Stock Mínimo</p>
                        <p className="font-medium text-slate-900">{alert.products?.min_stock}</p>
                      </div>
                    </div>

                    <p className="text-sm text-slate-600">
                      Creada el {new Date(alert.created_at).toLocaleDateString()} a las{' '}
                      {new Date(alert.created_at).toLocaleTimeString()}
                      {alert.resolved_at && (
                        <> • Resuelta el {new Date(alert.resolved_at).toLocaleDateString()}</>
                      )}
                    </p>
                  </div>
                </div>

                {!alert.is_resolved && (
                  <button
                    onClick={() => resolveAlert(alert.id)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors ml-4"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Resolver
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
