export function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Modern "A" Logo with light background - Grass Green */}
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-lime-50 to-green-50 ring-2 ring-lime-400/30">
        <span
          aria-hidden="true"
          className="text-base font-bold bg-gradient-to-br from-lime-500 to-green-400 bg-clip-text text-transparent"
        >
          A
        </span>
      </div>
      {/* Brand text */}
      <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
        Aritii<span className="text-lime-500 dark:text-lime-400"> Market</span>
      </span>
    </div>
  );
}