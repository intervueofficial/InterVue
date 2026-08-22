import EmailTemplate from "../models/EmailTemplate.js";

export const DEFAULT_TEMPLATES = {
  candidate_applied: {
    subject: "Application Received | {{jobTitle}} | InterVue",
    body: `Dear {{candidateName}},

Thank you for applying for the position of {{jobTitle}}. This email confirms that we've received your application.

Our team is reviewing applications carefully, and you can expect to hear back from us within {{waitDays}}. There's nothing further you need to do in the meantime — we'll be in touch as soon as a decision is made on the next steps.

We appreciate your patience and your interest in joining our team.

Kind regards,
InterVue Recruitment Team`,
  },

  candidate_selected: {
    subject: "Interview Invitation | {{jobTitle}} | InterVue",
    body: `Dear {{candidateName}},

We are pleased to inform you that your profile has been shortlisted for the position of {{jobTitle}}.

Please see your confirmed interview details below.

We look forward to speaking with you and wish you the very best for your interview.

Kind regards,
InterVue Recruitment Team`,
  },

  interview_reminder: {
    subject: "Your interview starts in 1 hour | {{jobTitle}} | InterVue",
    body: `Dear {{candidateName}},

This is a reminder that your interview for the position of {{jobTitle}} is starting in about 1 hour, on {{interviewDate}} at {{interviewTime}}.

Your interview access link and code are included below. Please make sure you have a stable internet connection and that your camera and microphone are working before you join.

We look forward to speaking with you shortly.

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

  candidate_waitlisted: {
    subject: "Application Update | {{jobTitle}} | InterVue",
    body: `Dear {{candidateName}},

Thank you for your interest in the position of {{jobTitle}} and for taking the time to interview with our team.

We wanted to let you know that you've been placed on our waitlist for this role. This means we don't have a final decision to share just yet, but you remain under active consideration alongside other candidates.

There's nothing further you need to do at this stage — we'll follow up with an update as soon as a final decision is made.

We appreciate your patience and your continued interest in joining our team.

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

  interviewer_approved: {
    subject: "Your InterVue interviewer access has been approved",
    body: `Dear {{interviewerName}},

Good news — your request to become an interviewer on InterVue has been approved by our admin team.

You now have full access to the interviewer dashboard, including reviewing applicants, scheduling interviews, and generating interview content.

Kind regards,
InterVue Team`,
  },

  interviewer_rejected: {
    subject: "Update on your InterVue interviewer request",
    body: `Dear {{interviewerName}},

Thank you for your interest in becoming an interviewer on InterVue. After review, we're unable to approve your interviewer access at this time.

If you believe this was a mistake or would like more information, please reach out to our admin team.

Kind regards,
InterVue Team`,
  },
};

export const TEMPLATE_PLACEHOLDERS = {
  candidate_applied: ["candidateName", "jobTitle", "waitDays"],
  candidate_selected: ["candidateName", "jobTitle"],
  interview_reminder: ["candidateName", "jobTitle", "interviewDate", "interviewTime"],
  candidate_rejected: ["candidateName", "jobTitle"],
  candidate_waitlisted: ["candidateName", "jobTitle"],
  candidate_hired: ["candidateName", "jobTitle"],
  interviewer_approved: ["interviewerName"],
  interviewer_rejected: ["interviewerName", "note"],
};

export function substitutePlaceholders(text, data = {}) {
  if (!text) return "";
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) =>
    data[key] !== undefined && data[key] !== null ? String(data[key]) : ""
  );
}

let seeded = false;
export async function ensureEmailTemplatesSeeded() {
  if (seeded) return;

  const existingKeys = new Set(await EmailTemplate.distinct("key"));
  const missing = Object.entries(DEFAULT_TEMPLATES).filter(([key]) => !existingKeys.has(key));

  if (missing.length > 0) {
    await EmailTemplate.insertMany(
      missing.map(([key, tpl]) => ({
        key,
        subject: tpl.subject,
        body: tpl.body,
      }))
    );
  }

  seeded = true;
}

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
