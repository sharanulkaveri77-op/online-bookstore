import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../../api/client';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import StatusBadge from '../../components/StatusBadge';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/admin/stats')
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  if (!stats) return <Spinner label="Loading dashboard…" />;

  const cards = [
    { label: 'Total revenue', value: money(stats.revenue), icon: '💰' },
    { label: 'Total orders', value: stats.total_orders, icon: '📦' },
    { label: 'Customers', value: stats.total_customers, icon: '👤' },
    { label: 'Books in store', value: stats.total_books, icon: '📚' }
  ];

  return (
    <div className="space-y-6">
      {error && <Alert message={error} onClose={() => setError(null)} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl border border-stone-200 p-5">
            <div className="text-2xl mb-2">{c.icon}</div>
            <p className="text-2xl font-bold text-stone-900">{c.value}</p>
            <p className="text-xs text-stone-500 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {stats.low_stock_count > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display text-lg font-semibold text-red-800">⚠️ Low stock alert</h2>
            <span className="text-xs font-bold text-red-700 bg-red-100 rounded-full px-2.5 py-1">
              {stats.low_stock_count} book{stats.low_stock_count === 1 ? '' : 's'} below 5 units
            </span>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.low_stock_books.map((b) => (
              <div key={b.id} className="flex items-center gap-3 bg-white rounded-xl border border-red-100 p-3">
                <img src={b.cover_image_url} alt="" className="w-9 h-12 object-cover rounded" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-stone-800 truncate">{b.title}</p>
                  <p className="text-xs text-stone-500">{b.category_name}</p>
                </div>
                <span className={`text-sm font-bold ${b.stock_qty === 0 ? 'text-red-600' : 'text-red-500'}`}>{b.stock_qty} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-lg font-semibold text-stone-900">Top 5 best sellers</h2>
            <Link to="/admin/books" className="text-xs font-medium text-amber-700 hover:text-amber-800">Manage books →</Link>
          </div>
          <div className="space-y-4">
            {stats.top_books.map((b, i) => {
              const max = Math.max(...stats.top_books.map((x) => x.units_sold), 1);
              return (
                <div key={b.id} className="flex items-center gap-3">
                  <span className="w-6 text-center font-bold text-stone-400 text-sm">{i + 1}</span>
                  <img src={b.cover_image_url} alt="" className="w-8 h-11 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-stone-800 truncate">{b.title}</p>
                    <div className="mt-1 h-1.5 rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-amber-700"
                        style={{ width: `${(b.units_sold / max) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-stone-700 shrink-0">{b.units_sold} sold</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">Recent orders</h2>
          <div className="space-y-3">
            {stats.recent_orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-3 py-2 border-b border-stone-100 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-stone-800 truncate">
                    #{String(o.id).padStart(4, '0')} · {o.customer_name}
                  </p>
                  <p className="text-xs text-stone-500">{o.created_at}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold">{money(o.total_amount)}</span>
                </div>
              </div>
            ))}
            {stats.recent_orders.length === 0 && <p className="text-sm text-stone-500">No orders yet.</p>}
          </div>
        </div>
      </div>

      {stats.alerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="font-display text-lg font-semibold text-stone-900 mb-4">Notifications <span className="text-xs font-normal text-stone-400">(email stub — logged in console)</span></h2>
          <div className="space-y-2">
            {stats.alerts.slice(0, 10).map((a, i) => (
              <div key={i} className="flex items-center justify-between gap-3 text-sm bg-stone-50 rounded-xl px-4 py-2.5">
                <span className="text-stone-700">{a.message}</span>
                <span className="text-xs text-stone-400 shrink-0">{new Date(a.at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
