/** The mark: a seat drawn as a construction line, with one decided dimension in pencil. */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={className}>
      <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true" className="inline-block align-[-6px]">
        <path d="M9 4v15h14v9M9 19v9M9 19h14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        <path d="M5 4v15" fill="none" stroke="#f2c14e" strokeWidth="1.5" />
        <path d="M3.5 4h3M3.5 19h3" fill="none" stroke="#f2c14e" strokeWidth="1.5" />
      </svg>
      <span className="ml-2 font-display text-[1.15rem] font-[680] tracking-tight [font-stretch:122%]">VibeAcademy</span>
    </span>
  );
}
