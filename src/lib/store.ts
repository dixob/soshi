import { create } from 'zustand';
import type { Contact, PreneedProspect, AftercareCase, Activity, AftercareTouchpoint, Profile, Organization } from '@/types/database';
import { createClient } from './supabase';
import { DEFAULT_TOUCHPOINTS } from '@/types/database';
import { addDays, format } from 'date-fns';

interface AppState {
  // Auth
  user: { id: string; email: string } | null;
  profile: Profile | null;
  org: Organization | null;
  loading: boolean;

  // Data
  contacts: Contact[];
  prospects: PreneedProspect[];
  aftercareCases: AftercareCase[];

  // Actions — auth
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;

  // Actions — contacts
  fetchContacts: () => Promise<void>;
  createContact: (data: Partial<Contact>) => Promise<Contact | null>;
  updateContact: (id: string, data: Partial<Contact>) => Promise<void>;
  deleteContact: (id: string) => Promise<void>;

  // Actions — prospects
  fetchProspects: () => Promise<void>;
  createProspect: (data: Partial<PreneedProspect>) => Promise<PreneedProspect | null>;
  updateProspect: (id: string, data: Partial<PreneedProspect>) => Promise<void>;
  moveProspect: (id: string, stage: string) => Promise<void>;

  // Actions — activities
  addActivity: (prospectId: string | null, contactId: string, type: string, note: string) => Promise<void>;
  fetchActivities: (contactId: string) => Promise<Activity[]>;

  // Actions — aftercare
  fetchAftercareCases: () => Promise<void>;
  createAftercareCase: (contactId: string, deceasedName: string, serviceDate: string) => Promise<AftercareCase | null>;
  updateTouchpoint: (id: string, data: Partial<AftercareTouchpoint>) => Promise<void>;
  convertToProspect: (caseId: string) => Promise<void>;

  // Actions — org
  updateOrg: (data: Partial<Organization>) => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  profile: null,
  org: null,
  loading: true,
  contacts: [],
  prospects: [],
  aftercareCases: [],

  initialize: async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { set({ loading: false }); return; }

    const { data: profile } = await supabase
      .from('profiles').select('*').eq('user_id', user.id).single();

    let org = null;
    if (profile) {
      const { data } = await supabase
        .from('organizations').select('*').eq('id', profile.org_id).single();
      org = data;
    }

    set({ user: { id: user.id, email: user.email! }, profile, org, loading: false });

