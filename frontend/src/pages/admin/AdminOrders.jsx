import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../api/client';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';

const STATUSES = ['pending', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => api('/admin/orders').then((d) => setOrders(d.orders));

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  if (!orders) return <Spinner label="Loading orders…" />;

  const updateStatus = async (order, status) => {
    setError(null);
    setMsg(null);
    try {
      await api(`/admin/orders/${order.id}/status`, { method: 'PUT', body: { status } });
      setMsg(`Order #${String(order.id).padStart(4, '0')} marked as ${status}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <h2 className="font-display text-xl font-semibold text-stone-900 mb-5">Orders</h2>
      {error && <Alert message={error} onClose={() => setError(null)} />}
      {msg && <Alert type="success" message={msg} onClose={() => setMsg(null)} />}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="bg-stone-50 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Items</th>
                <th className="px-5 py-3">Total</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {orders.map((o) => (
                <tr key={o.id} className="hover:bg-stone-50">
                  <td className="px-5 py-3">
                    <Link to={`/orders/${o.id}`} className="font-semibold text-stone-800 hover:text-amber-700">
                      #{String(o.id).padStart(4, '0')}
                    </Link>
                    <p className="text-xs text-stone-500">{o.created_at}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="font-medium text-stone-800">{o.customer_name}</p>
                    <p className="text-xs text-stone-500">{o.customer_email}</p>
                  </td>
                  <td className="px-5 py-3 text-stone-600">{o.item_count} line{o.item_count === 1 ? '' : 's'}</td>
                  <td className="px-5 py-3">
                    <span className="font-semibold">{money(o.total_amount)}</span>
                    {o.coupon_code && <span className="ml-1.5 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">{o.coupon_code}</span>}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end">
                      <select
                        value={o.status}
                        onChange={(e) => updateStatus(o, e.target.value)}
                        className="rounded-lg border border-stone-300 px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/40"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-stone-500">No orders yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
