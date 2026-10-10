const PATHS = {
  bed: "M3 18V7m0 7h18v4M3 11h7a3 3 0 0 1 3 3M14 11h4a3 3 0 0 1 3 3",
  car: "M5 16h14M6 16l1.5-5h9L18 16M5 16v3h2v-3M17 16v3h2v-3M8 13.5h.01M16 13.5h.01",
  land: "M3 20l5-9 4 6 3-4 6 7H3zM15 6a2 2 0 1 0 0-.01",
  home: "M3 11l9-7 9 7M5 10v10h14V10M10 20v-6h4v6",
  shield: "M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6l8-3zM9 12l2 2 4-4",
  check: "M5 12l5 5 9-10",
  lock: "M7 11V7a5 5 0 0 1 10 0v4M5 11h14v10H5z",
} as const;

export function Icon({ name, size = 24 }: { name: keyof typeof PATHS; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
