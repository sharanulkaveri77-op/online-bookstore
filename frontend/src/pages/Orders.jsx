import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api/client';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api('/orders')
      .then((d) => setOrders(d.orders))
      .catch((err) => setError(err.message));
  }, []);

  if (!orders) return <Spinner label="Loading your orders…" />;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-stone-900 mb-8">My orders</h1>
      {error && <Alert message={error} onClose={() => setError(null)} />}

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl">
          <p className="text-4xl mb-3">📦</p>
          <p className="font-semibold text-stone-800">No orders yet</p>
          <p className="text-sm text-stone-500 mt-1">Your order history will appear here.</p>
          <Link to="/books" className="inline-block mt-6 px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm">
            Start shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="block bg-white rounded-2xl border border-stone-200 p-5 hover:border-amber-600 hover:shadow-md transition-all"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-stone-900">
                    Order #{String(o.id).padStart(4, '0')}
                    <span className="ml-3 text-sm font-normal text-stone-500">{o.created_at}</span>
                  </p>
                  <p className="text-sm text-stone-500 mt-0.5">
                    {o.unit_count} item{o.unit_count === 1 ? '' : 's'}
                    {o.coupon_code && <span className="ml-2 text-xs font-semibold text-amber-700">Coupon {o.coupon_code}</span>}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <StatusBadge status={o.status} />
                  <span className="font-bold text-stone-900">{money(o.total_amount)}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
