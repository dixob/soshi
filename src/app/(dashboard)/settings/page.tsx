'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';

export default function SettingsPage() {
  const { org, profile, updateOrg, updateProfile } = useStore();
  const [orgName, setOrgName] = useState(org?.name || '');
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [digestTime, setDigestTime] = useState(profile?.digest_time || '08:00');
  const [timezone, setTimezone] = useState(profile?.timezone || 'America/New_York');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Sync state when store data loads (handles initial null → real data)
  useEffect(() => {
    if (org?.name) setOrgName(org.name);
  }, [org?.name]);
  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
    if (profile?.digest_time) setDigestTime(profile.digest_time);
    if (profile?.timezone) setTimezone(profile.timezone);
  }, [profile?.full_name, profile?.digest_time, profile?.timezone]);

  // BUG-034: Save org and profile in parallel; only show saved state if both succeed
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all([
        updateOrg({ name: orgName }),
        updateProfile({ full_name: fullName, digest_time: digestTime, timezone: timezone }),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-stone-900">Settings</h1>
        <p className="text-sm text-stone-500 mt-0.5">Manage your funeral home and account settings</p>
      </div>

      <form onSubmit={handleSave} className="bg-white border border-stone-200 rounded-lg p-6 max-w-lg space-y-5">
        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Funeral Home Name</label>
          <input
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Your Name</label>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Daily Digest Time</label>
          <input
            type="time"
            value={digestTime}
            onChange={(e) => setDigestTime(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
          />
          <p className="text-xs text-stone-400 mt-1">You&apos;ll receive a daily email with all due follow-ups at this time</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-700 mb-1">Timezone</label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900"
          >
            <option value="America/New_York">Eastern</option>
            <option value="America/Chicago">Central</option>
            <option value="America/Denver">Mountain</option>
            <option value="America/Los_Angeles">Pacific</option>
            <option value="America/Anchorage">Alaska</option>
            <option value="Pacific/Honolulu">Hawaii</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Settings'}
        </button>
      </form>
    </div>
  );
}
