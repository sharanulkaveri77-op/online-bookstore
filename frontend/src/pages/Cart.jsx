import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, money } from '../api/client';
import { useCart } from '../context/CartContext';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

export default function Cart() {
  const { refresh } = useCart();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () => {
    api('/cart')
      .then(setData)
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const updateQty = async (item, qty) => {
    setBusy(true);
    try {
      await api(`/cart/${item.id}`, { method: 'PUT', body: { quantity: qty } });
      await refresh();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item) => {
    setBusy(true);
    try {
      await api(`/cart/${item.id}`, { method: 'DELETE' });
      await refresh();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!data) return <Spinner label="Loading cart…" />;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-stone-900 mb-8">Your cart</h1>
      {error && <Alert message={error} onClose={() => setError(null)} />}

      {data.items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl">
          <p className="text-4xl mb-3">🛒</p>
          <p className="font-semibold text-stone-800">Your cart is empty</p>
          <p className="text-sm text-stone-500 mt-1">Find a book worth reading.</p>
          <Link to="/books" className="inline-block mt-6 px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm">
            Browse books
          </Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_340px] gap-8 items-start">
          <div className="space-y-4">
            {data.items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-stone-200 p-4 flex gap-4">
                <Link to={`/books/${item.book_id}`} className="shrink-0">
                  <img src={item.cover_image_url} alt={item.title} className="w-20 h-27 object-cover rounded-lg" style={{ aspectRatio: '3/4' }} />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-4">
                    <div className="min-w-0">
                      <Link to={`/books/${item.book_id}`} className="font-semibold text-stone-900 hover:text-amber-700 line-clamp-2">{item.title}</Link>
                      <p className="text-sm text-stone-500 mt-0.5">{item.author_name}</p>
                      {item.quantity > item.stock_qty && (
                        <p className="text-xs text-red-600 mt-1">Only {item.stock_qty} in stock — adjust quantity</p>
                      )}
                    </div>
                    <p className="font-semibold text-stone-900 shrink-0">{money(item.price * item.quantity)}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center rounded-lg border border-stone-300 overflow-hidden">
                      <button onClick={() => updateQty(item, item.quantity - 1)} disabled={busy || item.quantity <= 1} className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40" aria-label="Decrease">−</button>
                      <span className="w-9 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQty(item, item.quantity + 1)} disabled={busy} className="px-3 py-1.5 text-stone-600 hover:bg-stone-100 disabled:opacity-40" aria-label="Increase">+</button>
                    </div>
                    <button onClick={() => remove(item)} disabled={busy} className="text-sm text-red-600 hover:text-red-700 font-medium">
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-stone-200 p-6 sticky top-20">
            <h2 className="font-display text-xl font-semibold text-stone-900 mb-4">Order summary</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Subtotal ({data.count} items)</span>
                <span className="font-medium text-stone-900">{money(data.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Shipping</span>
                <span className="font-medium text-emerald-700">Free</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-stone-200 flex justify-between items-center">
              <span className="font-semibold text-stone-900">Total</span>
              <span className="text-xl font-bold text-stone-900">{money(data.subtotal)}</span>
            </div>
            <button
              onClick={() => navigate('/checkout')}
              className="mt-5 w-full py-3 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm"
            >
              Proceed to checkout
            </button>
            <Link to="/books" className="mt-3 block text-center text-sm font-medium text-stone-500 hover:text-stone-800">
              Continue shopping
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
