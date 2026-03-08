'use client';

import { useStore } from '@/lib/store';
import { useEffect, useMemo } from 'react';
import { PIPELINE_STAGES, PreneedProspect } from '@/types/database';
import { daysSince, formatRelative, contactName } from '@/lib/utils';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Calendar,
  ArrowRight,
  Clock,
  Heart,
  Plus,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import WelcomeTour from '@/components/WelcomeTour';
import GettingStartedChecklist, { type ChecklistItem } from '@/components/GettingStartedChecklist';
import { DashboardSkeleton } from '@/components/PageSkeleton';

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
  href,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  href?: string;
}) {
  const inner = (
    <div className="bg-white rounded-xl border border-stone-200 p-5 flex items-start gap-4 hover:border-stone-300 transition-colors">
      <div className={`p-2.5 rounded-lg ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-stone-500">{label}</p>
        <p className="text-2xl font-semibold text-stone-900 mt-0.5">{value}</p>
        {sub && <p className="text-xs text-stone-400 mt-0.5">{sub}</p>}
      </div>
      {href && <ArrowRight className="w-4 h-4 text-stone-300 mt-1.5" />}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

function StageBar({ stages }: { stages: { key: string; label: string; color: string; count: number }[] }) {
  const total = stages.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return <p className="text-sm text-stone-400 py-4">No prospects yet</p>;

  return (
    <div className="space-y-2">
      {stages.map((s) => (
        <div key={s.key} className="flex items-center gap-3">
          <span className="text-xs text-stone-500 w-20 text-right">{s.label}</span>
          <div className="flex-1 bg-stone-100 rounded-full h-6 overflow-hidden">
            <div
              className="h-full rounded-full flex items-center px-2 transition-all duration-500"
              style={{
                width: `${Math.max((s.count / total) * 100, s.count > 0 ? 8 : 0)}%`,
                backgroundColor: s.color,
              }}
            >
              {s.count > 0 && (
                <span className="text-xs font-medium text-white">{s.count}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { prospects, contacts, aftercareCases, profile, dataLoading, fetchContacts, fetchProspects, fetchAftercareCases } = useStore();

  useEffect(() => {
    fetchContacts();
    fetchProspects();
    fetchAftercareCases();
  }, [fetchContacts, fetchProspects, fetchAftercareCases]);

  const stats = useMemo(() => {
    const totalProspects = prospects.length;
    const converted = prospects.filter((p) => p.stage === 'converted').length;
    const conversionRate = totalProspects > 0 ? Math.round((converted / totalProspects) * 100) : 0;

    // BUG-024: Use timezone-safe daysSince for date-only string comparisons
    const overdue = prospects.filter((p) => {
      if (p.stage === 'converted') return false;
      if (p.next_followup_date && (daysSince(p.next_followup_date) ?? 0) > 0) return true;
      const days = p.last_contact_date ? daysSince(p.last_contact_date) : null;
      if (days !== null && days > 30) return true;
      return false;
    });

    const dueToday = prospects.filter((p) => {
      if (p.stage === 'converted' || !p.next_followup_date) return false;
      return daysSince(p.next_followup_date) === 0;
    });

    const stagesWithCounts = PIPELINE_STAGES.map((s) => ({
      ...s,
      count: prospects.filter((p) => p.stage === s.key).length,
    }));

    const recentProspects = [...prospects]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);

    const activeCases = aftercareCases.filter((c) => c.status === 'active').length;
    const overdueTouchpoints = aftercareCases.reduce((count, c) => {
      if (!c.touchpoints) return count;
      return count + c.touchpoints.filter(
        (t) => t.status === 'pending' && (daysSince(t.due_date) ?? 0) > 0
      ).length;
    }, 0);

    return {
      totalProspects,
      converted,
      conversionRate,
      overdue,
      dueToday,
      stagesWithCounts,
      recentProspects,
      activeCases,
      overdueTouchpoints,
      totalContacts: contacts.length,
    };
  }, [prospects, contacts, aftercareCases]);

  // BUG-038: Use the nested contact from the Supabase join instead of manual lookup
  // This ensures data stays in sync after BUG-021 propagation fix
  const getContactForProspect = (p: PreneedProspect) => {
    return p.contact || contacts.find((c) => c.id === p.contact_id);
  };

  // Checklist items — computed from live store state
  const checklistItems: ChecklistItem[] = useMemo(() => [
    { id: 'account', label: 'Set up your account', done: true },
    { id: 'contact', label: 'Add your first contact', done: contacts.length > 0, href: '/contacts' },
    { id: 'prospect', label: 'Create your first prospect', done: prospects.length > 0, href: '/pipeline' },
    { id: 'digest', label: 'Set your daily digest time', done: profile?.digest_time !== '08:00', href: '/settings' },
    { id: 'import', label: 'Import contacts', done: contacts.length >= 5, href: '/import', bonus: true },
  ], [contacts, prospects, profile]);

  const showChecklist = profile
    && !profile.preferences?.checklist_dismissed
    && !checklistItems.every((i) => i.done);

  const showTour = profile && !profile.preferences?.tour_completed;

  // Empty state — brand new account
  const isEmpty = stats.totalProspects === 0 && stats.totalContacts === 0;

  if (dataLoading) return <DashboardSkeleton />;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Welcome tour overlay */}
      {showTour && <WelcomeTour />}

      <div>
        <h1 className="text-xl font-semibold text-stone-900">Dashboard</h1>
        <p className="text-sm text-stone-500 mt-0.5">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Getting Started checklist */}
      {showChecklist && <GettingStartedChecklist items={checklistItems} />}

      {/* Welcome state */}
      {isEmpty && (
        <div className="bg-white rounded-xl border border-stone-200 p-8 text-center">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-stone-500" />
          </div>
          <h2 className="text-base font-semibold text-stone-900 mb-1">Your pipeline is empty</h2>
          <p className="text-stone-500 text-sm mb-6 max-w-sm mx-auto">
            Add your first contact to get started. You can type them in manually or import your existing list.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Link
              href="/contacts"
              className="flex items-center justify-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add First Contact
            </Link>
            <Link
              href="/import"
              className="flex items-center justify-center gap-2 px-4 py-2 border border-stone-200 text-stone-600 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Import Contacts
            </Link>
          </div>
        </div>
      )}

      {/* Top stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3" data-tour-target="stat-cards">
        <StatCard
          label="Active Prospects"
          value={stats.totalProspects - stats.converted}
          sub={`${stats.totalContacts} total contacts`}
          icon={Users}
          color="bg-blue-50 text-blue-600"
          href="/pipeline"
        />
        <StatCard
          label="Overdue Follow-ups"
          value={stats.overdue.length}
          sub={stats.dueToday.length > 0 ? `${stats.dueToday.length} due today` : 'None due today'}
          icon={AlertTriangle}
          color={stats.overdue.length > 0 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}
          href="/pipeline"
        />
        <StatCard
          label="Conversion Rate"
          value={`${stats.conversionRate}%`}
          sub={`${stats.converted} converted`}
          icon={TrendingUp}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          label="Aftercare Cases"
          value={stats.activeCases}
          sub={stats.overdueTouchpoints > 0 ? `${stats.overdueTouchpoints} overdue touchpoints` : 'All on track'}
          icon={Heart}
          color={stats.overdueTouchpoints > 0 ? 'bg-amber-50 text-amber-600' : 'bg-purple-50 text-purple-600'}
          href="/aftercare"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline breakdown */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-stone-900">Pipeline Breakdown</h2>
            <Link href="/pipeline" className="text-xs text-stone-400 hover:text-stone-600">
              View pipeline →
            </Link>
          </div>
          <StageBar stages={stats.stagesWithCounts} />
        </div>

        {/* Due today / overdue */}
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <h2 className="text-sm font-medium text-stone-900 mb-4">Needs Attention</h2>
          {stats.overdue.length === 0 && stats.dueToday.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-stone-400">
              <Calendar className="w-8 h-8 mb-2" />
              <p className="text-sm">You&apos;re all caught up</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...stats.dueToday, ...stats.overdue.filter(
                (p) => !stats.dueToday.find((d) => d.id === p.id)
              )].slice(0, 8).map((p) => {
                const c = getContactForProspect(p);
                const isOverdue = p.next_followup_date && (daysSince(p.next_followup_date) ?? 0) > 0;
                return (
                  <Link
                    key={p.id}
                    href="/pipeline"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors"
                  >
                    <Clock className={`w-4 h-4 flex-shrink-0 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-700 truncate">
                        {c ? contactName(c) : 'Unknown'}
                      </p>
                      <p className="text-xs text-stone-400">
                        {p.next_followup_date
                          ? `Follow-up ${isOverdue ? 'was ' : ''}${formatRelative(p.next_followup_date)}`
                          : `No contact in ${daysSince(p.last_contact_date || p.created_at)} days`}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${isOverdue ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                      {isOverdue ? 'Overdue' : 'Today'}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Recent prospects */}
      {stats.recentProspects.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-stone-900">Recently Added</h2>
            <Link href="/pipeline" className="text-xs text-stone-400 hover:text-stone-600">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-stone-100">
            {stats.recentProspects.map((p) => {
              const c = getContactForProspect(p);
              const stage = PIPELINE_STAGES.find((s) => s.key === p.stage);
              return (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: stage?.color || '#94a3b8' }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-stone-700">{c ? contactName(c) : 'Unknown'}</p>
                  </div>
                  <span className="text-xs text-stone-400">{stage?.label}</span>
                  <span className="text-xs text-stone-300">{formatRelative(p.created_at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
