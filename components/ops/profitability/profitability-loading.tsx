export const ProfitabilityLoading = ({ count = 2 }: { count?: number }) => (
  <div className="grid gap-3 lg:grid-cols-2">
    {Array.from({ length: count }).map((_, index) => (
      <div className="h-40 animate-pulse rounded-xl bg-muted/60" key={index} />
    ))}
  </div>
);
