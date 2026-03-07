import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInDays, format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  // BUG-020: Compare date-only strings using local dates to avoid timezone off-by-one.
  // parseISO('2026-03-07') returns midnight UTC, but new Date() is local time,
  // causing differenceInDays to be off by 1 near midnight in non-UTC timezones.
  const today = new Date();
  const localToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const parsed = parseISO(dateStr);
  const localParsed = new Date(parsed.getUTCFullYear(), parsed.getUTCMonth(), parsed.getUTCDate());
  return differenceInDays(localToday, localParsed);
}

export function daysSinceColor(days: number | null): string {
  if (days === null) return 'text-gray-400';
  if (days <= 14) return 'text-emerald-600';
  if (days <= 30) return 'text-amber-600';
  return 'text-red-600';
}

export function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return format(parseISO(dateStr), 'MMM d, yyyy');
}

export function formatRelative(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  // BUG-020: Use daysSince for consistent timezone-safe comparison
  const days = daysSince(dateStr);
  if (days === null) return 'Never';
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 0) return `In ${Math.abs(days)}d`;
  return `${days}d ago`;
}

export function contactName(contact: { first_name: string; last_name: string }): string {
  return `${contact.first_name} ${contact.last_name}`.trim();
}
