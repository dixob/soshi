'use client';

export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 flex items-start gap-4 animate-pulse">
      <div className="w-10 h-10 rounded-lg bg-stone-100" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-20 bg-stone-100 rounded" />
        <div className="h-6 w-12 bg-stone-100 rounded" />
        <div className="h-2.5 w-24 bg-stone-50 rounded" />
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 2 }: { lines?: number }) {
  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 animate-pulse">
      <div className="h-3.5 w-32 bg-stone-100 rounded mb-4" />
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-stone-100" />
            <div className="h-3 flex-1 bg-stone-50 rounded" />
            <div className="h-3 w-16 bg-stone-50 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white border border-stone-200 rounded-lg overflow-hidden animate-pulse">
      <div className="border-b border-stone-100 bg-stone-50 px-4 py-2.5 flex gap-4">
        <div className="h-3 w-24 bg-stone-100 rounded" />
        <div className="h-3 w-20 bg-stone-100 rounded hidden md:block" />
        <div className="h-3 w-28 bg-stone-100 rounded hidden md:block" />
        <div className="h-3 w-16 bg-stone-100 rounded hidden lg:block" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="border-b border-stone-50 px-4 py-3 flex gap-4">
          <div className="h-3.5 w-32 bg-stone-100 rounded" />
          <div className="h-3.5 w-24 bg-stone-50 rounded hidden md:block" />
          <div className="h-3.5 w-36 bg-stone-50 rounded hidden md:block" />
          <div className="h-3.5 w-16 bg-stone-50 rounded hidden lg:block" />
        </div>
      ))}
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 md:mx-0 md:px-0">
      {Array.from({ length: 6 }).map((_, col) => (
        <div key={col} className="flex-shrink-0 w-[75vw] sm:w-64 md:flex-1 min-w-[240px]">
          <div className="rounded-lg border border-stone-200 bg-stone-50 p-2 animate-pulse">
            <div className="flex items-center justify-between px-2 py-1 mb-2">
              <div className="h-3 w-16 bg-stone-200 rounded" />
              <div className="h-4 w-6 bg-white/60 rounded" />
            </div>
            <div className="space-y-2 min-h-[100px]">
              {Array.from({ length: col < 3 ? 2 : 1 }).map((_, i) => (
                <div key={i} className="bg-white rounded-md border border-stone-200 p-3">
                  <div className="h-3.5 w-28 bg-stone-100 rounded mb-1.5" />
                  <div className="h-2.5 w-20 bg-stone-50 rounded mb-2" />
                  <div className="flex gap-3">
                    <div className="h-2.5 w-12 bg-stone-50 rounded" />
                    <div className="h-2.5 w-16 bg-stone-50 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function AftercareSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white border border-stone-200 rounded-lg overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div>
              <div className="h-3.5 w-36 bg-stone-100 rounded mb-2" />
              <div className="h-2.5 w-48 bg-stone-50 rounded" />
            </div>
            <div className="h-6 w-32 bg-stone-50 rounded" />
          </div>
          <div className="border-t border-stone-100 px-4 py-3 space-y-3">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center gap-3 py-1">
                <div className="w-6 h-6 rounded-full bg-stone-100" />
                <div className="flex-1 space-y-1">
                  <div className="h-3 w-40 bg-stone-100 rounded" />
                  <div className="h-2.5 w-24 bg-stone-50 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <div className="h-6 w-28 bg-stone-100 rounded animate-pulse" />
        <div className="h-3.5 w-44 bg-stone-50 rounded mt-2 animate-pulse" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={3} />
      </div>
    </div>
  );
}
