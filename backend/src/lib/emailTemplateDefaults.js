import EmailTemplate from "../models/EmailTemplate.js";

// The three email types this app has always sent, previously as
// hardcoded strings inside lib/resend.js. These are now the seed data
// for the EmailTemplate collection — the source of truth moves to the
// DB, but if the DB has no template yet (fresh install, or the seed
// hasn't run), sending falls back to this exact text so an email is
// never sent broken or empty.
//
// body is plain text — one or more paragraphs separated by a blank
// line — not HTML. resend.js wraps it in the existing branded layout.
export const DEFAULT_TEMPLATES = {
  candidate_selected: {
    subject: "Interview Invitation | {{jobTitle}} | InterVue",
    body: `Dear {{candidateName}},

We are pleased to inform you that your profile has been shortlisted for the position of {{jobTitle}}.

You have been invited to participate in an online interview through the InterVue interview platform. Please review the details below.

We look forward to speaking with you and wish you the very best for your interview.

Kind regards,
InterVue Recruitment Team`,
  },

  candidate_rejected: {
    subject: "Application Update | {{jobTitle}} | InterVue",
    body: `Dear {{candidateName}},

Thank you for your interest in the position of {{jobTitle}} and for taking the time to interview with our team.

After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match the current requirements of this role.

This decision does not diminish the effort you invested in your application, and we sincerely appreciate your interest in joining our organization.

We encourage you to stay connected with InterVue and apply for future opportunities that align with your skills and experience.

Kind regards,
InterVue Recruitment Team`,
  },

  candidate_hired: {
    subject: "Congratulations! You've been selected | {{jobTitle}} | InterVue",
    body: `Dear {{candidateName}},

We are delighted to inform you that, following your interview, you have been selected for the position of {{jobTitle}}.

Our team was impressed with your performance and believes you'll be a great fit. Our HR team will reach out shortly with next steps and onboarding details.

Congratulations once again, and welcome aboard!

Kind regards,
InterVue Recruitment Team`,
  },
};

// Supported placeholders per template key — used by the admin UI to show
// what's available when editing, and to build preview sample data.
export const TEMPLATE_PLACEHOLDERS = {
  candidate_selected: ["candidateName", "jobTitle"],
  candidate_rejected: ["candidateName", "jobTitle"],
  candidate_hired: ["candidateName", "jobTitle"],
};

/** Replaces every {{key}} occurrence in a string with data[key] (or ""). */
export function substitutePlaceholders(text, data = {}) {
  if (!text) return "";
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    data[key] !== undefined && data[key] !== null ? String(data[key]) : ""
  );
}

/**
 * Inserts the three default templates into the DB if the collection is
 * empty. Cheap to call on every read (findOne per key would be wasteful,
 * so this only runs the seed check once per cold start, cached on the
 * module).
 */
let seeded = false;
export async function ensureEmailTemplatesSeeded() {
  if (seeded) return;

  const count = await EmailTemplate.countDocuments();
  if (count === 0) {
    await EmailTemplate.insertMany(
      Object.entries(DEFAULT_TEMPLATES).map(([key, tpl]) => ({
        key,
        subject: tpl.subject,
        body: tpl.body,
      }))
    );
  }

  seeded = true;
}

/**
 * Returns { subject, body } for a template key — from the DB if present,
 * otherwise the hardcoded default. Never throws; a DB error just falls
 * back to the default so a broken template lookup can't block an email
 * that would otherwise have sent fine.
 */
export async function getTemplate(key) {
  try {
    await ensureEmailTemplatesSeeded();
    const tpl = await EmailTemplate.findOne({ key });
    if (tpl) return { subject: tpl.subject, body: tpl.body };
  } catch (error) {
    console.error(`getTemplate(${key}) — falling back to default:`, error);
  }

  return DEFAULT_TEMPLATES[key] || { subject: "InterVue", body: "" };
}

/** Converts blank-line-separated paragraphs into the <p> markup the existing email layout uses. */
export function paragraphsToHtml(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="color:#4b5563;font-size:15px;line-height:28px;">${p.replace(/\n/g, "<br>")}</p>`
    )
    .join("\n");
}
