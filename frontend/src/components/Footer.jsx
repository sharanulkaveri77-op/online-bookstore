import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-stone-900 text-stone-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M21 5c-1.11-.35-2.33-.5-3.5-.5-1.95 0-4.05.4-5.5 1.5-1.45-1.1-3.55-1.5-5.5-1.5S2.45 4.9 1 6v14.65c0 .25.25.5.5.5.1 0 .15-.05.25-.05C3.1 20.45 5.05 20 6.5 20c1.95 0 4.05.4 5.5 1.5 1.35-.85 3.8-1.5 5.5-1.5 1.65 0 3.35.3 4.75 1.05.1.05.15.05.25.05.25 0 .5-.25.5-.5V6c-.6-.45-1.25-.75-2-1zm0 13.5c-1.1-.35-2.3-.5-3.5-.5-1.7 0-4.15.65-5.5 1.5V8c1.35-.85 3.8-1.5 5.5-1.5 1.2 0 2.4.15 3.5.5v11.5z" />
              </svg>
            </span>
            <span className="font-display text-lg font-semibold text-white">BookNook</span>
          </div>
          <p className="text-sm text-stone-400">Your neighbourhood online bookstore. Curated books, fair prices, delivered fast.</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Explore</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/books" className="hover:text-white">All Books</Link></li>
            <li><Link to="/books?category=1" className="hover:text-white">Fiction</Link></li>
            <li><Link to="/books?category=3" className="hover:text-white">Technology</Link></li>
            <li><Link to="/books?category=2" className="hover:text-white">Science</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Account</h4>
          <ul className="space-y-2 text-sm">
            <li><Link to="/login" className="hover:text-white">Log in</Link></li>
            <li><Link to="/register" className="hover:text-white">Create account</Link></li>
            <li><Link to="/orders" className="hover:text-white">Track orders</Link></li>
            <li><Link to="/wishlist" className="hover:text-white">Wishlist</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-white mb-3">Support</h4>
          <ul className="space-y-2 text-sm">
            <li>help@booknook.example</li>
            <li>Mon–Sat, 9am–6pm</li>
            <li className="pt-2 text-xs text-stone-500">College capstone project — demo store</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-stone-800">
        <p className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-xs text-stone-500">
          &copy; {new Date().getFullYear()} BookNook. Built with React, Express &amp; SQLite.
        </p>
      </div>
    </footer>
  );
}
