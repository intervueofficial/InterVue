const TIME_ZONE = "Asia/Kolkata";

/**
 * Formats a Date into separate, email-friendly date and time strings
 * (e.g. "Friday, 22 August 2026" and "3:30 PM IST"), used by both the
 * interview invite email (lib/resend.js's sendSelectionEmail) and the
 * 1-hour-prior join-link reminder (sendInterviewReminderEmail / the
 * Inngest cron in lib/inngest.js) so the two always agree on formatting.
 */
export function formatInterviewDateTime(date) {
  const interviewDate = date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: TIME_ZONE,
  });

  const interviewTime = `${date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIME_ZONE,
  })} IST`;

  return { interviewDate, interviewTime };
}

/**
 * A session scheduled for "right now" (the old default before
 * scheduling existed) shouldn't show a confusing "Date & Time: <this
 * exact second>" row in the invite email — only show it when the
 * interviewer actually picked a real future time.
 */
export function isMeaningfullyFuture(date, thresholdMs = 5 * 60 * 1000) {
  return date.getTime() - Date.now() > thresholdMs;
}
