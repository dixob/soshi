import Link from 'next/link';
import { ClipboardList, Heart, TrendingUp } from 'lucide-react';

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Organize your families',
    description:
      'Import your existing contacts or add them one by one. Soshi keeps every detail in one place so nothing slips through the cracks.',
  },
  {
    icon: Heart,
    title: 'Care with intention',
    description:
      'Automated aftercare timelines and a visual preneed pipeline help you reach out at the right time with the right message.',
  },
  {
    icon: TrendingUp,
    title: 'Grow through trust',
    description:
      'When families feel remembered, they come back. Soshi turns compassionate follow-up into lasting relationships and future arrangements.',
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Header */}
      <section className="py-16 sm:py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
            About Soshi
          </h1>
          <p className="mt-4 text-lg text-stone-600 leading-relaxed">
            We believe the relationship between a funeral home and the families it serves
            shouldn&rsquo;t end after the service. Soshi exists to help you keep that
            connection&nbsp;alive.
          </p>
        </div>
      </section>

      {/* Mission */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-xl border border-stone-200 p-8 sm:p-10">
            <h2 className="text-xl font-semibold text-stone-900 mb-4">Our Mission</h2>
            <p className="text-stone-600 leading-relaxed mb-4">
              Independent funeral homes are the heart of their communities, yet most still rely on
              spreadsheets, sticky notes, and memory to manage family relationships. Important
              follow-ups get missed. Preneed conversations stall. Families who trusted you during
              their hardest moments never hear from you again.
            </p>
            <p className="text-stone-600 leading-relaxed">
              Soshi is purpose-built software for funeral professionals who want a better way. It
              brings preneed tracking, aftercare timelines, and contact management together in one
              calm, intuitive workspace &mdash; so you can focus on what you do best: caring for
              families.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="pb-16 sm:pb-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-semibold text-stone-900 text-center mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={step.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-stone-100 text-stone-600 mb-4">
                  <step.icon size={22} />
                </div>
                <p className="text-xs text-stone-400 font-medium uppercase tracking-wider mb-1">
                  Step {i + 1}
                </p>
                <h3 className="font-medium text-stone-900 mb-2">{step.title}</h3>
                <p className="text-sm text-stone-500 leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20 sm:pb-28">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl font-semibold text-stone-900 mb-3">
            See it for yourself
          </h2>
          <p className="text-stone-500 mb-6">
            Create a free account and set up your workspace in under two&nbsp;minutes.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="w-full sm:w-auto bg-stone-900 text-white rounded-lg px-6 py-3 text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              Get Started Free
            </Link>
            <Link
              href="/contact"
              className="w-full sm:w-auto border border-stone-300 text-stone-700 rounded-lg px-6 py-3 text-sm font-medium hover:bg-stone-100 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
