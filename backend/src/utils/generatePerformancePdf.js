import PDFDocument from "pdfkit";

function scoreLine(doc, label, value) {
  doc.fontSize(11).fillColor("#374151").font("Helvetica-Bold").text(`${label}: `, {
    continued: true,
  });
  doc
    .font("Helvetica")
    .fillColor("#111827")
    .text(value !== null && value !== undefined ? `${value}%` : "Not recorded");
}

function section(doc, title, content) {
  if (!content) return;
  doc.moveDown(0.6);
  doc.fontSize(13).fillColor("#111827").font("Helvetica-Bold").text(title);
  doc.moveDown(0.3);
  doc
    .fontSize(11)
    .fillColor("#374151")
    .font("Helvetica")
    .text(content, { align: "left", lineGap: 3 });
}

/**
 * Builds a performance-report PDF as a Buffer, combining objective
 * session data (coding/quiz/confidence scores) with an AI-generated
 * narrative and the interviewer's own comments.
 */
export function generatePerformancePdf({
  candidateName,
  jobTitle,
  interviewDate,
  codingScore,
  quizScore,
  confidenceScore,
  summary,
  interviewerComment,
}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", margin: 50 });
      const chunks = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      // Header
      doc.fillColor("#1f2937").fontSize(22).font("Helvetica-Bold").text("InterVue");
      doc
        .fontSize(10)
        .fillColor("#6b7280")
        .font("Helvetica")
        .text("AI-Generated Interview Performance Report");

      doc.moveDown(1);
      doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(1);

      // Candidate info
      doc.fontSize(16).fillColor("#111827").font("Helvetica-Bold").text(candidateName);
      doc.fontSize(11).fillColor("#4b5563").font("Helvetica").text(`Role: ${jobTitle}`);
      doc.text(`Date: ${interviewDate}`);
      doc.moveDown(1);

      // Scores
      doc.fontSize(13).fillColor("#111827").font("Helvetica-Bold").text("Scores");
      doc.moveDown(0.3);
      scoreLine(doc, "Coding Skills", codingScore);
      scoreLine(doc, "Quiz Accuracy", quizScore);
      scoreLine(doc, "Confidence / Engagement", confidenceScore);
      doc.moveDown(1);

      doc.strokeColor("#e5e7eb").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();

      // Narrative sections
      section(doc, "Overall Summary", summary.overallSummary);
      section(doc, "Coding Skills Feedback", summary.codingFeedback);
      section(doc, "Quiz Performance Feedback", summary.quizFeedback);
      section(doc, "Confidence & Engagement Feedback", summary.confidenceFeedback);
      section(doc, "Interviewer's Comments", interviewerComment);

      doc.moveDown(1.2);
      doc
        .fontSize(9)
        .fillColor("#9ca3af")
        .text(
          "This report combines objective session data (test results, quiz score, and session engagement signals) with an AI-generated narrative summary and the interviewer's own comments. It is intended as constructive feedback, not a certified assessment.",
          { align: "left" }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
