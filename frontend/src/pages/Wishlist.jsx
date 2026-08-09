import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, money } from '../api/client';
import { useCart } from '../context/CartContext';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import RatingStars from '../components/RatingStars';

export default function Wishlist() {
  const { refresh } = useCart();
  const [items, setItems] = useState(null);
  const [error, setError] = useState(null);
  const [moving, setMoving] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = () => {
    api('/wishlist')
      .then((d) => setItems(d.items))
      .catch((err) => setError(err.message));
  };

  useEffect(load, []);

  const remove = async (bookId) => {
    try {
      await api(`/wishlist/${bookId}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const moveToCart = async (item) => {
    setMoving(item.book_id);
    setMsg(null);
    try {
      await api(`/wishlist/${item.book_id}/move-to-cart`, { method: 'POST' });
      await refresh();
      setMsg(`"${item.title}" moved to your cart`);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setMoving(null);
    }
  };

  if (!items) return <Spinner label="Loading wishlist…" />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl font-semibold text-stone-900 mb-2">Wishlist</h1>
      <p className="text-sm text-stone-500 mb-8">Books you saved for later</p>

      {error && <Alert message={error} onClose={() => setError(null)} />}
      {msg && <Alert type="success" message={msg} onClose={() => setMsg(null)} />}

      {items.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl">
          <p className="text-4xl mb-3">♡</p>
          <p className="font-semibold text-stone-800">Your wishlist is empty</p>
          <p className="text-sm text-stone-500 mt-1">Tap the heart on any book to save it here.</p>
          <Link to="/books" className="inline-block mt-6 px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm">
            Browse books
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div key={item.book_id} className="bg-white rounded-2xl border border-stone-200 p-4 flex gap-4">
              <Link to={`/books/${item.book_id}`} className="shrink-0">
                <img src={item.cover_image_url} alt={item.title} className="w-20 object-cover rounded-lg" style={{ aspectRatio: '3/4' }} />
              </Link>
              <div className="flex-1 min-w-0 flex flex-col">
                <Link to={`/books/${item.book_id}`} className="font-semibold text-stone-900 hover:text-amber-700 line-clamp-2 leading-snug">
                  {item.title}
                </Link>
                <p className="text-sm text-stone-500 truncate mt-0.5">{item.author_name}</p>
                <p className="font-bold text-stone-900 mt-2">{money(item.price)}</p>
                <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                  <button
                    onClick={() => moveToCart(item)}
                    disabled={moving === item.book_id || item.stock_qty === 0}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      item.stock_qty > 0
                        ? 'bg-amber-700 text-white hover:bg-amber-800'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    {moving === item.book_id ? 'Moving…' : item.in_cart ? 'Add one more' : 'Move to cart'}
                  </button>
                  <button onClick={() => remove(item.book_id)} className="text-xs font-medium text-red-600 hover:text-red-700">
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
