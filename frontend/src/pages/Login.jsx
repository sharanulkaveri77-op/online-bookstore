import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Alert from '../components/Alert';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      navigate(user.role === 'admin' ? '/admin' : (location.state?.from || '/'), { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (email, password) => setForm({ email, password });

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-semibold text-stone-900">Welcome back</h1>
          <p className="text-stone-500 mt-2">Log in to your BookNook account</p>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-8">
          {error && <Alert message={error} onClose={() => setError(null)} />}
          <form onSubmit={submit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5">Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-xl border border-stone-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-600/40 focus:border-amber-600"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-amber-700 hover:bg-amber-800 disabled:opacity-60 text-white rounded-xl font-semibold text-sm"
            >
              {loading ? 'Logging in…' : 'Log in'}
            </button>
          </form>

          <div className="mt-6 rounded-xl bg-stone-50 border border-stone-200 p-4 text-xs text-stone-600 space-y-1.5">
            <p className="font-semibold text-stone-700">Demo accounts</p>
            <button type="button" onClick={() => fillDemo('admin@bookstore.com', 'Admin@123')} className="block hover:text-amber-700">
              Admin — admin@bookstore.com / Admin@123
            </button>
            <button type="button" onClick={() => fillDemo('john@example.com', 'Password@123')} className="block hover:text-amber-700">
              Customer — john@example.com / Password@123
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-stone-500 mt-6">
          New to BookNook? <Link to="/register" className="font-semibold text-amber-700 hover:underline">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
