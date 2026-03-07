import { create } from 'zustand';
import type { Contact, PreneedProspect, AftercareCase, Activity, AftercareTouchpoint, Profile, Organization } from '@/types/database';
import { createClient } from './supabase';
import { DEFAULT_TOUCHPOINTS } from '@/types/database';
import { addDays, format } from 'date-fns';
import { emitToast } from './toast-events';

interface AppState {
  // Auth
  user: { id: string; email: string } | null;
  profile: Profile | null;
  org: Organization | null;
  loading: boolean;
  dataLoading: boolean;

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

  // Actions — tutorial
  markTourCompleted: () => Promise<void>;
  dismissChecklist: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  profile: null,
  org: null,
  loading: true,
  dataLoading: true,
  contacts: [],
  prospects: [],
  aftercareCases: [],

  initialize: async () => {
    // Prevent concurrent initialization
    if (get().loading && get().user) return;
    set({ loading: true });
    try {
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
        set({ dataLoading: true });
        await Promise.all([
          get().fetchContacts(),
          get().fetchProspects(),
          get().fetchAftercareCases(),
        ]);
        set({ dataLoading: false });
      } else {
        set({ dataLoading: false });
      }
    } catch (err) {
      console.error('initialize error:', err);
      set({ loading: false, dataLoading: false });
    }
  },

  signOut: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ user: null, profile: null, org: null, contacts: [], prospects: [], aftercareCases: [] });
    window.location.href = '/login';
  },

  // --- Contacts ---
  fetchContacts: async () => {
    const supabase = createClient();
    const { org } = get();
    // BUG-019: Filter by org_id for defense-in-depth (supplements RLS)
    const { data } = await supabase
      .from('contacts').select('*').eq('org_id', org!.id).order('created_at', { ascending: false });
    set({ contacts: data || [] });
  },

  createContact: async (data) => {
    const supabase = createClient();
    const { org } = get();
    if (!org) return null;
    const { data: contact, error } = await supabase
      .from('contacts').insert({ ...data, org_id: org.id }).select().single();
    if (error) { console.error(error); emitToast('Failed to create contact', 'error'); return null; }
    set({ contacts: [contact, ...get().contacts] });
    emitToast('Contact created', 'success');
    return contact;
  },

  updateContact: async (id, data) => {
    const supabase = createClient();
    const { error } = await supabase.from('contacts').update(data).eq('id', id);
    if (error) { console.error(error); emitToast('Failed to update contact', 'error'); return; }
    set({ contacts: get().contacts.map(c => c.id === id ? { ...c, ...data } : c) });
    // BUG-021: Propagate contact changes to nested contact objects in prospects and aftercare cases
    set({
      prospects: get().prospects.map(p =>
        p.contact_id === id && p.contact ? { ...p, contact: { ...p.contact, ...data } } : p
      ),
      aftercareCases: get().aftercareCases.map(ac =>
        ac.contact_id === id && ac.contact ? { ...ac, contact: { ...ac.contact, ...data } } : ac
      ),
    });
    emitToast('Contact updated', 'success');
  },

  deleteContact: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from('contacts').delete().eq('id', id);
    if (error) { console.error(error); emitToast('Failed to delete contact', 'error'); return; }
    set({ contacts: get().contacts.filter(c => c.id !== id) });
    // Also remove local prospects/aftercare linked to this contact
    set({
      prospects: get().prospects.filter(p => p.contact_id !== id),
      aftercareCases: get().aftercareCases.filter(ac => ac.contact_id !== id),
    });
    emitToast('Contact deleted', 'success');
  },

  // --- Prospects ---
  fetchProspects: async () => {
    const supabase = createClient();
    const { org } = get();
    // BUG-019: Filter by org_id for defense-in-depth (supplements RLS)
    const { data } = await supabase
      .from('preneed_prospects')
      .select('*, contact:contacts(*)')
      .eq('org_id', org!.id)
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
    if (error) { console.error(error); emitToast('Failed to create prospect', 'error'); return null; }

    // Log creation activity
    await supabase.from('activities').insert({
      org_id: org.id,
      prospect_id: prospect.id,
      contact_id: prospect.contact_id,
      user_id: user.id,
      activity_type: 'created',
      note: 'Prospect created',
    });

    set({ prospects: [prospect, ...get().prospects] });
    emitToast('Prospect created', 'success');
    return prospect;
  },

  updateProspect: async (id, data) => {
    const supabase = createClient();
    const { error } = await supabase.from('preneed_prospects').update(data).eq('id', id);
    if (error) { console.error(error); emitToast('Failed to update prospect', 'error'); return; }
    set({
      prospects: get().prospects.map(p =>
        p.id === id ? { ...p, ...data } : p
      ),
    });
    emitToast('Prospect updated', 'success');
  },

  moveProspect: async (id, stage) => {
    const supabase = createClient();
    const { user } = get();
    const prospect = get().prospects.find(p => p.id === id);
    if (!prospect || !user) return;

    const previousStage = prospect.stage;
    const stageLabel = stage.replaceAll('_', ' ');
    const updates: Partial<PreneedProspect> = {
      stage: stage as PreneedProspect['stage'],
      last_contact_date: format(new Date(), 'yyyy-MM-dd'),
    };
    if (stage === 'converted') updates.converted_at = new Date().toISOString();

    // Optimistic update
    set({
      prospects: get().prospects.map(p =>
        p.id === id ? { ...p, ...updates } : p
      ),
    });

    const { error } = await supabase.from('preneed_prospects').update(updates).eq('id', id);
    if (error) {
      // Rollback on failure
      console.error(error);
      set({
        prospects: get().prospects.map(p =>
          p.id === id ? { ...p, stage: previousStage, last_contact_date: prospect.last_contact_date, converted_at: prospect.converted_at } : p
        ),
      });
      emitToast('Failed to move prospect', 'error');
      return;
    }

    const { org: moveOrg } = get();
    await supabase.from('activities').insert({
      org_id: moveOrg?.id,
      prospect_id: id,
      contact_id: prospect.contact_id,
      user_id: user.id,
      activity_type: 'stage_change',
      note: `Moved to ${stageLabel}`,
    });

    emitToast(`Moved to ${stageLabel}`, 'success');
  },

  // --- Activities ---
  addActivity: async (prospectId, contactId, type, note) => {
    const supabase = createClient();
    const { user } = get();
    if (!user) return;
    const { org: actOrg } = get();
    const { error } = await supabase.from('activities').insert({
      org_id: actOrg?.id,
      prospect_id: prospectId,
      contact_id: contactId,
      user_id: user.id,
      activity_type: type,
      note,
    });
    if (error) { console.error(error); emitToast('Failed to log activity', 'error'); return; }

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
    emitToast('Activity logged', 'success');
  },

  fetchActivities: async (contactId) => {
    const supabase = createClient();
    const { org } = get();
    // BUG-019: Filter by org_id for defense-in-depth (supplements RLS)
    const { data } = await supabase
      .from('activities')
      .select('*')
      .eq('org_id', org!.id)
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false });
    return data || [];
  },

  // --- Aftercare ---
  fetchAftercareCases: async () => {
    const supabase = createClient();
    const { org } = get();
    // BUG-019: Filter by org_id for defense-in-depth (supplements RLS)
    const { data } = await supabase
      .from('aftercare_cases')
      .select('*, contact:contacts(*), touchpoints:aftercare_touchpoints(*)')
      .eq('org_id', org!.id)
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
    if (error) { console.error(error); emitToast('Failed to create aftercare case', 'error'); return null; }

    // Auto-generate touchpoints
    const sDate = new Date(serviceDate);
    const touchpoints = DEFAULT_TOUCHPOINTS.map(tp => ({
      org_id: org.id,
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
    emitToast('Aftercare case created with 6 touchpoints', 'success');
    return fullCase;
  },

  updateTouchpoint: async (id, data) => {
    const supabase = createClient();
    const { error } = await supabase.from('aftercare_touchpoints').update(data).eq('id', id);
    if (error) { console.error(error); emitToast('Failed to update touchpoint', 'error'); return; }
    set({
      aftercareCases: get().aftercareCases.map(ac => ({
        ...ac,
        touchpoints: ac.touchpoints?.map(tp =>
          tp.id === id ? { ...tp, ...data } : tp
        ),
      })),
    });
    const action = data.status === 'completed' ? 'completed' : data.status === 'skipped' ? 'skipped' : 'updated';
    emitToast(`Touchpoint ${action}`, 'success');
  },

  convertToProspect: async (caseId) => {
    const ac = get().aftercareCases.find(c => c.id === caseId);
    if (!ac) return;

    // BUG-018: Guard against duplicate conversion
    const existingProspect = get().prospects.find(p => p.contact_id === ac.contact_id);
    if (existingProspect) {
      emitToast('This contact already has a prospect record', 'error');
      return;
    }

    // Create prospect from aftercare contact (createProspect already emits its own toast)
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
    emitToast('Aftercare case converted to prospect', 'success');
  },

  // --- Org/Profile ---
  updateOrg: async (data) => {
    const supabase = createClient();
    const { org } = get();
    if (!org) return;
    const { error } = await supabase.from('organizations').update(data).eq('id', org.id);
    if (error) { console.error(error); emitToast('Failed to update organization', 'error'); return; }
    set({ org: { ...org, ...data } });
    emitToast('Organization updated', 'success');
  },

  updateProfile: async (data) => {
    const supabase = createClient();
    const { profile } = get();
    if (!profile) return;
    const { error } = await supabase.from('profiles').update(data).eq('id', profile.id);
    if (error) { console.error(error); emitToast('Failed to update profile', 'error'); return; }
    set({ profile: { ...profile, ...data } });
    emitToast('Settings saved', 'success');
  },

  // --- Tutorial ---
  markTourCompleted: async () => {
    const { profile } = get();
    if (!profile) return;
    const prefs = { ...profile.preferences, tour_completed: true };
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ preferences: prefs }).eq('id', profile.id);
    if (error) { console.error(error); return; }
    set({ profile: { ...profile, preferences: prefs } });
  },

  dismissChecklist: async () => {
    const { profile } = get();
    if (!profile) return;
    const prefs = { ...profile.preferences, checklist_dismissed: true };
    const supabase = createClient();
    const { error } = await supabase.from('profiles').update({ preferences: prefs }).eq('id', profile.id);
    if (error) { console.error(error); return; }
    set({ profile: { ...profile, preferences: prefs } });
  },
}));
