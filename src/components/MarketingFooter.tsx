import Link from 'next/link';

export default function MarketingFooter() {
  return (
    <footer className="bg-stone-900 text-stone-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-white font-semibold text-lg mb-2">Soshi</p>
            <p className="text-sm leading-relaxed">
              Family care management built for funeral homes that put relationships first.
            </p>
          </div>

          {/* Links */}
          <div>
            <p className="text-stone-300 font-medium text-sm mb-3">Quick Links</p>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/about" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Contact</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Log in</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <p className="text-stone-300 font-medium text-sm mb-3">Get Started</p>
            <p className="text-sm leading-relaxed mb-4">
              See how Soshi can help your funeral home build lasting relationships with the families you serve.
            </p>
            <Link
              href="/signup"
              className="inline-block bg-white text-stone-900 rounded-lg px-4 py-2 text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              Create Free Account
            </Link>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-stone-800 text-center text-xs text-stone-500">
          &copy; {new Date().getFullYear()} Soshi. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
