import { Resend } from "resend";
import { ENV } from "./env.js";
import { getTemplate, substitutePlaceholders, paragraphsToHtml } from "./emailTemplateDefaults.js";

export const resend = new ResendSafe();

// Thin wrapper so a missing/invalid RESEND_API_KEY during local dev
// doesn't crash the whole app on import — it just logs instead of sending.
function ResendSafe() {
  const client = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

  return {
    async send({ to, subject, html, attachments }) {
      if (!client) {
        console.warn(
          `RESEND_API_KEY not set — skipping email to ${to} (subject: "${subject}")`
        );
        return { skipped: true };
      }

      return client.emails.send({
        from: ENV.RESEND_FROM_EMAIL || "InterVue <onboarding@resend.dev>",
        to,
        subject,
        html,
        reply_to: ENV.RESEND_REPLY_TO || undefined,
        attachments: attachments && attachments.length > 0 ? attachments : undefined,
      });
    },
  };
}

export async function sendSelectionEmail({
  to,
  name,
  jobTitle,
  sessionCode,
  sessionLink,
}) {
  // Subject and the narrative paragraphs below now come from the
  // "candidate_selected" EmailTemplate in the DB (editable from
  // Admin → Email Templates), falling back to the original hardcoded
  // copy if no template exists yet. The header banner, interview-code
  // box, and "Join Interview" button stay structural — they depend on
  // sessionCode/sessionLink, which aren't part of the editable template.
  const template = await getTemplate("candidate_selected");
  const data = { candidateName: name, jobTitle };
  const subject = substitutePlaceholders(template.subject, data);
  const bodyHtml = paragraphsToHtml(substitutePlaceholders(template.body, data));

  return resend.send({
    to,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Interview Invitation</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Segoe UI,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

<tr>
<td style="background:#1e3a8a;padding:24px 36px;">
<table width="100%">
<tr>
<td style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">
InterVue
</td>

<td align="right" style="color:#dbeafe;font-size:13px;">
Interview Management Platform
</td>
</tr>
</table>
</td>
</tr>

<tr>
<td style="padding:40px;">

<p style="margin:0 0 6px;color:#1d4ed8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">
Interview Invitation
</p>

<h2 style="margin:0 0 25px;color:#111827;font-size:24px;">
You have been shortlisted
</h2>

${bodyHtml}

<table width="100%" cellpadding="14" cellspacing="0" style="margin-top:25px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
<tr>
<td style="border-bottom:1px solid #e5e7eb;">
<p style="margin:0;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
Position
</p>
<p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">
${jobTitle}
</p>
</td>
</tr>

<tr>
<td style="border-bottom:1px solid #e5e7eb;">
<p style="margin:0;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
Interview Code
</p>
<p style="margin:4px 0 0;font-size:16px;font-weight:700;color:#1d4ed8;letter-spacing:1.5px;font-family:'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace;">
${sessionCode}
</p>
</td>
</tr>

<tr>
<td>
<p style="margin:0;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
Interview Platform
</p>
<p style="margin:4px 0 0;color:#111827;font-size:15px;font-weight:600;">
InterVue Online Interview Portal
</p>
</td>
</tr>
</table>

<div style="text-align:center;margin-top:40px;">
<a href="${sessionLink}"
style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:8px;font-size:15px;font-weight:600;">
Join Interview
</a>
</div>

<p style="margin-top:35px;color:#6b7280;font-size:14px;line-height:26px;">
If the button above does not work, copy and paste the following URL into your browser:
</p>

<p style="word-break:break-all;color:#2563eb;font-size:14px;">
${sessionLink}
</p>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:35px 0;">

<p style="color:#374151;font-size:15px;line-height:28px;">
Please ensure the following before your interview:
</p>

<ul style="color:#4b5563;font-size:14px;line-height:28px;padding-left:20px;">
<li>You have a stable internet connection.</li>
<li>Your webcam and microphone are working properly.</li>
<li>You join the interview a few minutes before the scheduled time.</li>
<li>You keep your interview code available for verification.</li>
</ul>

</td>
</tr>

<tr>
<td style="background:#f9fafb;padding:22px;text-align:center;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
&copy; ${new Date().getFullYear()} InterVue. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
  });
}

export async function sendRejectionEmail({
  to,
  name,
  jobTitle,
  feedback,
}) {
  const template = await getTemplate("candidate_rejected");
  const data = { candidateName: name, jobTitle };
  const subject = substitutePlaceholders(template.subject, data);
  const bodyHtml = paragraphsToHtml(substitutePlaceholders(template.body, data));

  return resend.send({
    to,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Application Update</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Segoe UI,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;background:#f4f6f9;">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

<tr>
<td style="background:#1f2937;padding:24px 36px;">
<span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">
InterVue
</span>
</td>
</tr>

<tr>
<td style="padding:40px;">

<p style="margin:0 0 6px;color:#6b7280;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">
Application Update
</p>

<h2 style="margin:0 0 25px;color:#111827;font-size:24px;">
Thank you for interviewing with us
</h2>

${bodyHtml}

${
  feedback
    ? `<table width="100%" cellpadding="14" cellspacing="0" style="margin-top:10px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;">
<tr>
<td>
<p style="margin:0;color:#6b7280;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
Feedback from your interviewer
</p>
<p style="margin:6px 0 0;color:#374151;font-size:14px;line-height:24px;">
${feedback}
</p>
</td>
</tr>
</table>`
    : ""
}

</td>
</tr>

<tr>
<td style="background:#f9fafb;padding:22px;text-align:center;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
&copy; ${new Date().getFullYear()} InterVue. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
  });
}

export async function sendHiredEmail({
  to,
  name,
  jobTitle,
  feedback,
}) {
  const template = await getTemplate("candidate_hired");
  const data = { candidateName: name, jobTitle };
  const subject = substitutePlaceholders(template.subject, data);
  const bodyHtml = paragraphsToHtml(substitutePlaceholders(template.body, data));

  return resend.send({
    to,
    subject,
    html: `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>You're Hired</title>
</head>

<body style="margin:0;padding:0;background:#f4f6f9;font-family:Segoe UI,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
<tr>
<td align="center">

<table width="650" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden;">

<tr>
<td style="background:#065f46;padding:24px 36px;">
<span style="color:#ffffff;font-size:24px;font-weight:700;letter-spacing:-0.02em;">
InterVue
</span>
</td>
</tr>

<tr>
<td style="padding:40px;">

<p style="margin:0 0 6px;color:#059669;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;">
Final Decision
</p>

<h2 style="margin:0 0 25px;color:#111827;font-size:24px;">
Congratulations, you've been selected! 🎉
</h2>

${bodyHtml}

${
  feedback
    ? `<table width="100%" cellpadding="14" cellspacing="0" style="margin-top:10px;background:#ecfdf5;border:1px solid #a7f3d0;border-radius:8px;">
<tr>
<td>
<p style="margin:0;color:#065f46;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;">
Feedback from your interviewer
</p>
<p style="margin:6px 0 0;color:#065f46;font-size:14px;line-height:24px;">
${feedback}
</p>
</td>
</tr>
</table>`
    : ""
}

</td>
</tr>

<tr>
<td style="background:#f9fafb;padding:22px;text-align:center;color:#6b7280;font-size:12px;border-top:1px solid #e5e7eb;">
&copy; ${new Date().getFullYear()} InterVue. All rights reserved.
</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
  });
}