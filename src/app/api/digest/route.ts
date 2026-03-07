import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Vercel Cron calls this route — authorized via CRON_SECRET
// NOTE: Must use Node.js runtime (not edge) — supabase.auth.admin requires Node.js
export const runtime = 'nodejs';

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get all profiles with their orgs
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*, organization:organizations(name)');

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ message: 'No profiles found' });
  }

  const results: { email: string; status: string }[] = [];

  for (const profile of profiles) {
    try {
      // Check if it's the right time for this user's digest
      const userTz = profile.timezone || 'America/New_York';
      const digestTime = profile.digest_time || '08:00';
      const now = new Date();

      // BUG-012: Use Intl.DateTimeFormat instead of toLocaleString round-trip
      const dtf = new Intl.DateTimeFormat('en-US', {
        timeZone: userTz,
        hour: 'numeric',
        minute: 'numeric',
        hour12: false,
      });
      const parts = dtf.formatToParts(now);
      const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
      const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
      const [targetHour, targetMinute] = digestTime.split(':').map(Number);

      // Only send if within 30-minute window of their digest time
      // BUG-028: Handle midnight crossing (e.g. target 23:45, current 00:15)
      const currentMinutes = currentHour * 60 + currentMinute;
      const targetMinutes = targetHour * 60 + targetMinute;
      let diff = Math.abs(currentMinutes - targetMinutes);
      if (diff > 720) diff = 1440 - diff; // wrap around midnight
      if (diff > 30) {
        continue;
      }

      // Get user's auth email
      const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id);
      if (!authUser?.user?.email) continue;

      const orgId = profile.org_id;
      const today = now.toISOString().split('T')[0];

      // Fetch due follow-ups (preneed)
      const { data: dueProspects } = await supabase
        .from('preneed_prospects')
        .select('*, contact:contacts(*)')
        .eq('org_id', orgId)
        .neq('stage', 'converted')
        .lte('next_followup_date', today)
        .order('next_followup_date', { ascending: true });

      // Fetch overdue prospects (no contact in 30+ days)
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      const { data: overdueProspects } = await supabase
        .from('preneed_prospects')
        .select('*, contact:contacts(*)')
        .eq('org_id', orgId)
        .neq('stage', 'converted')
        .lt('last_contact_date', thirtyDaysAgo);

      // Fetch due aftercare touchpoints (filtered to this org via join)
      const { data: dueTouchpoints } = await supabase
        .from('aftercare_touchpoints')
        .select('*, case:aftercare_cases!inner(*, contact:contacts(*))')
        .eq('status', 'pending')
        .eq('case.org_id', orgId)
        .lte('due_date', today)
        .order('due_date', { ascending: true });

      const orgTouchpoints = dueTouchpoints || [];

      // Skip if nothing to report
      const totalItems = (dueProspects?.length || 0) + (overdueProspects?.length || 0) + orgTouchpoints.length;
      if (totalItems === 0) {
        results.push({ email: authUser.user.email, status: 'skipped (nothing due)' });
        continue;
      }

      // Build email HTML
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://trysoshi.com';
      const orgName = (profile as any).organization?.name || 'Your Funeral Home';
      const html = buildDigestEmail({
        orgName,
        userName: profile.full_name || 'there',
        dueProspects: dueProspects || [],
        overdueProspects: overdueProspects || [],
        dueTouchpoints: orgTouchpoints,
        appUrl,
        today,
      });

      // Send via Resend
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'Soshi <digest@trysoshi.com>',
          to: authUser.user.email,
          subject: `Soshi Daily Digest — ${totalItems} item${totalItems === 1 ? '' : 's'} need attention`,
          html,
        }),
      });

      if (resendRes.ok) {
        results.push({ email: authUser.user.email, status: 'sent' });
      } else {
        const error = await resendRes.text();
        results.push({ email: authUser.user.email, status: `error: ${error}` });
      }
    } catch (err: any) {
      results.push({ email: 'unknown', status: `error: ${err.message}` });
    }
  }

  return NextResponse.json({ results, timestamp: new Date().toISOString() });
}

