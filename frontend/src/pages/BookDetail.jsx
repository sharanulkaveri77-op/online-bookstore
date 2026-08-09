import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, money } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import RatingStars from '../components/RatingStars';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';
import BookCard from '../components/BookCard';

export default function BookDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { refresh } = useCart();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [inWishlist, setInWishlist] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewMsg, setReviewMsg] = useState(null);
  const [reviewErr, setReviewErr] = useState(null);

  const book = data?.book;
  const recommendations = data?.recommendations || [];

  useEffect(() => {
    setError(null);
    api(`/books/${id}`)
      .then((d) => {
        setData(d);
        setInWishlist(false);
        api(`/wishlist`).then((w) => {
          if (w.items.some((i) => i.book_id === Number(id))) setInWishlist(true);
        }).catch(() => {});
      })
      .catch((err) => setError(err.message));
    api(`/books/${id}/reviews`)
      .then((d) => setReviews(d.reviews))
      .catch(() => {});
  }, [id]);

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center">
        <p className="text-4xl mb-3">📕</p>
        <h1 className="font-display text-2xl font-semibold mb-2">Book not found</h1>
        <p className="text-stone-500">{error}</p>
        <Link to="/books" className="inline-block mt-6 text-sm font-semibold text-amber-700 hover:text-amber-800">← Back to books</Link>
      </div>
    );
  }

  if (!book) return <Spinner label="Loading book…" />;

  const inStock = book.stock_qty > 0;
  const lowStock = inStock && book.stock_qty < 5;
  const alreadyReviewed = user && reviews.some((r) => r.user_name === user.name);

  const addToCart = async (then) => {
    if (!user) return navigate('/login');
    setAdding(true);
    try {
      await api('/cart', { method: 'POST', body: { book_id: book.id, quantity } });
      await refresh();
      if (then) then();
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  };

  const toggleWishlist = async () => {
    if (!user) return navigate('/login');
    try {
      if (inWishlist) {
        await api(`/wishlist/${book.id}`, { method: 'DELETE' });
        setInWishlist(false);
      } else {
        await api('/wishlist', { method: 'POST', body: { book_id: book.id } });
        setInWishlist(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    setReviewErr(null);
    setReviewMsg(null);
    try {
      const res = await api(`/books/${book.id}/reviews`, { method: 'POST', body: reviewForm });
      setReviews((prev) => [res.review, ...prev]);
      setReviewMsg('Review published — verified purchase.');
      setReviewForm({ rating: 5, comment: '' });
      const fresh = await api(`/books/${id}`);
      setData(fresh);
    } catch (err) {
      setReviewErr(err.message);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <nav className="text-sm text-stone-500 mb-6">
        <Link to="/books" className="hover:text-amber-700">Books</Link>
        <span className="mx-2">/</span>
        <Link to={`/books?category=${book.category_id}`} className="hover:text-amber-700">{book.category_name}</Link>
        <span className="mx-2">/</span>
        <span className="text-stone-800">{book.title}</span>
      </nav>

      {error && <Alert message={error} onClose={() => setError(null)} />}

      <div className="grid md:grid-cols-[320px_1fr] gap-8 lg:gap-12">
        <div>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-stone-200 bg-white">
            <img src={book.cover_image_url} alt={book.title} className="w-full aspect-[3/4] object-cover" />
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">{book.category_name}</p>
          <h1 className="font-display text-3xl lg:text-4xl font-semibold text-stone-900 mt-2">{book.title}</h1>
          <p className="mt-2 text-stone-600">
            by <Link to={`/books?author=${book.author_id}`} className="font-medium text-amber-700 hover:underline">{book.author_name}</Link>
            <span className="text-stone-400"> · {book.publisher_name}</span>
          </p>

          <div className="mt-3 flex items-center gap-2">
            <RatingStars rating={book.avg_rating} />
            <span className="text-sm font-semibold text-stone-800">{book.avg_rating || 'New'}</span>
            <span className="text-sm text-stone-500">({book.review_count} review{book.review_count === 1 ? '' : 's'})</span>
          </div>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-3xl font-bold text-stone-900">{money(book.price)}</span>
            {lowStock && (
              <span className="bg-red-100 text-red-700 text-xs font-semibold px-2.5 py-1 rounded-full">Only {book.stock_qty} left</span>
            )}
          </div>
          <p className={`mt-1 text-sm ${inStock ? 'text-emerald-700' : 'text-red-600'}`}>
            {inStock ? `${book.stock_qty} copies in stock` : 'Currently out of stock'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <div className="flex items-center rounded-xl border border-stone-300 overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-100"
                aria-label="Decrease quantity"
              >−</button>
              <span className="w-10 text-center font-semibold">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-3.5 py-2.5 text-stone-600 hover:bg-stone-100"
                aria-label="Increase quantity"
              >+</button>
            </div>
            <button
              onClick={() => addToCart()}
              disabled={!inStock || adding}
              className={`px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                inStock ? 'bg-amber-700 hover:bg-amber-800 text-white' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
              }`}
            >
              {adding ? 'Adding…' : 'Add to cart'}
            </button>
            <button
              onClick={() => addToCart(() => navigate('/checkout'))}
              disabled={!inStock}
              className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-stone-900 hover:bg-stone-800 text-white transition-colors"
            >
              Buy now
            </button>
            <button
              onClick={toggleWishlist}
              className={`px-4 py-2.5 rounded-xl border font-semibold text-sm transition-colors ${
                inWishlist ? 'border-red-200 bg-red-50 text-red-600' : 'border-stone-300 text-stone-700 hover:border-red-300 hover:text-red-600'
              }`}
            >
              {inWishlist ? '♥ In wishlist' : '♡ Wishlist'}
            </button>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-xs">
            {book.sample_pdf_url && (
              <a
                href={book.sample_pdf_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-amber-700 font-medium hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Preview sample PDF
              </a>
            )}
            <span className="text-stone-400">ISBN: {book.isbn}</span>
          </div>

          <div className="mt-8">
            <h2 className="font-display text-xl font-semibold text-stone-900 mb-3">About this book</h2>
            <p className="text-stone-600 leading-relaxed">{book.description}</p>
          </div>
        </div>
      </div>

      {recommendations.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-2xl font-semibold text-stone-900 mb-2">Customers who bought this also bought</h2>
          <p className="text-sm text-stone-500 mb-6">Based on real co-purchases in other orders.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recommendations.map((b) => <BookCard key={b.id} book={b} />)}
          </div>
        </section>
      )}

      <section className="mt-14 grid lg:grid-cols-2 gap-8">
        <div>
          <h2 className="font-display text-2xl font-semibold text-stone-900 mb-2">Reviews</h2>
          <p className="text-sm text-stone-500 mb-6">{reviews.length} review{reviews.length === 1 ? '' : 's'} for this book</p>

          {reviews.length === 0 && (
            <p className="text-sm text-stone-500 bg-white border border-stone-200 rounded-xl p-6">No reviews yet — be the first!</p>
          )}

          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="bg-white border border-stone-200 rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-full bg-stone-200 text-stone-700 text-sm font-semibold flex items-center justify-center">
                      {r.user_name.charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-stone-900">{r.user_name}</p>
                      <RatingStars rating={r.rating} size="sm" />
                    </div>
                  </div>
                  {r.verified_purchase === 1 && (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-full">
                      ✓ Verified purchase
                    </span>
                  )}
                </div>
                {r.comment && <p className="mt-3 text-sm text-stone-600 leading-relaxed">{r.comment}</p>}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-2xl font-semibold text-stone-900 mb-2">Write a review</h2>
          <p className="text-sm text-stone-500 mb-6">Only verified purchases can be reviewed.</p>

          {!user ? (
            <div className="bg-white border border-stone-200 rounded-xl p-6">
              <p className="text-sm text-stone-600">Log in to leave a review.</p>
              <Link to="/login" className="mt-3 inline-block text-sm font-semibold text-amber-700 hover:underline">Log in →</Link>
            </div>
          ) : alreadyReviewed ? (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl p-6 text-sm">
              You've already reviewed this book. Thanks!
            </div>
          ) : !data.purchased ? (
            <div className="bg-white border border-stone-200 rounded-xl p-6 text-sm text-stone-600">
              You'll be able to review this book after you purchase it.
            </div>
          ) : (
            <form onSubmit={submitReview} className="bg-white border border-stone-200 rounded-xl p-6">
              {reviewMsg && <Alert type="success" message={reviewMsg} />}
              {reviewErr && <Alert message={reviewErr} onClose={() => setReviewErr(null)} />}
              <label className="block text-sm font-medium text-stone-700 mb-2">Your rating</label>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setReviewForm({ ...reviewForm, rating: n })}
                    className="text-2xl"
                    aria-label={`${n} stars`}
                  >
                    <span className={n <= reviewForm.rating ? 'text-amber-400' : 'text-stone-300'}>★</span>
                  </button>
                ))}
              </div>
              <label className="block text-sm font-medium text-stone-700 mb-2">Comment (optional)</label>
              <textarea
                value={reviewForm.comment}
                onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={4}
                placeholder="What did you think of this book?"
                className="w-full rounded-xl border border-stone-300 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40"
              />
              <button type="submit" className="mt-4 px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm">
                Publish review
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
