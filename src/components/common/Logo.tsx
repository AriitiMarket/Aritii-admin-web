export function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Modern "A" Logo with light background */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 ring-2 ring-blue-600/20">
        <span
          aria-hidden="true"
          className="text-base font-bold bg-gradient-to-br from-blue-600 to-cyan-500 bg-clip-text text-transparent"
        >
          A
        </span>
      </div>
      {/* Brand text */}
      <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
        Aritii<span className="text-blue-600 dark:text-blue-400"> Market</span>
      </span>
    </div>
  );
}