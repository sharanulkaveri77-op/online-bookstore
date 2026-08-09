import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import BookCard from '../components/BookCard';
import Spinner from '../components/Spinner';

export default function Home() {
  const [bestSellers, setBestSellers] = useState(null);
  const [topRated, setTopRated] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api('/books?sort=popular'),
      api('/books?sort=rating_desc'),
      api('/catalog/categories')
    ])
      .then(([b, t, c]) => {
        setBestSellers(b.books.slice(0, 8));
        setTopRated(t.books.slice(0, 4));
        setCategories(c);
      })
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div>
      <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 lg:py-24 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-amber-400 font-medium tracking-wide uppercase text-sm mb-3">Your neighbourhood online bookstore</p>
            <h1 className="font-display text-4xl lg:text-5xl font-semibold leading-tight">
              Discover your next favourite chapter
            </h1>
            <p className="mt-4 text-stone-300 text-lg max-w-xl">
              Browse {bestSellers ? '30+' : 'thousands of'} hand-picked books across fiction, science, technology and more — with fast checkout and instant invoices.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/books" className="px-6 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl font-semibold text-sm shadow-lg shadow-amber-900/30 transition-colors">
                Browse books
              </Link>
              <Link to="/books?inStock=1&sort=popular" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold text-sm border border-white/20 transition-colors">
                In-stock bestsellers
              </Link>
            </div>
          </div>
          <div className="hidden lg:block relative">
            <div className="absolute -inset-4 bg-amber-500/10 blur-2xl rounded-full" />
            <div className="relative grid grid-cols-3 gap-4 rotate-2">
              <div className="space-y-4 -translate-y-3">
                {[3, 1, 2].map((n) => bestSellers?.[n] && (
                  <Link to={`/books/${bestSellers[n].id}`} key={n} className="block rounded-xl overflow-hidden shadow-xl ring-1 ring-white/20">
                    <img src={bestSellers[n].cover_image_url} alt="" className="w-full aspect-[3/4] object-cover" loading="lazy" />
                  </Link>
                ))}
              </div>
              <div className="space-y-4 translate-y-4">
                {[5, 4, 6].map((n) => bestSellers?.[n] && (
                  <Link to={`/books/${bestSellers[n].id}`} key={n} className="block rounded-xl overflow-hidden shadow-xl ring-1 ring-white/20">
                    <img src={bestSellers[n].cover_image_url} alt="" className="w-full aspect-[3/4] object-cover" loading="lazy" />
                  </Link>
                ))}
              </div>
              <div className="space-y-4 -translate-y-3">
                {[7, 0].map((n) => bestSellers?.[n] && (
                  <Link to={`/books/${bestSellers[n].id}`} key={n} className="block rounded-xl overflow-hidden shadow-xl ring-1 ring-white/20">
                    <img src={bestSellers[n].cover_image_url} alt="" className="w-full aspect-[3/4] object-cover" loading="lazy" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-stone-900">Shop by category</h2>
            <p className="text-sm text-stone-500 mt-1">Find the section that speaks to you</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {categories.map((c) => (
            <Link
              key={c.id}
              to={`/books?category=${c.id}`}
              className="group rounded-2xl border border-stone-200 bg-white p-5 text-center hover:border-amber-600 hover:shadow-md transition-all"
            >
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <p className="text-sm font-medium text-stone-800">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {error ? (
        <p className="max-w-7xl mx-auto px-4 text-red-600">{error}</p>
      ) : (
        <>
          <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-display text-2xl font-semibold text-stone-900">Best sellers</h2>
                <p className="text-sm text-stone-500 mt-1">What readers are buying right now</p>
              </div>
              <Link to="/books?sort=popular" className="text-sm font-medium text-amber-700 hover:text-amber-800">View all →</Link>
            </div>
            {!bestSellers ? <Spinner /> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {bestSellers.map((b) => <BookCard key={b.id} book={b} />)}
              </div>
            )}
          </section>

          {topRated?.length > 0 && (
            <section className="bg-white border-y border-stone-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <h2 className="font-display text-2xl font-semibold text-stone-900">Top rated</h2>
                    <p className="text-sm text-stone-500 mt-1">Loved by verified buyers</p>
                  </div>
                  <Link to="/books?sort=rating_desc" className="text-sm font-medium text-amber-700 hover:text-amber-800">View all →</Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {topRated.map((b) => <BookCard key={b.id} book={b} />)}
                </div>
              </div>
            </section>
          )}
        </>
      )}

      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="rounded-3xl bg-amber-700 text-white p-8 lg:p-12 grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display text-3xl font-semibold">Wishlist, checkout, invoice — in minutes</h2>
            <p className="mt-3 text-amber-100">
              Save books for later, apply coupons at checkout, and download a PDF invoice for every order.
              Fresh stock alerts keep you in the loop.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {['Coupons', 'PDF invoices', 'Verified reviews'].map((f) => (
              <div key={f} className="bg-white/10 rounded-2xl p-4 text-center border border-white/20">
                <p className="text-sm font-semibold">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
