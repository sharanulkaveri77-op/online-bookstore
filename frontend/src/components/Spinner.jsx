export default function Spinner({ size = 'md', label }) {
  const dims = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-8" role="status">
      <div className={`${dims} border-[3px] border-stone-200 border-t-amber-600 rounded-full animate-spin`} />
      {label && <p className="text-sm text-stone-500">{label}</p>}
    </div>
  );
}
