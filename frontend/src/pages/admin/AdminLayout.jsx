import { NavLink, Outlet, Link } from 'react-router-dom';

const LINKS = [
  ['', 'Dashboard'],
  ['books', 'Books'],
  ['categories', 'Categories'],
  ['authors', 'Authors'],
  ['publishers', 'Publishers'],
  ['coupons', 'Coupons'],
  ['orders', 'Orders']
];

export default function AdminLayout() {
  const linkCls = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
      isActive ? 'bg-amber-700 text-white' : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
    }`;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="font-display text-3xl font-semibold text-stone-900">Admin panel</h1>
          <p className="text-sm text-stone-500 mt-1">Manage your bookstore</p>
        </div>
        <Link to="/" className="text-sm font-medium text-amber-700 hover:text-amber-800">← View storefront</Link>
      </div>

      <div className="grid lg:grid-cols-[220px_1fr] gap-8 items-start">
        <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 lg:sticky lg:top-20">
          {LINKS.map(([path, label]) => (
            <NavLink key={path} to={`/admin/${path}`} end className={linkCls}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
