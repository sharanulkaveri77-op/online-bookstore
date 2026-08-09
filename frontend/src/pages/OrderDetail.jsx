import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, money, downloadPdf } from '../api/client';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import StatusBadge from '../components/StatusBadge';

export default function OrderDetail() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api(`/orders/${id}`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [id]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-3">🧾</p>
        <h1 className="font-display text-2xl font-semibold mb-2">Order not found</h1>
        <p className="text-stone-500">{error}</p>
        <Link to="/orders" className="inline-block mt-6 text-sm font-semibold text-amber-700 hover:text-amber-800">← Back to orders</Link>
      </div>
    );
  }

  if (!data) return <Spinner label="Loading order…" />;

  const { order, items } = data;

  const download = async () => {
    setDownloading(true);
    try {
      await downloadPdf(`/orders/${order.id}/invoice`);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/orders" className="text-sm font-medium text-stone-500 hover:text-stone-800">← All orders</Link>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold text-stone-900">Order #{String(order.id).padStart(4, '0')}</h1>
          <p className="text-sm text-stone-500 mt-1">Placed on {order.created_at}</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={order.status} />
          <button
            onClick={download}
            disabled={downloading}
            className="px-4 py-2.5 bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white rounded-xl font-semibold text-sm flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {downloading ? 'Generating…' : 'Download invoice (PDF)'}
          </button>
        </div>
      </div>

      {error && <Alert message={error} onClose={() => setError(null)} />}

      <div className="mt-8 bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="hidden sm:grid grid-cols-[1fr_80px_120px_120px] gap-4 px-6 py-3 bg-stone-50 border-b border-stone-200 text-xs font-semibold text-stone-500 uppercase tracking-wide">
          <span>Item</span>
          <span>Qty</span>
          <span className="text-right">Unit price</span>
          <span className="text-right">Total</span>
        </div>
        {items.map((item) => (
          <div key={item.id} className="grid grid-cols-[1fr_auto] sm:grid-cols-[1fr_80px_120px_120px] gap-2 sm:gap-4 items-center px-6 py-4 border-b border-stone-100">
            <div className="flex items-center gap-3 min-w-0">
              <img src={item.cover_image_url} alt="" className="w-10 h-14 object-cover rounded-md shrink-0" />
              <div className="min-w-0">
                <Link to={`/books/${item.book_id}`} className="text-sm font-medium text-stone-800 hover:text-amber-700 line-clamp-2">{item.title}</Link>
                <p className="text-xs text-stone-500">{item.author_name}</p>
              </div>
            </div>
            <span className="text-sm text-stone-600 sm:text-center">{item.quantity}</span>
            <span className="hidden sm:block text-sm text-stone-600 text-right">{money(item.price_at_purchase)}</span>
            <span className="text-sm font-semibold text-stone-900 text-right">{money(item.price_at_purchase * item.quantity)}</span>
          </div>
        ))}
        <div className="px-6 py-5 bg-stone-50">
          <div className="max-w-xs ml-auto space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal</span>
              <span>{money(data.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Coupon ({order.coupon_code})</span>
                <span>−{money(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between text-stone-600">
              <span>Shipping</span>
              <span className="text-emerald-700">Free</span>
            </div>
            <div className="flex justify-between font-bold text-stone-900 text-base pt-2 border-t border-stone-200">
              <span>Total</span>
              <span>{money(order.total_amount)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
