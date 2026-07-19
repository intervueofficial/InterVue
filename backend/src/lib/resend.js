import { Resend } from "resend";
import { ENV } from "./env.js";

export const resend = new ResendSafe();

// Thin wrapper so a missing/invalid RESEND_API_KEY during local dev
// doesn't crash the whole app on import — it just logs instead of sending.
function ResendSafe() {
  const client = ENV.RESEND_API_KEY ? new Resend(ENV.RESEND_API_KEY) : null;

  return {
    async send({ to, subject, html }) {
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
  return resend.send({
    to,
    subject: `Interview Invitation | ${jobTitle} | InterVue`,
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

<h2 style="margin:0;color:#111827;font-size:24px;">
You have been shortlisted
</h2>

<p style="margin-top:25px;color:#374151;font-size:15px;line-height:28px;">
Dear ${name},
</p>

<p style="color:#4b5563;font-size:15px;line-height:28px;">
We are pleased to inform you that your profile has been shortlisted for the position of
<strong>${jobTitle}</strong>.
</p>

<p style="color:#4b5563;font-size:15px;line-height:28px;">
You have been invited to participate in an online interview through the InterVue interview platform.
Please review the details below.
</p>

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

<p style="margin-top:35px;color:#4b5563;font-size:15px;line-height:28px;">
We look forward to speaking with you and wish you the very best for your interview.
</p>

<p style="margin-top:35px;color:#111827;font-size:15px;line-height:26px;">
Kind regards,<br>
InterVue Recruitment Team
</p>

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
}) {
  return resend.send({
    to,
    subject: `Application Update | ${jobTitle} | InterVue`,
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

<h2 style="margin:0;color:#111827;font-size:24px;">
Thank you for applying
</h2>

<p style="margin-top:28px;color:#374151;font-size:15px;line-height:28px;">
Dear ${name},
</p>

<p style="color:#4b5563;font-size:15px;line-height:28px;">
Thank you for your interest in the position of
<strong>${jobTitle}</strong> and for taking the time to submit your application.
</p>

<p style="color:#4b5563;font-size:15px;line-height:28px;">
After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match the current requirements of this role.
</p>

<p style="color:#4b5563;font-size:15px;line-height:28px;">
This decision does not diminish the effort you invested in your application, and we sincerely appreciate your interest in joining our organization.
</p>

<p style="color:#4b5563;font-size:15px;line-height:28px;">
We encourage you to stay connected with InterVue and apply for future opportunities that align with your skills and experience.
</p>

<hr style="margin:35px 0;border:none;border-top:1px solid #e5e7eb;">

<p style="color:#111827;font-size:15px;line-height:26px;">
Kind regards,<br>
InterVue Recruitment Team
</p>

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