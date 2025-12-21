'use client';

import { useEffect, useState } from 'react';
import { apiGet, apiPost } from '@/lib/api';

enum LogisticsStatus {
  PAKET_HAZIRLANIYOR = 'PAKET_HAZIRLANIYOR',
  MERKEZ_SUBEDE = 'MERKEZ_SUBEDE',
  SEHIRE_ULASTI = 'SEHIRE_ULASTI',
  DAGITIMDA = 'DAGITIMDA',
  TESLIM_EDILDI = 'TESLIM_EDILDI',
  IPTAL_OLDU = 'IPTAL_OLDU',
}

const STATUS_LABELS: Record<LogisticsStatus, string> = {
  [LogisticsStatus.PAKET_HAZIRLANIYOR]: 'Paket Hazırlanıyor',
  [LogisticsStatus.MERKEZ_SUBEDE]: 'Merkez Şubede',
  [LogisticsStatus.SEHIRE_ULASTI]: 'Şehre Ulaştı',
  [LogisticsStatus.DAGITIMDA]: 'Dağıtımda',
  [LogisticsStatus.TESLIM_EDILDI]: 'Teslim Edildi',
  [LogisticsStatus.IPTAL_OLDU]: 'İptal Edildi',
};

const STATUS_COLORS: Record<LogisticsStatus, string> = {
  [LogisticsStatus.PAKET_HAZIRLANIYOR]: 'bg-blue-100 text-blue-700',
  [LogisticsStatus.MERKEZ_SUBEDE]: 'bg-purple-100 text-purple-700',
  [LogisticsStatus.SEHIRE_ULASTI]: 'bg-indigo-100 text-indigo-700',
  [LogisticsStatus.DAGITIMDA]: 'bg-orange-100 text-orange-700',
  [LogisticsStatus.TESLIM_EDILDI]: 'bg-green-100 text-green-700',
  [LogisticsStatus.IPTAL_OLDU]: 'bg-red-100 text-red-700',
};

export default function LogisticsDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const data = await apiGet('/orders');
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: LogisticsStatus) => {
    setUpdating(orderId);
    try {
      await apiPost(`/orders/${orderId}/status`, { status: newStatus });
      await fetchOrders();
    } catch (err) {
      console.error('Failed to update status', err);
      alert('Durum güncellenirken bir hata oluştu.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Lojistik Yönetim Paneli</h1>
            <p className="text-slate-500 text-sm">Gelen siparişleri yönetin ve durumlarını güncelleyin.</p>
          </div>
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-slate-200">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Toplam Sipariş</span>
            <div className="text-xl font-bold text-slate-900">{orders.length}</div>
          </div>
        </header>

        <div className="grid gap-4">
          {orders.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-dashed border-slate-300 text-center">
              <p className="text-slate-500">Henüz lojistik sistemine gönderilmiş bir sipariş bulunmuyor.</p>
            </div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-sm font-mono font-bold text-slate-400">#{order.erpOrderId.slice(0, 8)}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${STATUS_COLORS[order.status as LogisticsStatus]}`}>
                        {STATUS_LABELS[order.status as LogisticsStatus]}
                      </span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-lg">{order.customerName}</h3>
                    <p className="text-slate-500 text-sm">{order.shippingAddress.city}, {order.shippingAddress.country}</p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {Object.values(LogisticsStatus).map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(order.id, status)}
                        disabled={updating === order.id || order.status === status}
                        className={`px-3 py-1.5 rounded-md text-[11px] font-medium transition-all
                          ${order.status === status
                            ? 'bg-slate-900 text-white shadow-md'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }
                          disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-between items-center">
                  <div className="text-xs text-slate-400">
                    Son Güncelleme: {new Date(order.updatedAt).toLocaleString('tr-TR')}
                  </div>
                  <div className="text-sm font-bold text-slate-700">
                    {Number(order.totalAmount).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
