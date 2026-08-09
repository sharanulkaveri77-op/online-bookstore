export default function Alert({ type = 'error', message, details, onClose }) {
  if (!message && !details) return null;
  const styles =
    type === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : 'bg-red-50 border-red-200 text-red-700';
  return (
    <div className={`rounded-xl border px-4 py-3 mb-4 flex items-start justify-between gap-3 ${styles}`} role="alert">
      <div>
        <p className="text-sm font-medium">{message}</p>
        {details && (
          <ul className="mt-1 text-xs space-y-0.5">
            {Object.values(details).map((d, i) => (
              <li key={i}>{d}</li>
            ))}
          </ul>
        )}
      </div>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100" aria-label="Dismiss">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