// BUG-031: Escape user-controlled strings to prevent XSS in email HTML
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// --- Email template ---
function buildDigestEmail({
  orgName,
  userName,
  dueProspects,
  overdueProspects,
  dueTouchpoints,
  appUrl,
  today,
}: {
  orgName: string;
  userName: string;
  dueProspects: any[];
  overdueProspects: any[];
  dueTouchpoints: any[];
  appUrl: string;
  today: string;
}) {
  const contactName = (c: any) => escapeHtml(c ? `${c.first_name || ''} ${c.last_name || ''}`.trim() : 'Unknown');

  const prospectRows = dueProspects
    .map((p) => {
      const name = contactName(p.contact);
      const isOverdue = p.next_followup_date < today;
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f5f4;">
            <a href="${appUrl}/pipeline" style="color:#1c1917;text-decoration:none;font-weight:500;">${name}</a>
            ${p.followup_note ? `<br><span style="color:#a8a29e;font-size:12px;">${escapeHtml(p.followup_note)}</span>` : ''}
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f5f4;text-align:right;">
            <span style="background:${isOverdue ? '#fef2f2' : '#fefce8'};color:${isOverdue ? '#dc2626' : '#ca8a04'};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;">
              ${isOverdue ? 'Overdue' : 'Due Today'}
            </span>
          </td>
        </tr>`;
    })
    .join('');

  const overdueRows = overdueProspects
    .filter((p) => !dueProspects.find((d) => d.id === p.id))
    .map((p) => {
      const name = contactName(p.contact);
      const daysSince = Math.floor(
        (new Date().getTime() - new Date(p.last_contact_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f5f4;">
            <a href="${appUrl}/pipeline" style="color:#1c1917;text-decoration:none;font-weight:500;">${name}</a>
            <br><span style="color:#a8a29e;font-size:12px;">No contact in ${daysSince} days</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f5f4;text-align:right;">
            <span style="background:#fef2f2;color:#dc2626;padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;">
              ${daysSince}d overdue
            </span>
          </td>
        </tr>`;
    })
    .join('');

  const touchpointRows = dueTouchpoints
    .map((tp: any) => {
      const caseName = escapeHtml(tp.case?.deceased_name || 'Unknown');
      const familyName = contactName(tp.case?.contact);
      const isOverdue = tp.due_date < today;
      return `
        <tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f5f4;">
            <a href="${appUrl}/aftercare" style="color:#1c1917;text-decoration:none;font-weight:500;">${escapeHtml(tp.label)}</a>
            <br><span style="color:#a8a29e;font-size:12px;">${caseName} — ${familyName}</span>
          </td>
          <td style="padding:8px 12px;border-bottom:1px solid #f5f5f4;text-align:right;">
            <span style="background:${isOverdue ? '#fef2f2' : '#f0fdf4'};color:${isOverdue ? '#dc2626' : '#16a34a'};padding:2px 8px;border-radius:4px;font-size:12px;font-weight:500;">
              ${isOverdue ? 'Overdue' : 'Due Today'}
            </span>
          </td>
        </tr>`;
    })
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#fafaf9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:24px 16px;">
    <!-- Header -->
    <div style="background:#1c1917;color:white;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:18px;font-weight:600;">Soshi</h1>
      <p style="margin:4px 0 0;font-size:13px;color:#a8a29e;">${escapeHtml(orgName)} — Daily Digest</p>
    </div>

    <div style="background:white;padding:24px;border:1px solid #e7e5e4;border-top:none;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 20px;color:#44403c;font-size:14px;">
        Good morning, ${escapeHtml(userName)}. Here&apos;s what needs your attention today.
      </p>

      ${(prospectRows || overdueRows) ? `
      <!-- Preneed Follow-ups -->
      <h2 style="margin:0 0 8px;font-size:14px;color:#1c1917;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
        Preneed Follow-ups
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${prospectRows}${overdueRows}
      </table>` : ''}

      ${touchpointRows ? `
      <!-- Aftercare Touchpoints -->
      <h2 style="margin:0 0 8px;font-size:14px;color:#1c1917;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">
        Aftercare Touchpoints
      </h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        ${touchpointRows}
      </table>` : ''}

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px;">
        <a href="${appUrl}/dashboard" style="display:inline-block;background:#1c1917;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-size:14px;font-weight:500;">
          Open Dashboard
        </a>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;color:#a8a29e;font-size:11px;margin-top:16px;">
      You&apos;re receiving this because you have daily digests enabled in Soshi.
      <a href="${appUrl}/settings" style="color:#78716c;">Manage preferences</a>
    </p>
  </div>
</body>
</html>`;
}
