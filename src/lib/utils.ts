import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { differenceInDays, format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return differenceInDays(new Date(), parseISO(dateStr));
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
  const days = differenceInDays(new Date(), parseISO(dateStr));
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 0) return `In ${Math.abs(days)}d`;
  return `${days}d ago`;
}

export function contactName(contact: { first_name: string; last_name: string }): string {
  return `${contact.first_name} ${contact.last_name}`.trim();
}
