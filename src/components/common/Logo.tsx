export function Logo() {
  return (
    <div className="flex items-center gap-2">
      {/* Modern "A" Logo with bright light background - Grass Green */}
      <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-lime-100 via-lime-50 to-green-100 ring-2 ring-lime-400/50 shadow-lg shadow-lime-300/40">
        {/* Bright shine effect */}
        <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/60 to-transparent pointer-events-none" />
        <span
          aria-hidden="true"
          className="relative text-base font-black bg-gradient-to-b from-lime-400 to-green-500 bg-clip-text text-transparent drop-shadow-md"
        >
          A
        </span>
      </div>
      {/* Brand text */}
      <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
        Aritii<span className="text-lime-500 dark:text-lime-300 font-extrabold"> Market</span>
      </span>
    </div>
  );
}