'use client';

import Link from 'next/link';
import { useStore } from '@/lib/store';
import { CheckCircle, Circle, ArrowRight, X, Sparkles } from 'lucide-react';

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href?: string;
  bonus?: boolean;
}

export default function GettingStartedChecklist({ items }: { items: ChecklistItem[] }) {
  const { dismissChecklist } = useStore();

  const completed = items.filter((i) => i.done).length;
  const total = items.length;
  const progress = Math.round((completed / total) * 100);

  return (
    <div className="bg-white rounded-xl border border-stone-200 p-5 relative">
      {/* Dismiss button */}
      <button
        onClick={dismissChecklist}
        className="absolute top-3 right-3 p-1.5 text-stone-300 hover:text-stone-500 transition-colors rounded-lg hover:bg-stone-50"
        aria-label="Dismiss checklist"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-1">
        <div className="p-1.5 bg-amber-50 rounded-lg">
          <Sparkles className="w-4 h-4 text-amber-600" />
        </div>
        <h2 className="text-sm font-semibold text-stone-900">Getting Started</h2>
        <span className="text-xs text-stone-400 ml-auto mr-6">
          {completed}/{total} complete
        </span>
      </div>
      <p className="text-xs text-stone-500 mb-4 ml-9">
        A few quick steps to get the most out of Soshi.
      </p>

      {/* Progress bar */}
      <div className="h-1.5 bg-stone-100 rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.id}>
            {item.done ? (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="text-sm text-stone-400 line-through flex-1">{item.label}</span>
                {item.bonus && (
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    Bonus
                  </span>
                )}
              </div>
            ) : item.href ? (
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors group"
              >
                <Circle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                <span className="text-sm text-stone-700 flex-1">{item.label}</span>
                {item.bonus && (
                  <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                    Bonus
                  </span>
                )}
                <ArrowRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 transition-colors" />
              </Link>
            ) : (
              <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
                <Circle className="w-4 h-4 text-stone-300 flex-shrink-0" />
                <span className="text-sm text-stone-700 flex-1">{item.label}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
