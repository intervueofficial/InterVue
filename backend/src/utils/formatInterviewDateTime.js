const TIME_ZONE = "Asia/Kolkata";

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

export function isMeaningfullyFuture(date, thresholdMs = 5 * 60 * 1000) {
  return date.getTime() - Date.now() > thresholdMs;
}
