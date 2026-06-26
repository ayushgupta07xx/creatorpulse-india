// Full-page skeleton for the single-creator detail view. Mirrors the header
// (96px avatar + title + chips) and the panel sections below it. Reuses .shimmer.

function Block({ className = "" }: { className?: string }) {
  return <div className={`shimmer rounded-md bg-white/[0.04] ${className}`} />;
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-surface/60 p-6">{children}</div>
  );
}

export default function CreatorDetailSkeleton() {
  return (
    <div className="mx-auto max-w-wrap px-6 py-12" aria-busy="true" aria-live="polite">
      <Block className="h-5 w-32" />
      <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-center">
        <Block className="h-24 w-24 shrink-0 rounded-full" />
        <div className="min-w-0 space-y-3">
          <Block className="h-8 w-64" />
          <div className="flex gap-2">
            <Block className="h-6 w-20 rounded" />
            <Block className="h-6 w-24 rounded" />
          </div>
        </div>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Panel>
          <Block className="h-5 w-40" />
          <div className="mt-4 flex justify-center">
            <Block className="h-48 w-48 rounded-full" />
          </div>
        </Panel>
        <Panel>
          <Block className="h-5 w-32" />
          <div className="mt-4 grid grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Block className="h-3 w-20" />
                <Block className="h-5 w-16" />
              </div>
            ))}
          </div>
        </Panel>
      </div>
      <div className="mt-5">
        <Panel>
          <Block className="h-5 w-48" />
          <Block className="mt-4 h-40 w-full" />
        </Panel>
      </div>
    </div>
  );
}
