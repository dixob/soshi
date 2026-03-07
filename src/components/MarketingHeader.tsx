'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function MarketingHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="bg-white/80 backdrop-blur-sm border-b border-stone-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
        {/* Logo */}
        <Link href="/" className="text-lg font-semibold text-stone-900">
          Soshi
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`text-sm transition-colors ${
                pathname === l.href
                  ? 'text-stone-900 font-medium'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login" className="text-sm text-stone-600 hover:text-stone-900 transition-colors">
            Log in
          </Link>
          <Link
            href="/signup"
            className="bg-stone-900 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 -mr-2 text-stone-600"
          aria-label="Toggle menu"
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-stone-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  pathname === l.href
                    ? 'bg-stone-100 text-stone-900 font-medium'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
              >
                {l.label}
              </Link>
            ))}
            <hr className="my-2 border-stone-100" />
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm text-stone-600 hover:bg-stone-50"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium bg-stone-900 text-white text-center hover:bg-stone-800"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
