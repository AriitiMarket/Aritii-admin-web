export function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-dark text-sm font-bold text-white"
      >
        A
      </span>
      <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">
        Aritii<span className="text-primary-dark"> Market</span>
      </span>
    </div>
  );
}