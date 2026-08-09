import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const navLink = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive ? 'text-amber-700 bg-amber-50' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
    }`;

  const handleLogout = () => {
    logout();
    setUserOpen(false);
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-lg bg-amber-700 text-white flex items-center justify-center shadow-sm group-hover:bg-amber-800 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
              </svg>
            </span>
            <span className="font-display text-xl font-semibold text-stone-900">BookNook</span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <NavLink to="/" className={navLink} end>Home</NavLink>
            <NavLink to="/books" className={navLink}>Books</NavLink>
            {user && (
              <>
                <NavLink to="/orders" className={navLink}>My Orders</NavLink>
                <NavLink to="/wishlist" className={navLink}>Wishlist</NavLink>
              </>
            )}
            {user?.role === 'admin' && (
              <NavLink to="/admin" className={navLink}>Admin</NavLink>
            )}
          </nav>

          <div className="flex items-center gap-2">
            <Link
              to="/books"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-stone-600 hover:text-stone-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </Link>

            <Link to="/wishlist" className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100" aria-label="Wishlist">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </Link>

            <Link to="/cart" className="relative p-2 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100" aria-label="Cart">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-amber-600 text-white text-[11px] font-semibold flex items-center justify-center">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserOpen(!userOpen)}
                  className="flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-lg hover:bg-stone-100"
                >
                  <span className="w-8 h-8 rounded-full bg-stone-800 text-white text-sm font-semibold flex items-center justify-center">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="hidden sm:block text-sm font-medium text-stone-700">{user.name.split(' ')[0]}</span>
                  <svg className="w-4 h-4 text-stone-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {userOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                    <div className="absolute right-0 z-20 mt-2 w-48 rounded-xl bg-white border border-stone-200 shadow-lg py-1">
                      <div className="px-4 py-2 border-b border-stone-100">
                        <p className="text-sm font-medium text-stone-800 truncate">{user.name}</p>
                        <p className="text-xs text-stone-500 truncate">{user.email}</p>
                      </div>
                      <Link to="/orders" onClick={() => setUserOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">My Orders</Link>
                      <Link to="/wishlist" onClick={() => setUserOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">Wishlist</Link>
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setUserOpen(false)} className="block px-4 py-2 text-sm text-stone-700 hover:bg-stone-50">Admin Dashboard</Link>
                      )}
                      <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50">Log out</button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login" className="px-3 py-2 text-sm font-medium text-stone-700 hover:text-stone-900">Log in</Link>
                <Link to="/register" className="px-4 py-2 text-sm font-medium text-white bg-amber-700 hover:bg-amber-800 rounded-lg shadow-sm">
                  Sign up
                </Link>
              </div>
            )}

            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
              aria-label="Menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                {menuOpen
                  ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  : <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white px-4 py-3 space-y-1">
          <NavLink to="/" className={navLink} end onClick={() => setMenuOpen(false)}>Home</NavLink>
          <NavLink to="/books" className={navLink} onClick={() => setMenuOpen(false)}>Books</NavLink>
          {user && (
            <>
              <NavLink to="/orders" className={navLink} onClick={() => setMenuOpen(false)}>My Orders</NavLink>
              <NavLink to="/wishlist" className={navLink} onClick={() => setMenuOpen(false)}>Wishlist</NavLink>
            </>
          )}
          {user?.role === 'admin' && (
            <NavLink to="/admin" className={navLink} onClick={() => setMenuOpen(false)}>Admin</NavLink>
          )}
        </div>
      )}
    </header>
  );
}
