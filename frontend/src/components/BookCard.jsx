import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { money } from '../api/client';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import RatingStars from './RatingStars';

export default function BookCard({ book }) {
  const { user } = useAuth();
  const { refresh } = useCart();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);
  const [wished, setWished] = useState(false);

  const inStock = book.stock_qty > 0;
  const lowStock = inStock && book.stock_qty < 5;

  const addToCart = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setAdding(true);
    try {
      await api('/cart', { method: 'POST', body: { book_id: book.id, quantity: 1 } });
      await refresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    try {
      if (wished) {
        await api(`/wishlist/${book.id}`, { method: 'DELETE' });
        setWished(false);
      } else {
        await api('/wishlist', { method: 'POST', body: { book_id: book.id } });
        setWished(true);
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Link
      to={`/books/${book.id}`}
      className="group relative bg-white rounded-2xl border border-stone-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col"
    >
      <div className="relative aspect-[3/4] bg-stone-100 overflow-hidden">
        <img
          src={book.cover_image_url || 'https://picsum.photos/seed/placeholder/400/560'}
          alt={book.title}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!inStock && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-stone-800 text-white text-xs font-semibold px-3 py-1.5 rounded-full">Out of stock</span>
          </div>
        )}
        {lowStock && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[11px] font-semibold px-2 py-1 rounded-full">
            Only {book.stock_qty} left
          </span>
        )}
        <button
          onClick={toggleWishlist}
          className={`absolute top-2 right-2 p-2 rounded-full shadow-sm transition-colors ${
            wished ? 'bg-red-500 text-white' : 'bg-white/90 text-stone-500 hover:text-red-500'
          }`}
          aria-label="Toggle wishlist"
        >
          <svg className="w-4 h-4" fill={wished ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">{book.category_name}</p>
        <h3 className="mt-1 font-semibold text-stone-900 line-clamp-2 leading-snug">{book.title}</h3>
        <p className="mt-1 text-sm text-stone-500 truncate">{book.author_name}</p>
        <div className="mt-2 flex items-center gap-1.5">
          <RatingStars rating={book.avg_rating} size="sm" />
          <span className="text-xs text-stone-400">({book.review_count || 0})</span>
        </div>
        <div className="mt-auto pt-3 flex items-center justify-between">
          <span className="font-bold text-stone-900">{money(book.price)}</span>
          <button
            onClick={addToCart}
            disabled={!inStock || adding}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              inStock
                ? 'bg-amber-700 text-white hover:bg-amber-800 disabled:opacity-50'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            {adding ? 'Adding…' : 'Add to cart'}
          </button>
        </div>
      </div>
    </Link>
  );
}
