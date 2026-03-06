'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { cn, daysSince, daysSinceColor, formatDate, contactName } from '@/lib/utils';
import { X, Phone, Mail, MessageSquare, Calendar, ArrowRight } from 'lucide-react';
import type { Activity } from '@/types/database';
import { PIPELINE_STAGES } from '@/types/database';

export default function ProspectDetail({
  prospectId,
  onClose,
}: {
  prospectId: string;
  onClose: () => void;
}) {
  const { prospects, moveProspect, updateProspect, addActivity, fetchActivities } = useStore();
  const prospect = prospects.find(p => p.id === prospectId);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newNote, setNewNote] = useState('');
  const [noteType, setNoteType] = useState<string>('note');
  const [followupDate, setFollowupDate] = useState(prospect?.next_followup_date || '');
  const [followupNote, setFollowupNote] = useState(prospect?.followup_note || '');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (prospect?.contact_id) {
      fetchActivities(prospect.contact_id).then(setActivities);
    }
  }, [prospect?.contact_id, fetchActivities]);

  if (!prospect) return null;
  const name = prospect.contact ? contactName(prospect.contact) : 'Unknown';
  const days = daysSince(prospect.last_contact_date);

  async function handleAddNote() {
    if (!newNote.trim()) return;
    setSaving(true);
    await addActivity(prospect!.id, prospect!.contact_id, noteType, newNote);
    const updated = await fetchActivities(prospect!.contact_id);
    setActivities(updated);
    setNewNote('');
    setSaving(false);
  }

  async function handleSaveFollowup() {
    await updateProspect(prospect!.id, {
      next_followup_date: followupDate || null,
      followup_note: followupNote || null,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20" onClick={onClose}>
      <div className="w-full max-w-lg bg-white shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-stone-100 p-3 sm:p-4 flex items-center justify-between z-10">
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-stone-900 truncate">{name}</h2>
            <p className="text-xs text-stone-400 capitalize truncate">
              {prospect.disposition_pref} &middot; {prospect.lead_source.replace(/_/g, ' ')}
              {prospect.estimated_budget && ` &middot; ${prospect.estimated_budget}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 -mr-1 text-stone-400 hover:text-stone-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-5">
          {/* Contact info */}
          {prospect.contact && (
            <div className="flex gap-4 text-sm text-stone-600">
              {prospect.contact.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {prospect.contact.phone}
                </span>
              )}
              {prospect.contact.email && (
                <span className="flex items-center gap-1">
                  <Mail className="w-3.5 h-3.5" />
                  {prospect.contact.email}
                </span>
              )}
            </div>
          )}

          {/* Stage selector */}
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Pipeline Stage</label>
            <div className="flex flex-wrap gap-1.5">
              {PIPELINE_STAGES.map(s => (
                <button
                  key={s.key}
                  onClick={() => moveProspect(prospect.id, s.key)}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-xs font-medium transition-colors border',
                    prospect.stage === s.key
                      ? 'bg-stone-900 text-white border-stone-900'
                      : 'bg-white text-stone-500 border-stone-200 hover:border-stone-400 active:bg-stone-50'
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Days since & follow-up */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-stone-50 rounded-lg">
              <p className="text-xs text-stone-400 mb-1">Last Contact</p>
              <p className={cn('text-sm font-medium', daysSinceColor(days))}>
                {days !== null ? (days === 0 ? 'Today' : `${days} days ago`) : 'Never'}
              </p>
            </div>
            <div className="p-3 bg-stone-50 rounded-lg">
              <p className="text-xs text-stone-400 mb-1">Next Follow-up</p>
              <p className="text-sm font-medium text-stone-700">
                {formatDate(prospect.next_followup_date)}
              </p>
            </div>
          </div>

          {/* Follow-up editor */}
          <div className="p-3 border border-stone-200 rounded-lg space-y-2">
            <label className="block text-xs font-medium text-stone-500">Set Follow-up</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={followupDate}
                onChange={(e) => setFollowupDate(e.target.value)}
                className="flex-1 px-2 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
              />
              <button
                onClick={handleSaveFollowup}
                className="px-3 py-1.5 bg-stone-900 text-white rounded-md text-xs font-medium hover:bg-stone-800"
              >
                Save
              </button>
            </div>
            <input
              value={followupNote}
              onChange={(e) => setFollowupNote(e.target.value)}
              placeholder="Reminder note..."
              className="w-full px-2 py-1.5 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
            />
          </div>

          {/* Activity log */}
          <div>
            <h3 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-3">
              Activity Log
            </h3>

            {/* Add note */}
            <div className="space-y-2 mb-4">
              <div className="flex gap-2">
                <select
                  value={noteType}
                  onChange={(e) => setNoteType(e.target.value)}
                  className="px-2 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                >
                  <option value="note">Note</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="meeting">Meeting</option>
                </select>
                <input
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                  placeholder="Log an activity..."
                  className="flex-1 px-2 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
                />
              </div>
              <button
                onClick={handleAddNote}
                disabled={saving || !newNote.trim()}
                className="w-full sm:w-auto px-4 py-2 bg-stone-900 text-white rounded-md text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
              >
                Add Activity
              </button>
            </div>

            {/* Activity list */}
            <div className="space-y-3">
              {activities.map(activity => (
                <div key={activity.id} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-stone-100 flex items-center justify-center">
                    {activity.activity_type === 'call' && <Phone className="w-3.5 h-3.5 text-stone-500" />}
                    {activity.activity_type === 'email' && <Mail className="w-3.5 h-3.5 text-stone-500" />}
                    {activity.activity_type === 'meeting' && <Calendar className="w-3.5 h-3.5 text-stone-500" />}
                    {activity.activity_type === 'note' && <MessageSquare className="w-3.5 h-3.5 text-stone-500" />}
                    {activity.activity_type === 'stage_change' && <ArrowRight className="w-3.5 h-3.5 text-stone-500" />}
                    {activity.activity_type === 'created' && <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700">{activity.note}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      {formatDate(activity.created_at)} &middot; {activity.activity_type.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              ))}

              {activities.length === 0 && (
                <p className="text-sm text-stone-400 text-center py-4">No activity yet</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
