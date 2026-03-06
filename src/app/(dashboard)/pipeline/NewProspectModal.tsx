'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { X } from 'lucide-react';
import type { DispositionPreference, LeadSource } from '@/types/database';

export default function NewProspectModal({ onClose }: { onClose: () => void }) {
  const { contacts, createContact, createProspect } = useStore();
  const [mode, setMode] = useState<'existing' | 'new'>('new');
  const [selectedContactId, setSelectedContactId] = useState('');

  // New contact fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Prospect fields
  const [disposition, setDisposition] = useState<DispositionPreference>('undecided');
  const [source, setSource] = useState<LeadSource>('walk_in');
  const [budget, setBudget] = useState('');
  const [followupDate, setFollowupDate] = useState('');
  const [followupNote, setFollowupNote] = useState('');

  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    let contactId = selectedContactId;

    if (mode === 'new') {
      const contact = await createContact({
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        email: email || null,
      });
      if (!contact) { setSaving(false); return; }
      contactId = contact.id;
    }

    await createProspect({
      contact_id: contactId,
      disposition_pref: disposition,
      lead_source: source,
      estimated_budget: budget || null,
      next_followup_date: followupDate || null,
      followup_note: followupNote || null,
    });

    setSaving(false);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <h2 className="font-semibold text-stone-900">New Prospect</h2>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Contact selection */}
          <div className="flex gap-2 text-sm">
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`px-3 py-1 rounded-md ${mode === 'new' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
            >
              New Contact
            </button>
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={`px-3 py-1 rounded-md ${mode === 'existing' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600'}`}
            >
              Existing Contact
            </button>
          </div>

          {mode === 'new' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">First Name *</label>
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Last Name</label>
                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  type="tel"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-stone-600 mb-1">Email</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Select Contact</label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                required
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="">Choose a contact...</option>
                {contacts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <hr className="border-stone-100" />

          {/* Prospect details */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Disposition</label>
              <select
                value={disposition}
                onChange={(e) => setDisposition(e.target.value as DispositionPreference)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="undecided">Undecided</option>
                <option value="burial">Burial</option>
                <option value="cremation">Cremation</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Lead Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as LeadSource)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              >
                <option value="walk_in">Walk-in</option>
                <option value="referral">Referral</option>
                <option value="community_event">Community Event</option>
                <option value="website">Website</option>
                <option value="social_media">Social Media</option>
                <option value="cold_outreach">Cold Outreach</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">Estimated Budget</label>
            <input
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g., $5,000 - $8,000"
              className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Follow-up Date</label>
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">Follow-up Note</label>
              <input
                value={followupNote}
                onChange={(e) => setFollowupNote(e.target.value)}
                placeholder="Remind me to..."
                className="w-full px-3 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Add Prospect'}
          </button>
        </form>
      </div>
    </div>
  );
}
