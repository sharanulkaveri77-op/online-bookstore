import { useEffect, useState } from 'react';
import { api } from '../../api/client';
import Spinner from '../../components/Spinner';
import Alert from '../../components/Alert';
import Modal from '../../components/admin/Modal';

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', discount_percent: '', valid_until: '', active: 1 });
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  const load = () => api('/admin/coupons').then((d) => setCoupons(d.coupons));

  useEffect(() => {
    load().catch((err) => setError(err.message));
  }, []);

  if (!coupons) return <Spinner label="Loading coupons…" />;

  const openCreate = () => {
    setForm({ code: '', discount_percent: '', valid_until: '', active: 1 });
    setEditing({});
    setError(null);
  };

  const openEdit = (c) => {
    setForm({ code: c.code, discount_percent: c.discount_percent, valid_until: c.valid_until, active: c.active });
    setEditing(c);
    setError(null);
  };

  const toggle = async (c) => {
    setError(null);
    try {
      await api(`/admin/coupons/${c.id}`, { method: 'PUT', body: { active: c.active ? 0 : 1 } });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMsg(null);
    try {
      if (editing.id) {
        await api(`/admin/coupons/${editing.id}`, { method: 'PUT', body: form });
      } else {
        await api('/admin/coupons', { method: 'POST', body: form });
      }
      setMsg(editing.id ? 'Coupon updated' : 'Coupon created');
      setEditing(null);
      load();
    } catch (err) {
      setError(err.details ? Object.values(err.details).join(' · ') : err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await api(`/admin/coupons/${c.id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

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
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-xl font-semibold text-stone-900">Coupons</h2>
        <button onClick={openCreate} className="px-4 py-2 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm">
          + New coupon
        </button>
      </div>

      {error && <Alert message={error} onClose={() => setError(null)} />}
      {msg && <Alert type="success" message={msg} onClose={() => setMsg(null)} />}

      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="bg-stone-50 text-left text-xs font-semibold text-stone-500 uppercase tracking-wide">
                <th className="px-5 py-3">Code</th>
                <th className="px-5 py-3">Discount</th>
                <th className="px-5 py-3">Valid until</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {coupons.map((c) => {
                const expired = new Date(c.valid_until) < new Date();
                return (
                  <tr key={c.id} className="hover:bg-stone-50">
                    <td className="px-5 py-3">
                      <span className="font-mono font-semibold text-stone-800">{c.code}</span>
                    </td>
                    <td className="px-5 py-3">{c.discount_percent}%</td>
                    <td className="px-5 py-3 text-stone-600">
                      {c.valid_until}
                      {expired && <span className="ml-2 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">EXPIRED</span>}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => toggle(c)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${c.active ? 'bg-emerald-500' : 'bg-stone-300'}`}
                        aria-label="Toggle coupon"
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${c.active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`ml-2 text-xs font-semibold ${c.active ? 'text-emerald-700' : 'text-stone-400'}`}>
                        {c.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="text-amber-700 hover:text-amber-800 font-medium text-xs">Edit</button>
                        <button onClick={() => remove(c)} className="text-red-600 hover:text-red-700 font-medium text-xs">Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={!!editing} title={editing?.id ? 'Edit coupon' : 'New coupon'} onClose={() => setEditing(null)}>
        <form onSubmit={save} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5">Code *</label>
            {input('code', { required: true, minLength: 3, placeholder: 'e.g. SAVE20' })}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Discount % *</label>
              {input('discount_percent', { required: true, type: 'number', min: 1, max: 100 })}
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Valid until *</label>
              {input('valid_until', { required: true, type: 'date' })}
            </div>
          </div>
          <label className="flex items-center gap-2.5 text-sm text-stone-700">
            <input
              type="checkbox"
              checked={!!Number(form.active)}
              onChange={(e) => setForm({ ...form, active: e.target.checked ? 1 : 0 })}
              className="w-4 h-4 rounded border-stone-300 text-amber-600 focus:ring-amber-600"
            />
            Active (can be used at checkout)
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-stone-300 text-sm font-medium text-stone-700 hover:bg-stone-100">Cancel</button>
            <button type="submit" disabled={saving} className="px-5 py-2 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white rounded-xl text-sm font-semibold">{saving ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
