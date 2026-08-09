import { useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import BookCard from '../components/BookCard';
import Spinner from '../components/Spinner';
import Alert from '../components/Alert';

const SORTS = [
  ['popular', 'Best selling'],
  ['rating_desc', 'Top rated'],
  ['price_asc', 'Price: low to high'],
  ['price_desc', 'Price: high to low'],
  ['title_asc', 'Title A–Z']
];

export default function Books() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [books, setBooks] = useState(null);
  const [fuzzyUsed, setFuzzyUsed] = useState(false);
  const [categories, setCategories] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const author = searchParams.get('author') || '';
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const inStock = searchParams.get('inStock') || '';
  const sort = searchParams.get('sort') || 'popular';

  useEffect(() => {
    api('/catalog/categories').then(setCategories).catch(() => {});
    api('/catalog/authors').then(setAuthors).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (category) params.set('category', category);
    if (author) params.set('author', author);
    if (minPrice) params.set('minPrice', minPrice);
    if (maxPrice) params.set('maxPrice', maxPrice);
    if (inStock) params.set('inStock', inStock);
    params.set('sort', sort);
    api(`/books?${params.toString()}`)
      .then((data) => {
        setBooks(data.books);
        setFuzzyUsed(data.fuzzyUsed);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q, category, author, minPrice, maxPrice, inStock, sort]);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    setSearchParams(next);
  };

  const clearFilters = () => setSearchParams({ sort });

  const hasFilters = useMemo(
    () => Boolean(category || author || minPrice || maxPrice || inStock),
    [category, author, minPrice, maxPrice, inStock]
  );

  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => setSearchInput(q), [q]);

  const submitSearch = (e) => {
    e.preventDefault();
    setParam('q', searchInput.trim());
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-stone-900">Browse books</h1>
        <p className="text-sm text-stone-500 mt-1">Search by title, author or ISBN — typos tolerated.</p>
      </div>

      <form onSubmit={submitSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Try 'lighhouse' for The Last Lighthouse Keeper…"
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600"
          />
        </div>
        <button type="submit" className="px-5 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm">Search</button>
      </form>

      {fuzzyUsed && !error && (
        <p className="text-xs text-amber-700 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          No exact match found — showing closest matches (fuzzy search).
        </p>
      )}

      <div className="lg:grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="mb-6 lg:mb-0">
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-stone-900 text-sm">Filters</h2>
              {hasFilters && (
                <button onClick={clearFilters} className="text-xs font-medium text-red-600 hover:text-red-700">Clear all</button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Category</label>
              <select
                value={category}
                onChange={(e) => setParam('category', e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40"
              >
                <option value="">All categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Author</label>
              <select
                value={author}
                onChange={(e) => setParam('author', e.target.value)}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40"
              >
                <option value="">All authors</option>
                {authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Price range</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setParam('minPrice', e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40"
                />
                <span className="text-stone-400">–</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setParam('maxPrice', e.target.value)}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40"
                />
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-stone-700 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock === '1'}
                onChange={(e) => setParam('inStock', e.target.checked ? '1' : '')}
                className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-600"
              />
              In stock only
            </label>
          </div>
        </aside>

        <div>
          <div className="flex items-center justify-between mb-4 gap-4">
            <p className="text-sm text-stone-500">
              {loading ? 'Loading…' : `${books.length} book${books.length === 1 ? '' : 's'} found`}
            </p>
            <select
              value={sort}
              onChange={(e) => setParam('sort', e.target.value)}
              className="rounded-lg border border-stone-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-600/40"
            >
              {SORTS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>

          {error && <Alert message={error} />}

          {loading ? (
            <Spinner label="Fetching books…" />
          ) : books.length === 0 ? (
            <div className="text-center py-20 bg-white border border-stone-200 rounded-2xl">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold text-stone-800">No books match your search</p>
              <p className="text-sm text-stone-500 mt-1">Try a different title, author or clear the filters.</p>
              <button onClick={clearFilters} className="mt-4 text-sm font-medium text-amber-700 hover:text-amber-800">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {books.map((b) => <BookCard key={b.id} book={b} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
