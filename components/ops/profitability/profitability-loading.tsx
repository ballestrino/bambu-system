export const ProfitabilityLoading = ({ count = 2 }: { count?: number }) => (
  <div className="grid gap-3 lg:grid-cols-2">
    {Array.from({ length: count }).map((_, index) => (
      <div className="h-40 animate-pulse rounded-[var(--ops-radius-row)] bg-ops-surface-muted" key={index} />
    ))}
  </div>
);
