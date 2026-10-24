export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      {/* Modern Emerald Monogram Badge */}
      <div className="relative flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-700 shadow-md shadow-emerald-900/15">
        <span
          aria-hidden="true"
          className="text-base font-extrabold text-white tracking-tight"
        >
          A
        </span>
      </div>
      {/* Brand text */}
      <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
        Aritii<span className="text-emerald-600 dark:text-emerald-400 font-extrabold"> Market</span>
      </span>
    </div>
  );
}