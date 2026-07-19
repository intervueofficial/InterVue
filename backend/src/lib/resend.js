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
          `⚠️  RESEND_API_KEY not set — skipping email to ${to} (subject: "${subject}")`
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

export async function sendSelectionEmail({ to, name, jobTitle, sessionCode, sessionLink }) {
  return resend.send({
    to,
    subject: `You've been selected for an interview — ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: auto;">
        <h2 style="color:#2563EB;">Congratulations, ${name}! 🎉</h2>
        <p>You matched the criteria for <strong>${jobTitle}</strong> and have been shortlisted by our interviewer.</p>
        <p>Your interview session is ready. Use the code below or the link to join:</p>
        <p style="font-size:20px; font-weight:700; letter-spacing:2px;">${sessionCode}</p>
        <p><a href="${sessionLink}" style="background:#2563EB;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">Join Interview Session</a></p>
        <p style="color:#64748B; font-size:13px;">If the button doesn't work, copy this link: ${sessionLink}</p>
      </div>
    `,
  });
}

export async function sendRejectionEmail({ to, name, jobTitle }) {
  return resend.send({
    to,
    subject: `Update on your application — ${jobTitle}`,
    html: `
      <div style="font-family: sans-serif; max-width: 520px; margin: auto;">
        <p>Hi ${name},</p>
        <p>Thank you for applying for <strong>${jobTitle}</strong>. After reviewing your application, we've decided to move forward with other candidates at this time.</p>
        <p>We appreciate your interest and encourage you to apply for future openings.</p>
        <p>— InterVue Hiring Team</p>
      </div>
    `,
  });
}