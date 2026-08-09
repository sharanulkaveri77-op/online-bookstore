import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center">
        <p className="font-display text-7xl font-bold text-stone-200">404</p>
        <h1 className="font-display text-2xl font-semibold text-stone-900 mt-4">Page not found</h1>
        <p className="text-stone-500 mt-2">The page you're looking for has wandered off the shelf.</p>
        <Link to="/" className="inline-block mt-6 px-6 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-sm">
          Back to home
        </Link>
      </div>
    </div>
  );
}
