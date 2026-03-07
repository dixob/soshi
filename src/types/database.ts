// Soshi CRM — Core types matching Supabase schema

export type PipelineStage =
  | 'prospect'
  | 'contacted'
  | 'interested'
  | 'quoted'
  | 'follow_up'
  | 'converted';

export type DispositionPreference = 'burial' | 'cremation' | 'undecided';

export type LeadSource =
  | 'referral'
  | 'community_event'
  | 'walk_in'
  | 'website'
  | 'social_media'
  | 'cold_outreach'
  | 'aftercare_conversion'
  | 'other';

export type TouchpointType =
  | 'phone_call'
  | 'email'
  | 'card'
  | 'task';

export type TouchpointStatus = 'pending' | 'completed' | 'skipped' | 'rescheduled';

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'stage_change' | 'created';

export type AftercareStatus = 'active' | 'completed' | 'converted';

export interface Organization {
  id: string;
  name: string;
  created_at: string;
}

export interface UserPreferences {
  tour_completed?: boolean;
  checklist_dismissed?: boolean;
}

export interface Profile {
  id: string;
  user_id: string;
  org_id: string;
  full_name: string;
  role: string;
  digest_time: string; // HH:MM format
  timezone: string;
  preferences: UserPreferences;
  created_at: string;
}

export interface Contact {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  relationship_notes: string | null;
  communication_pref: string | null;
  created_at: string;
  updated_at: string;
}

export interface PreneedProspect {
  id: string;
  org_id: string;
  contact_id: string;
  stage: PipelineStage;
  disposition_pref: DispositionPreference;
  estimated_budget: string | null;
  lead_source: LeadSource;
  next_followup_date: string | null;
  followup_note: string | null;
  last_contact_date: string | null;
  converted_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  contact?: Contact;
  activities?: Activity[];
}

export interface Activity {
  id: string;
  prospect_id: string | null;
  contact_id: string;
  user_id: string;
  activity_type: ActivityType;
  note: string;
  created_at: string;
}

export interface AftercareCase {
  id: string;
  org_id: string;
  contact_id: string;
  deceased_name: string;
  service_date: string;
  status: AftercareStatus;
  created_at: string;
  // Joined
  contact?: Contact;
  touchpoints?: AftercareTouchpoint[];
}

export interface AftercareTouchpoint {
  id: string;
  case_id: string;
  touchpoint_type: TouchpointType;
  label: string;
  due_date: string;
  status: TouchpointStatus;
  completed_at: string | null;
  note: string | null;
  skip_reason: string | null;
  created_at: string;
}

// Pipeline stage metadata
export const PIPELINE_STAGES: { key: PipelineStage; label: string; color: string }[] = [
  { key: 'prospect', label: 'Prospect', color: 'bg-slate-100 border-slate-300' },
  { key: 'contacted', label: 'Contacted', color: 'bg-blue-50 border-blue-300' },
  { key: 'interested', label: 'Interested', color: 'bg-amber-50 border-amber-300' },
  { key: 'quoted', label: 'Quoted', color: 'bg-purple-50 border-purple-300' },
  { key: 'follow_up', label: 'Follow-up', color: 'bg-orange-50 border-orange-300' },
  { key: 'converted', label: 'Converted', color: 'bg-emerald-50 border-emerald-300' },
];

// Default aftercare touchpoints (days after service)
export const DEFAULT_TOUCHPOINTS: {
  days: number;
  type: TouchpointType;
  label: string;
}[] = [
  { days: 14, type: 'phone_call', label: '2-Week Check-in Call' },
  { days: 30, type: 'email', label: '1-Month Grief Resource' },
  { days: 90, type: 'phone_call', label: '3-Month Check-in Call' },
  { days: 180, type: 'phone_call', label: '6-Month Check-in Call' },
  { days: 330, type: 'task', label: 'Anniversary Prep' },
  { days: 365, type: 'phone_call', label: '1-Year Anniversary Contact' },
];
