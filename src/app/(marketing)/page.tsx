import Link from 'next/link';
import { Heart, BarChart3, CalendarClock, Users } from 'lucide-react';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Preneed Pipeline',
    description:
      'Track every family from first conversation to signed arrangement with a visual Kanban board built for your workflow.',
  },
  {
    icon: Heart,
    title: 'Aftercare Timeline',
    description:
      'Automated touchpoints ensure no family is forgotten. From the first week to the first anniversary and beyond.',
  },
  {
    icon: CalendarClock,
    title: 'Daily Digest',
    description:
      'Start each morning knowing exactly who needs a call, a card, or a visit. Delivered straight to your inbox.',
  },
  {
    icon: Users,
    title: 'Contact Management',
    description:
      'One place for every family you serve. Import your existing contacts or build your database from scratch.',
  },
];

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-4xl sm:text-5xl font-semibold text-stone-900 leading-tight tracking-tight">
            Every family deserves to&nbsp;be&nbsp;remembered
          </h1>
          <p className="mt-5 text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            Soshi helps funeral homes nurture lasting relationships with the families they serve
            &mdash; from the first conversation through years of thoughtful aftercare.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-stone-900 text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/about"
              className="w-full sm:w-auto border border-stone-300 text-stone-700 rounded-lg px-6 py-3 text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-stone-900 text-center mb-3">
            Built around the way you care
          </h2>
          <p className="text-stone-500 text-center max-w-xl mx-auto mb-12">
            Simple, focused tools that fit naturally into your day &mdash; so you can spend less time
            on software and more time with families.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-sm transition-shadow"
              >
                <f.icon className="text-stone-400 mb-3" size={24} />
                <h3 className="font-medium text-stone-900 mb-1">{f.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="bg-white border-y border-stone-200 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-stone-700 text-lg leading-relaxed">
            &ldquo;The families we serve aren&rsquo;t leads &mdash; they&rsquo;re people who trusted
            us during the hardest days of their lives. Soshi helps us honor that trust long after the
            service is over.&rdquo;
          </p>
          <p className="mt-4 text-sm text-stone-400">
            Built for independent funeral homes
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl font-semibold text-stone-900 mb-3">
            Ready to deepen the relationships that matter most?
          </h2>
          <p className="text-stone-500 mb-8">
            Set up takes about two minutes. No credit card required.
          </p>
          <Link
            href="/signup"
            className="inline-block bg-stone-900 text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            Start Free
          </Link>
        </div>
      </section>
    </>
  );
}
