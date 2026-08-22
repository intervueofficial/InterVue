import mammoth from "mammoth";

const MIME_PDF = "application/pdf";
const MIME_DOC = "application/msword";
const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

const MAX_CHARS = 8000;

/**
 * @param {string} dataUrl - e.g. "data:application/pdf;base64,...."
 * @returns {Promise<string>} extracted plain text, or "" if extraction
 *   isn't supported/failed.
 */
export async function extractResumeText(dataUrl) {
  try {
    if (!dataUrl || typeof dataUrl !== "string") return "";

    const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/);
    const mimeType = mimeMatch?.[1];
    if (!mimeType) return "";

    const base64Data = dataUrl.slice(dataUrl.indexOf(",") + 1);
    const buffer = Buffer.from(base64Data, "base64");

    let text = "";

    if (mimeType === MIME_PDF) {
      const { default: pdfParse } = await import("pdf-parse");
      const result = await pdfParse(buffer);
      text = result.text || "";
    } else if (mimeType === MIME_DOCX) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    } else if (mimeType === MIME_DOC) {
      text = "";
    }

    return text.trim().slice(0, MAX_CHARS);
  } catch (error) {
    console.error("extractResumeText:", error.message);
    return "";
  }
}

export const RESUME_MIME_TYPES = {
  [MIME_PDF]: "pdf",
  [MIME_DOC]: "doc",
  [MIME_DOCX]: "docx",
};
