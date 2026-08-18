import EmailTemplate from "../models/EmailTemplate.js";
import {
  ensureEmailTemplatesSeeded,
  TEMPLATE_PLACEHOLDERS,
} from "../lib/emailTemplateDefaults.js";
import { logAction } from "../lib/auditLog.js";

// ==========================
// List templates (seeds defaults on first call if the collection is empty)
// ==========================
export const getEmailTemplates = async (req, res) => {
  try {
    await ensureEmailTemplatesSeeded();

    const templates = await EmailTemplate.find()
      .populate("updatedBy", "name email")
      .sort({ key: 1 });

    const withPlaceholders = templates.map((t) => ({
      ...t.toObject(),
      placeholders: TEMPLATE_PLACEHOLDERS[t.key] || [],
    }));

    return res.status(200).json({ success: true, templates: withPlaceholders });
  } catch (error) {
    console.error("getEmailTemplates:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// ==========================
// Update one template's subject/body
// ==========================
export const updateEmailTemplate = async (req, res) => {
  try {
    const { key } = req.params;
    const { subject, body } = req.body;

    if (!subject?.trim() || !body?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Subject and body are both required.",
      });
    }

    await ensureEmailTemplatesSeeded();

    const template = await EmailTemplate.findOneAndUpdate(
      { key },
      { subject: subject.trim(), body: body.trim(), updatedBy: req.user._id },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ success: false, message: "Template not found" });
    }

    await logAction({
      actor: req.user,
      action: "email_template.updated",
      targetType: "EmailTemplate",
      targetId: key,
    });

    return res.status(200).json({ success: true, template });
  } catch (error) {
    console.error("updateEmailTemplate:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
