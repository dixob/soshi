'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { contactName, formatDate } from '@/lib/utils';
import { Plus, Search, Pencil, Trash2, Upload, Users } from 'lucide-react';
import Link from 'next/link';
import type { Contact } from '@/types/database';

export default function ContactsPage() {
  const { contacts, prospects, aftercareCases, createContact, updateContact, deleteContact } = useStore();
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);

  function handleDelete(id: string) {
    const linkedProspects = prospects.filter(p => p.contact_id === id).length;
    const linkedCases = aftercareCases.filter(ac => ac.contact_id === id).length;
    const warnings: string[] = [];
    if (linkedProspects > 0) warnings.push(`${linkedProspects} prospect${linkedProspects > 1 ? 's' : ''}`);
    if (linkedCases > 0) warnings.push(`${linkedCases} aftercare case${linkedCases > 1 ? 's' : ''}`);
    const msg = warnings.length > 0
      ? `This contact has ${warnings.join(' and ')} that will also be permanently deleted. Continue?`
      : 'Delete this contact?';
    if (confirm(msg)) deleteContact(id);
  }

  const filtered = contacts.filter(c => {
    const q = search.toLowerCase();
    return (
      c.first_name.toLowerCase().includes(q) ||
      c.last_name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').includes(q)
    );
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-stone-900">Contacts</h1>
          <p className="text-sm text-stone-500 mt-0.5">{contacts.length} total contacts</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search contacts..."
          className="w-full pl-9 pr-3 py-2 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900 bg-white"
        />
      </div>

      {/* New contact form */}
      {showNew && (
        <ContactForm
          onSave={async (data) => { await createContact(data); setShowNew(false); }}
          onCancel={() => setShowNew(false)}
        />
      )}

      {/* Table */}
      <div className="bg-white border border-stone-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-4 py-2 text-xs font-medium text-stone-500">Name</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-stone-500 hidden md:table-cell">Phone</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-stone-500 hidden md:table-cell">Email</th>
              <th className="text-left px-4 py-2 text-xs font-medium text-stone-500 hidden lg:table-cell">Added</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} className="border-b border-stone-50 hover:bg-stone-50">
                {editing === c.id ? (
                  <td colSpan={5} className="p-2">
                    <ContactForm
                      initial={c}
                      onSave={async (data) => { await updateContact(c.id, data); setEditing(null); }}
                      onCancel={() => setEditing(null)}
                    />
                  </td>
                ) : (
                  <>
                    <td className="px-4 py-2.5 font-medium text-stone-900">
                      {contactName(c)}
                      {c.relationship_notes && (
                        <p className="text-xs text-stone-400 font-normal truncate max-w-[200px]">
                          {c.relationship_notes}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-2.5 text-stone-600 hidden md:table-cell">{c.phone || '—'}</td>
                    <td className="px-4 py-2.5 text-stone-600 hidden md:table-cell">{c.email || '—'}</td>
                    <td className="px-4 py-2.5 text-stone-400 hidden lg:table-cell">{formatDate(c.created_at)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setEditing(c.id)}
                          className="p-1 text-stone-400 hover:text-stone-600"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1 text-stone-400 hover:text-red-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="text-center py-12">
            {search ? (
              <p className="text-stone-400 text-sm">No contacts match &ldquo;{search}&rdquo;</p>
            ) : (
              <>
                <Users className="w-8 h-8 text-stone-300 mx-auto mb-3" />
                <p className="text-stone-500 text-sm font-medium mb-1">No contacts yet</p>
                <p className="text-stone-400 text-xs mb-4">Add people to track preneed prospects and aftercare</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setShowNew(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Contact
                  </button>
                  <Link
                    href="/import"
                    className="flex items-center gap-1.5 px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg text-xs font-medium hover:bg-stone-50 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Import CSV
                  </Link>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ContactForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Contact;
  onSave: (data: Partial<Contact>) => Promise<void>;
  onCancel: () => void;
}) {
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
