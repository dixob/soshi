'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import {
  LayoutDashboard,
  Kanban,
  Heart,
  Users,
  Upload,
  Settings,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pipeline', label: 'Pipeline', icon: Kanban },
  { href: '/aftercare', label: 'Aftercare', icon: Heart },
  { href: '/contacts', label: 'Contacts', icon: Users },
  { href: '/import', label: 'Import', icon: Upload },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { org, signOut } = useStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 p-2 bg-white rounded-lg shadow-sm border border-stone-200"
      >
        <Menu className="w-5 h-5 text-stone-600" />
      </button>

      {/* Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed md:static inset-y-0 left-0 z-50 w-56 bg-white border-r border-stone-200 flex flex-col transition-transform md:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <Link href="/dashboard" className="block group">
            <h1 className="font-semibold text-stone-900 text-sm group-hover:text-stone-600 transition-colors">Soshi</h1>
            <p className="text-xs text-stone-400 truncate">{org?.name || 'My Funeral Home'}</p>
          </Link>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1 text-stone-400 hover:text-stone-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-0.5" data-tour-target="sidebar-nav">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            const tourId = label.toLowerCase().replace(/ /g, '-');
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                data-tour-target={`nav-${tourId}`}
                className={cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors',
                  active
                    ? 'bg-stone-100 text-stone-900 font-medium'
                    : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-stone-100">
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-stone-400 hover:text-stone-600 hover:bg-stone-50 w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </aside>
    </>
  );
}
