-- =============================================================
-- Soshi Demo Seed Data
-- Paste this into the Supabase SQL Editor and hit Run.
-- =============================================================

-- Update org name to demo funeral home
UPDATE organizations SET name = 'Oak Valley Memorial' WHERE id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

-- =====================
-- CONTACTS (10)
-- =====================
INSERT INTO contacts (id, org_id, first_name, last_name, phone, email, address, relationship_notes, communication_pref) VALUES
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'Margaret', 'Holloway', '(555) 234-1001', 'mholloway@email.com', '412 Oak Ridge Dr, Maplewood, TN 37115', 'Widowed. Husband passed 2019. Active in church group at First Baptist. Prefers morning calls.', 'phone'),
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'James', 'Prescott', '(555) 234-1002', 'jprescott@email.com', '88 Elm St, Maplewood, TN 37115', 'Retired teacher. Wife Alice has dementia — he is planning for both of them. Very detail-oriented.', 'email'),
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'Linda', 'Chen', '(555) 234-1003', 'lchen@email.com', '1920 Willow Bend Ct, Maplewood, TN 37115', 'Daughter of Mrs. Nakamura (aftercare). Starting to think about her own arrangements. Prefers text.', 'email'),
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'Robert', 'Washington', '(555) 234-1004', 'rwashington@email.com', '305 Pine Hill Rd, Maplewood, TN 37115', 'Vietnam vet. VA benefits eligible. Wants military honors. Met at Memorial Day community event.', 'phone'),
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'Patricia', 'Brennan', '(555) 234-1005', 'pbrennan@email.com', '67 Magnolia Ave, Maplewood, TN 37115', 'Lost son in car accident last year. Referred by grief support group. Very specific about cremation.', 'phone'),
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'Thomas', 'Gutierrez', '(555) 234-1006', 'tgutierrez@email.com', '1450 Cedar Ln, Maplewood, TN 37115', 'Local business owner (auto shop). Came in for a friend''s service, started asking about preneed. Wife Maria also interested.', 'email'),
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'Dorothy', 'Nakamura', '(555) 234-1007', NULL, '2300 Sunset Dr, Maplewood, TN 37115', 'Husband Kenji passed 3 months ago. Daughter Linda helps with communication. Hard of hearing — prefers in-person.', 'phone'),
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'William', 'Foster', '(555) 234-1008', 'wfoster@email.com', '890 Birch St, Maplewood, TN 37115', 'Recently diagnosed with terminal illness. Family wants to plan proactively. Daughter Karen is primary contact.', 'email'),
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'Sandra', 'Mitchell', '(555) 234-1009', 'smitchell@email.com', '456 River Rd, Maplewood, TN 37115', 'Church choir director. Very community-connected. Could be a great referral source.', 'phone'),
  (gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', 'Frank', 'Kowalski', '(555) 234-1010', 'fkowalski@email.com', '112 Maple Ave, Maplewood, TN 37115', 'Polish Catholic family. Wants traditional burial with specific religious customs. Wife Irena passed 2023.', 'phone');

-- =====================
-- PRENEED PROSPECTS (8 across stages)
-- =====================

-- Margaret Holloway → Quoted
INSERT INTO preneed_prospects (id, org_id, contact_id, stage, disposition_pref, estimated_budget, lead_source, next_followup_date, followup_note, last_contact_date)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'quoted', 'burial', 8500, 'community_event',
  (CURRENT_DATE + INTERVAL '2 days')::date,
  'Reviewing the quote we sent. She wants to discuss payment plan options. Call Thursday morning.',
  (CURRENT_DATE - INTERVAL '5 days')::date
FROM contacts WHERE first_name = 'Margaret' AND last_name = 'Holloway' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

-- James Prescott → Interested
INSERT INTO preneed_prospects (id, org_id, contact_id, stage, disposition_pref, estimated_budget, lead_source, next_followup_date, followup_note, last_contact_date)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'interested', 'burial', 15000, 'walk_in',
  (CURRENT_DATE + INTERVAL '1 day')::date,
  'Wants side-by-side burial plots. Need to show him Riverside Garden section. Bring plot map.',
  (CURRENT_DATE - INTERVAL '12 days')::date
FROM contacts WHERE first_name = 'James' AND last_name = 'Prescott' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

-- Robert Washington → Contacted
INSERT INTO preneed_prospects (id, org_id, contact_id, stage, disposition_pref, estimated_budget, lead_source, next_followup_date, followup_note, last_contact_date)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'contacted', 'burial', 6000, 'community_event',
  (CURRENT_DATE - INTERVAL '3 days')::date,
  'Called twice, no answer. Try again — he mentioned he''s hard of hearing. Morning is best.',
  (CURRENT_DATE - INTERVAL '18 days')::date
FROM contacts WHERE first_name = 'Robert' AND last_name = 'Washington' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

-- Patricia Brennan → Follow-up
INSERT INTO preneed_prospects (id, org_id, contact_id, stage, disposition_pref, estimated_budget, lead_source, next_followup_date, followup_note, last_contact_date)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'follow_up', 'cremation', 4500, 'referral',
  (CURRENT_DATE)::date,
  'She wanted to think about the scattering ceremony options. Follow up today — don''t push, she''s still grieving her son.',
  (CURRENT_DATE - INTERVAL '8 days')::date
FROM contacts WHERE first_name = 'Patricia' AND last_name = 'Brennan' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

-- Thomas Gutierrez → Prospect
INSERT INTO preneed_prospects (id, org_id, contact_id, stage, disposition_pref, estimated_budget, lead_source, next_followup_date, followup_note, last_contact_date)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'prospect', 'undecided', NULL, 'walk_in',
  (CURRENT_DATE + INTERVAL '5 days')::date,
  'Said "I should probably do this" at his friend''s service. Warm lead. Wife Maria may come too.',
  (CURRENT_DATE - INTERVAL '2 days')::date
FROM contacts WHERE first_name = 'Thomas' AND last_name = 'Gutierrez' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

-- William Foster → Interested
INSERT INTO preneed_prospects (id, org_id, contact_id, stage, disposition_pref, estimated_budget, lead_source, next_followup_date, followup_note, last_contact_date)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'interested', 'cremation', 5500, 'referral',
  (CURRENT_DATE - INTERVAL '1 day')::date,
  'Daughter Karen is point of contact. They want to finalize before his next treatment cycle. Handle with extra care.',
  (CURRENT_DATE - INTERVAL '10 days')::date
FROM contacts WHERE first_name = 'William' AND last_name = 'Foster' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

-- Sandra Mitchell → Contacted
INSERT INTO preneed_prospects (id, org_id, contact_id, stage, disposition_pref, estimated_budget, lead_source, next_followup_date, followup_note, last_contact_date)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'contacted', 'undecided', NULL, 'cold_outreach',
  (CURRENT_DATE + INTERVAL '7 days')::date,
  'Very open to learning. Mentioned she''d tell her choir group if she had a good experience. Nurture carefully.',
  (CURRENT_DATE - INTERVAL '4 days')::date
FROM contacts WHERE first_name = 'Sandra' AND last_name = 'Mitchell' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

-- Frank Kowalski → Converted
INSERT INTO preneed_prospects (id, org_id, contact_id, stage, disposition_pref, estimated_budget, lead_source, last_contact_date)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'converted', 'burial', 9200, 'walk_in',
  (CURRENT_DATE - INTERVAL '30 days')::date
FROM contacts WHERE first_name = 'Frank' AND last_name = 'Kowalski' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

-- =====================
-- ACTIVITIES
-- =====================

-- Margaret Holloway activities
INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'created', 'Added from community event list', (CURRENT_DATE - INTERVAL '45 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Margaret' AND c.last_name = 'Holloway';

INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'call', 'Initial call — she''s been thinking about preneed since her husband passed. Very receptive.', (CURRENT_DATE - INTERVAL '40 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Margaret' AND c.last_name = 'Holloway';

INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'stage_change', 'Moved to Contacted', (CURRENT_DATE - INTERVAL '40 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Margaret' AND c.last_name = 'Holloway';

INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'meeting', 'Met at the funeral home. Showed her options. She liked the Rose Garden package.', (CURRENT_DATE - INTERVAL '25 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Margaret' AND c.last_name = 'Holloway';

INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'stage_change', 'Moved to Interested', (CURRENT_DATE - INTERVAL '25 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Margaret' AND c.last_name = 'Holloway';

INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'email', 'Sent Rose Garden package quote — $8,500 with payment plan option', (CURRENT_DATE - INTERVAL '5 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Margaret' AND c.last_name = 'Holloway';

INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'stage_change', 'Moved to Quoted', (CURRENT_DATE - INTERVAL '5 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Margaret' AND c.last_name = 'Holloway';

-- Frank Kowalski activities
INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'created', 'Walked in after wife Irena''s service', (CURRENT_DATE - INTERVAL '90 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Frank' AND c.last_name = 'Kowalski';

INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'meeting', 'Wants to be buried next to Irena. Polish Catholic customs — full rosary vigil.', (CURRENT_DATE - INTERVAL '60 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Frank' AND c.last_name = 'Kowalski';

INSERT INTO activities (prospect_id, contact_id, user_id, activity_type, note, created_at)
SELECT p.id, c.id, '786906ad-23eb-4614-a40f-24372e75db9e', 'stage_change', 'Moved to Converted — signed preneed contract', (CURRENT_DATE - INTERVAL '30 days')::timestamp
FROM preneed_prospects p JOIN contacts c ON p.contact_id = c.id WHERE c.first_name = 'Frank' AND c.last_name = 'Kowalski';

-- =====================
-- AFTERCARE CASES (3)
-- =====================

-- Case 1: Dorothy Nakamura — husband Kenji passed 3 months ago
INSERT INTO aftercare_cases (id, org_id, contact_id, deceased_name, service_date, status)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'Kenji Nakamura', (CURRENT_DATE - INTERVAL '90 days')::date, 'active'
FROM contacts WHERE first_name = 'Dorothy' AND last_name = 'Nakamura' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'phone_call', '2-Week Check-in Call',
  (ac.service_date + INTERVAL '14 days')::date, 'completed',
  (ac.service_date + INTERVAL '14 days')::timestamp,
  'Dorothy appreciative of the call. Daughter Linda was present. They''re doing okay.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Kenji Nakamura';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'email', '1-Month Grief Resources',
  (ac.service_date + INTERVAL '30 days')::date, 'completed',
  (ac.service_date + INTERVAL '32 days')::timestamp,
  'Sent grief support pamphlet and local support group info. Linda confirmed receipt.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Kenji Nakamura';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status)
SELECT ac.id, 'phone_call', '3-Month Check-in Call',
  (ac.service_date + INTERVAL '90 days')::date, 'pending'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Kenji Nakamura';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status)
SELECT ac.id, 'phone_call', '6-Month Check-in',
  (ac.service_date + INTERVAL '180 days')::date, 'pending'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Kenji Nakamura';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status)
SELECT ac.id, 'card', '11-Month Pre-Anniversary',
  (ac.service_date + INTERVAL '330 days')::date, 'pending'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Kenji Nakamura';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status)
SELECT ac.id, 'phone_call', '1-Year Anniversary',
  (ac.service_date + INTERVAL '365 days')::date, 'pending'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Kenji Nakamura';

-- Case 2: Patricia Brennan — son passed 14 months ago
INSERT INTO aftercare_cases (id, org_id, contact_id, deceased_name, service_date, status)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'Michael Brennan', (CURRENT_DATE - INTERVAL '14 months')::date, 'active'
FROM contacts WHERE first_name = 'Patricia' AND last_name = 'Brennan' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'phone_call', '2-Week Check-in Call',
  (ac.service_date + INTERVAL '14 days')::date, 'completed',
  (ac.service_date + INTERVAL '15 days')::timestamp,
  'Very emotional call. She''s struggling. Recommended grief counselor Dr. Hansen.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Michael Brennan';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'email', '1-Month Grief Resources',
  (ac.service_date + INTERVAL '30 days')::date, 'completed',
  (ac.service_date + INTERVAL '30 days')::timestamp,
  'Sent resources for parents who''ve lost children. Included The Compassionate Friends info.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Michael Brennan';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'phone_call', '3-Month Check-in Call',
  (ac.service_date + INTERVAL '90 days')::date, 'completed',
  (ac.service_date + INTERVAL '92 days')::timestamp,
  'Doing better. Started attending grief support group. First time she mentioned thinking about her own plans.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Michael Brennan';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'phone_call', '6-Month Check-in',
  (ac.service_date + INTERVAL '180 days')::date, 'completed',
  (ac.service_date + INTERVAL '181 days')::timestamp,
  'Mentioned cremation and scattering for herself. Created preneed prospect.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Michael Brennan';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'card', '11-Month Pre-Anniversary',
  (ac.service_date + INTERVAL '330 days')::date, 'completed',
  (ac.service_date + INTERVAL '330 days')::timestamp,
  'Sent handwritten card. She called to say thank you — no one else remembered.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Michael Brennan';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'phone_call', '1-Year Anniversary',
  (ac.service_date + INTERVAL '365 days')::date, 'completed',
  (ac.service_date + INTERVAL '365 days')::timestamp,
  'Anniversary call. She''s in a much better place. Actively planning her own cremation preneed now.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Michael Brennan';

-- Case 3: Frank Kowalski's wife Irena (passed 2023, completed aftercare)
INSERT INTO aftercare_cases (id, org_id, contact_id, deceased_name, service_date, status)
SELECT gen_random_uuid(), '46749d9f-eb25-432e-bce1-6e27c83430cc', id, 'Irena Kowalski', '2023-11-15'::date, 'completed'
FROM contacts WHERE first_name = 'Frank' AND last_name = 'Kowalski' AND org_id = '46749d9f-eb25-432e-bce1-6e27c83430cc';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'phone_call', '2-Week Check-in Call', '2023-11-29'::date, 'completed', '2023-11-29'::timestamp,
  'Frank is devastated but stoic. His daughter is staying with him for a few weeks.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Irena Kowalski';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'email', '1-Month Grief Resources', '2023-12-15'::date, 'completed', '2023-12-16'::timestamp,
  'Sent resources. Frank''s daughter confirmed he read them.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Irena Kowalski';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'phone_call', '3-Month Check-in Call', '2024-02-15'::date, 'completed', '2024-02-15'::timestamp,
  'Doing better. Going to Polish club weekly again. Started asking about his own arrangements.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Irena Kowalski';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'phone_call', '6-Month Check-in', '2024-05-15'::date, 'completed', '2024-05-16'::timestamp,
  'Came in to discuss preneed. Wants to be buried next to Irena. Created prospect — he converted to preneed.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Irena Kowalski';

INSERT INTO aftercare_touchpoints (case_id, touchpoint_type, label, due_date, status, completed_at, note)
SELECT ac.id, 'card', '1-Year Anniversary', '2024-11-15'::date, 'completed', '2024-11-15'::timestamp,
  'Sent anniversary card. He called to thank us and said the preneed plan gives him peace of mind.'
FROM aftercare_cases ac WHERE ac.deceased_name = 'Irena Kowalski';
