import { useEffect, useState } from 'react';
import { api, money } from '../../api/client';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import Modal from '../../components/admin/Modal';

const EMPTY = {
  title: '', author_id: '', publisher_id: '', category_id: '',
  isbn: '', price: '', stock_qty: '', description: '', cover_image_url: '', sample_pdf_url: ''
};

export default function AdminBooks() {
  const [books, setBooks] = useState(null);
  const [refs, setRefs] = useState({ authors: [], publishers: [], categories: [] });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([
      api('/admin/books'),
      api('/catalog/authors'),
      api('/catalog/publishers'),
      api('/catalog/categories')
    ])
      .then(([b, a, p, c]) => {
        setBooks(b.books);
        setRefs({ authors: a, publishers: p, categories: c });
      })
      .catch((err) => setError(err.message));
  }, []);

  if (!books) return <Spinner label="Loading books…" />;

  const openCreate = () => {
    setForm(EMPTY);
    setEditing({});
    setError(null);
  };

  const openEdit = (book) => {
    setForm({
      title: book.title, author_id: book.author_id ?? '', publisher_id: book.publisher_id ?? '',
      category_id: book.category_id ?? '', isbn: book.isbn, price: book.price,
      stock_qty: book.stock_qty, description: book.description || '', cover_image_url: book.cover_image_url || '',
      sample_pdf_url: book.sample_pdf_url || ''
    });
    setEditing(book);
    setError(null);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      if (editing.id) {
        await api(`/admin/books/${editing.id}`, { method: 'PUT', body: form });
      } else {
        await api('/admin/books', { method: 'POST', body: form });
      }
      setMsg(editing.id ? 'Book updated' : 'Book created');
      setEditing(null);
      const b = await api('/admin/books');
      setBooks(b.books);
    } catch (err) {
      setError(err.details ? Object.values(err.details).join(' · ') : err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (book) => {
    if (!confirm(`Delete "${book.title}"?`)) return;
    setError(null);
    try {
      await api(`/admin/books/${book.id}`, { method: 'DELETE' });
      const b = await api('/admin/books');
      setBooks(b.books);
    } catch (err) {
      setError(err.message);
    }
  };

  const filtered = books.filter(
    (b) =>
      !query ||
      b.title.toLowerCase().includes(query.toLowerCase()) ||
      b.author_name.toLowerCase().includes(query.toLowerCase()) ||
      b.isbn.includes(query)
  );

  const input = (key, props = {}) => (
    <input
      value={form[key] ?? ''}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      {...props}
      className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40"
    />
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="font-display text-xl font-semibold text-stone-900">Books</h2>
        <div className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter books…"
            className="rounded-xl border border-stone-300 px-4 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-amber-600/40"
          />
          <button onClick={openCreate} className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm">
            + Add book
          </button>
        </div>
      </div>

      {error && <Alert message={error} onClose={() => setError(null)} />}
      {msg && <Alert type="success" message={msg} onClose={() => setMsg(null)} />}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-stone-50 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Stock</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filtered.map((b) => (
                <tr key={b.id} className="hover:bg-stone-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <img src={b.cover_image_url} alt="" className="w-8 h-11 object-cover rounded" />
                      <div className="min-w-0">
                        <p className="font-medium text-stone-800 truncate max-w-[220px]">{b.title}</p>
                        <p className="text-xs text-stone-500 truncate">{b.author_name} · {b.isbn}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-stone-600">{b.category_name}</td>
                  <td className="px-5 py-3 font-medium">{money(b.price)}</td>
                  <td className="px-5 py-3">
                    <span className={`font-semibold ${b.stock_qty < 5 ? 'text-red-600' : 'text-stone-700'}`}>{b.stock_qty}</span>
                    {b.stock_qty < 5 && <span className="ml-1.5 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">LOW</span>}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(b)} className="text-amber-700 hover:text-amber-800 font-medium text-xs">Edit</button>
                      <button onClick={() => remove(b)} className="text-red-600 hover:text-red-700 font-medium text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-stone-500">No books match "{query}".</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} title={editing?.id ? 'Edit book' : 'New book'} onClose={() => setEditing(null)} wide>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Title *</label>
            {input('title', { required: true, minLength: 2 })}
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Author *</label>
              <select value={form.author_id} onChange={(e) => setForm({ ...form, author_id: e.target.value })} required className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40">
                <option value="">Select…</option>
                {refs.authors.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Publisher *</label>
              <select value={form.publisher_id} onChange={(e) => setForm({ ...form, publisher_id: e.target.value })} required className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40">
                <option value="">Select…</option>
                {refs.publishers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Category *</label>
              <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required className="w-full rounded-xl border border-stone-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40">
                <option value="">Select…</option>
                {refs.categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">ISBN *</label>
              {input('isbn', { required: true, minLength: 4 })}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Price ($) *</label>
              {input('price', { required: true, type: 'number', min: 0, step: '0.01' })}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Stock *</label>
              {input('stock_qty', { required: true, type: 'number', min: 0, step: 1 })}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Description</label>
            <textarea value={form.description ?? ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Cover image URL</label>
              {input('cover_image_url', { placeholder: 'https://…' })}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Sample PDF URL</label>
              {input('sample_pdf_url', { placeholder: 'https://…' })}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">{saving ? 'Saving…' : 'Save book'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
