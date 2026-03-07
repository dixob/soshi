'use client';

import { useState } from 'react';
import type { Contact } from '@/types/database';

interface ContactFormProps {
  initial?: Partial<Contact>;
  onSave: (data: Partial<Contact>) => Promise<void>;
  onCancel: () => void;
  title?: string;
}

export default function ContactForm({ initial, onSave, onCancel, title }: ContactFormProps) {
  const [firstName, setFirstName] = useState(initial?.first_name || '');
  const [lastName, setLastName] = useState(initial?.last_name || '');
  const [phone, setPhone] = useState(initial?.phone || '');
  const [email, setEmail] = useState(initial?.email || '');
  const [address, setAddress] = useState(initial?.address || '');
  const [commPref, setCommPref] = useState(initial?.communication_pref || '');
  const [notes, setNotes] = useState(initial?.relationship_notes || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await onSave({
      first_name: firstName,
      last_name: lastName,
      phone: phone || null,
      email: email || null,
      address: address || null,
      communication_pref: commPref || null,
      relationship_notes: notes || null,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={handleSubmit} className="bg-stone-50 border border-stone-200 rounded-lg p-3 mb-3 space-y-2">
      {title && <h3 className="text-sm font-medium text-stone-700 mb-1">{title}</h3>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="First Name *" className="px-2 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
        <input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last Name" className="px-2 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
        <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" type="tel" className="px-2 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" type="email" className="px-2 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Address" className="px-2 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
        <select value={commPref} onChange={(e) => setCommPref(e.target.value)} className="px-2 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900">
          <option value="">Communication preference</option>
          <option value="phone">Phone</option>
          <option value="email">Email</option>
          <option value="text">Text</option>
          <option value="mail">Mail</option>
          <option value="no_preference">No preference</option>
        </select>
      </div>
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Relationship notes" className="w-full px-2 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900" />
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-3 py-1.5 bg-stone-900 text-white rounded-md text-xs font-medium hover:bg-stone-800 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-stone-500 text-xs hover:text-stone-700">Cancel</button>
      </div>
    </form>
  );
}