    // Fetch data
    if (profile) {
      get().fetchContacts();
      get().fetchProspects();
      get().fetchAftercareCases();
    }
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null, org: null, contacts: [], prospects: [], aftercareCases: [] });
  },

  // --- Contacts ---
  fetchContacts: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('contacts').select('*').order('created_at', { ascending: false });
    set({ contacts: data || [] });
  },

  createContact: async (data) => {
    const supabase = createClient();
    const { org } = get();
    if (!org) return null;
    const { data: contact, error } = await supabase
      .from('contacts').insert({ ...data, org_id: org.id }).select().single();
    if (error) { console.error(error); return null; }
    set({ contacts: [contact, ...get().contacts] });
    return contact;
  },

  updateContact: async (id, data) => {
    const supabase = createClient();
    await supabase.from('contacts').update(data).eq('id', id);
    set({ contacts: get().contacts.map(c => c.id === id ? { ...c, ...data } : c) });
  },

  deleteContact: async (id) => {
    const supabase = createClient();
    await supabase.from('contacts').delete().eq('id', id);
    set({ contacts: get().contacts.filter(c => c.id !== id) });
  },

  // --- Prospects ---
  fetchProspects: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('preneed_prospects')
      .select('*, contact:contacts(*)')
      .order('created_at', { ascending: false });
    set({ prospects: data || [] });
  },

  createProspect: async (data) => {
    const supabase = createClient();
    const { org, user } = get();
    if (!org || !user) return null;
    const { data: prospect, error } = await supabase
      .from('preneed_prospects')
      .insert({ ...data, org_id: org.id })
      .select('*, contact:contacts(*)')
      .single();
    if (error) { console.error(error); return null; }

    // Log creation activity
    await supabase.from('activities').insert({
      prospect_id: prospect.id,
      contact_id: prospect.contact_id,
      user_id: user.id,
      activity_type: 'created',
      note: 'Prospect created',
    });

    set({ prospects: [prospect, ...get().prospects] });
    return prospect;
  },

  updateProspect: async (id, data) => {
    const supabase = createClient();
    await supabase.from('preneed_prospects').update(data).eq('id', id);
    set({
      prospects: get().prospects.map(p =>
        p.id === id ? { ...p, ...data } : p
      ),
    });
  },

  moveProspect: async (id, stage) => {
    const supabase = createClient();
    const { user } = get();
    const prospect = get().prospects.find(p => p.id === id);
    if (!prospect || !user) return;

    const updates: Partial<PreneedProspect> = {
      stage: stage as PreneedProspect['stage'],
      last_contact_date: format(new Date(), 'yyyy-MM-dd'),
    };
    if (stage === 'converted') updates.converted_at = new Date().toISOString();

    await supabase.from('preneed_prospects').update(updates).eq('id', id);
    await supabase.from('activities').insert({
      prospect_id: id,
      contact_id: prospect.contact_id,
      user_id: user.id,
      activity_type: 'stage_change',
      note: `Moved to ${stage.replace('_', ' ')}`,
    });

    set({
      prospects: get().prospects.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    });
  },

  // --- Activities ---
  addActivity: async (prospectId, contactId, type, note) => {
    const supabase = createClient();
    const { user } = get();
    if (!user) return;
    await supabase.from('activities').insert({
      prospect_id: prospectId,
      contact_id: contactId,
      user_id: user.id,
      activity_type: type,
      note,
    });

    // Update last_contact_date on prospect
    if (prospectId) {
      const today = format(new Date(), 'yyyy-MM-dd');
      await supabase.from('preneed_prospects')
        .update({ last_contact_date: today }).eq('id', prospectId);
      set({
        prospects: get().prospects.map(p =>
          p.id === prospectId ? { ...p, last_contact_date: today } : p
        ),
      });
    }
  },

  fetchActivities: async (contactId) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });
    return data || [];
  },

  // --- Aftercare ---
  fetchAftercareCases: async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from('aftercare_cases')
      .select('*, contact:contacts(*), touchpoints:aftercare_touchpoints(*)')
      .order('service_date', { ascending: false });
    set({ aftercareCases: data || [] });
  },

  createAftercareCase: async (contactId, deceasedName, serviceDate) => {
    const supabase = createClient();
    const { org } = get();
    if (!org) return null;

    const { data: ac, error } = await supabase
      .from('aftercare_cases')
      .insert({ org_id: org.id, contact_id: contactId, deceased_name: deceasedName, service_date: serviceDate })
      .select('*, contact:contacts(*)')
      .single();
    if (error) { console.error(error); return null; }

    // Auto-generate touchpoints
    const sDate = new Date(serviceDate);
    const touchpoints = DEFAULT_TOUCHPOINTS.map(tp => ({
      case_id: ac.id,
      touchpoint_type: tp.type,
      label: tp.label,
      due_date: format(addDays(sDate, tp.days), 'yyyy-MM-dd'),
      status: 'pending',
    }));
    const { data: tps } = await supabase
      .from('aftercare_touchpoints').insert(touchpoints).select();

    const fullCase = { ...ac, touchpoints: tps || [] };
    set({ aftercareCases: [fullCase, ...get().aftercareCases] });
    return fullCase;
  },

  updateTouchpoint: async (id, data) => {
    const supabase = createClient();
    await supabase.from('aftercare_touchpoints').update(data).eq('id', id);
    set({
      aftercareCases: get().aftercareCases.map(ac => ({
        ...ac,
        touchpoints: ac.touchpoints?.map(tp =>
          tp.id === id ? { ...tp, ...data } : tp
        ),
      })),
    });
  },

  convertToProspect: async (caseId) => {
    const ac = get().aftercareCases.find(c => c.id === caseId);
    if (!ac) return;

    // Create prospect from aftercare contact
    await get().createProspect({
      contact_id: ac.contact_id,
      stage: 'prospect',
      lead_source: 'aftercare_conversion',
    });

    // Mark aftercare as converted
    const supabase = createClient();
    await supabase.from('aftercare_cases').update({ status: 'converted' }).eq('id', caseId);
    set({
      aftercareCases: get().aftercareCases.map(c =>
        c.id === caseId ? { ...c, status: 'converted' as const } : c
      ),
    });
  },

  // --- Org/Profile ---
  updateOrg: async (data) => {
    const supabase = createClient();
    const { org } = get();
    if (!org) return;
    await supabase.from('organizations').update(data).eq('id', org.id);
    set({ org: { ...org, ...data } });
  },

  updateProfile: async (data) => {
    const supabase = createClient();
    const { profile } = get();
    if (!profile) return;
    await supabase.from('profiles').update(data).eq('id', profile.id);
    set({ profile: { ...profile, ...data } });
  },
}));
