'use client';

import { useState } from 'react';
import { Mail } from 'lucide-react';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`Soshi inquiry from ${name}`);
    const body = encodeURIComponent(`From: ${name} (${email})\n\n${message}`);
    window.location.href = `mailto:hello@trysoshi.com?subject=${subject}&body=${body}`;
  }

  return (
    <section className="py-16 sm:py-24">
      <div className="max-w-lg mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-semibold text-stone-900 tracking-tight">
            Get in Touch
          </h1>
          <p className="mt-3 text-stone-500">
            Have a question or want to learn more? We&rsquo;d love to hear from&nbsp;you.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 p-6 sm:p-8 space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-stone-700 mb-1">
              Your name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Jane Smith"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-stone-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="jane@example.com"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-stone-700 mb-1">
              Message
            </label>
            <textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              placeholder="Tell us about your funeral home and what you're looking for..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 focus:border-transparent resize-none"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-stone-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-stone-800 transition-colors flex items-center justify-center gap-2"
          >
            <Mail size={16} />
            Send Message
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-stone-400">
          Or reach us directly at{' '}
          <a href="mailto:hello@trysoshi.com" className="text-stone-600 hover:text-stone-900 underline">
            hello@trysoshi.com
          </a>
        </p>
      </div>
    </section>
  );
}
