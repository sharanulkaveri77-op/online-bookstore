import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import Modal from '../../components/admin/Modal';

export default function CrudTable({ resource, fields, load, title, create }) {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api(load)
      .then((d) => setItems(d.items))
      .catch((err) => setError(err.message));
  }, [load]);

  if (!items) return <Spinner label={`Loading ${resource}…`} />;

  const openCreate = () => {
    const blank = {};
    fields.forEach((f) => (blank[f.key] = ''));
    setEditing({});
    setForm(blank);
    setError(null);
  };

  const openEdit = (item) => {
    const copy = {};
    fields.forEach((f) => (copy[f.key] = item[f.key] ?? ''));
    setEditing(item);
    setForm(copy);
    setError(null);
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      if (editing?.id) {
        await api(`/admin/${resource}/${editing.id}`, { method: 'PUT', body: form });
      } else {
        await api(`/admin/${resource}`, { method: 'POST', body: form });
      }
      setMsg(editing?.id ? `${title} updated` : `${title} created`);
      setEditing(null);
      const d = await api(load);
      setItems(d.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item) => {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await api(`/admin/${resource}/${item.id}`, { method: 'DELETE' });
      const d = await api(load);
      setItems(d.items);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold text-stone-900">{title}</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm">
          + Add {create}
        </button>
      </div>

      {error && <Alert message={error} onClose={() => setError(null)} />}
      {msg && <Alert type="success" message={msg} onClose={() => setMsg(null)} />}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        {items.length === 0 ? (
          <p className="p-6 text-sm text-stone-500">No {resource} yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-stone-50 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                {fields.map((f) => (
                  <th key={f.key} className="px-5 py-3">{f.header}</th>
                ))}
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {items.map((item) => (
                <tr key={item.id} className="hover:bg-stone-50">
                  {fields.map((f) => (
                    <td key={f.key} className={`px-5 py-3 text-stone-700 ${f.truncate ? 'max-w-[260px] truncate' : ''}`}>
                      {item[f.key] ?? '—'}
                    </td>
                  ))}
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openEdit(item)} className="text-amber-700 hover:text-amber-800 font-medium text-xs">Edit</button>
                      <button onClick={() => remove(item)} className="text-red-600 hover:text-red-700 font-medium text-xs">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!editing} title={editing?.id ? `Edit ${create}` : `New ${create}`} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="space-y-4">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">{f.header}</label>
              {f.textarea ? (
                <textarea
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40"
                />
              ) : (
                <input
                  value={form[f.key] ?? ''}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  required
                  className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40"
                />
              )}
            </div>
          ))}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
