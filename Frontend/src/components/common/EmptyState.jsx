export default function EmptyState({
  title,
  description,
  action,
  theme,
  className = "",
}) {
  return (
    <div
      className={`rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10 ${className}`}
    >
      <div
        className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl ${
          theme?.light || "bg-blue-50"
        } ${theme?.text || "text-blue-700"}`}
      >
        <svg
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
          className="h-6 w-6"
        >
          <path
            fillRule="evenodd"
            d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 9a1 1 0 10-2 0 1 1 0 002 0zm5-1a1 1 0 100 2 1 1 0 000-2zm-3 6a3.5 3.5 0 01-2.8-1.4 1 1 0 111.6-1.2 1.5 1.5 0 002.4 0 1 1 0 011.6 1.2A3.5 3.5 0 0110 14z"
            clipRule="evenodd"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500 sm:text-base">
        {description}
      </p>

      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}