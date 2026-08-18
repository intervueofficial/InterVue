import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Mail,
  Save,
  Eye,
  AlertTriangleIcon,
  RefreshCwIcon,
  Sparkles,
  Send,
  CalendarCheck2,
  XCircle,
  Trophy,
  Clock3,
  FileWarning,
  UserPlus,
} from "lucide-react";

import { adminApi } from "../../api/adminApi";
import PageHeader from "../../components/PageHeader";
import EmptyState from "./EmptyState";
import Loading from "./Loading";
import { THEME } from "../../constants/theme";

/* ---------------------------------------------------------------------
   Template metadata. Add an entry here whenever a new template key is
   seeded on the backend — the editor UI will pick it up automatically.
   `category` controls grouping/section order below.
--------------------------------------------------------------------- */
const TEMPLATE_META = {
  candidate_applied: {
    label: "Application Received",
    icon: UserPlus,
    color: THEME.info,
    category: "Application",
  },
  candidate_selected: {
    label: "Interview Invitation",
    icon: CalendarCheck2,
    color: THEME.primary,
    category: "Interview",
  },
  interview_reminder: {
    label: "Interview Reminder",
    icon: Clock3,
    color: THEME.warning,
    category: "Interview",
  },
  interview_rescheduled: {
    label: "Interview Rescheduled",
    icon: RefreshCwIcon,
    color: THEME.warning,
    category: "Interview",
  },
  candidate_rejected: {
    label: "Application Rejected",
    icon: XCircle,
    color: THEME.danger,
    category: "Decision",
  },
  candidate_waitlisted: {
    label: "Candidate Waitlisted",
    icon: FileWarning,
    color: THEME.inkFaint,
    category: "Decision",
  },
  candidate_hired: {
    label: "Candidate Hired",
    icon: Trophy,
    color: THEME.success,
    category: "Decision",
  },
  offer_sent: {
    label: "Offer Letter Sent",
    icon: Send,
    color: THEME.success,
    category: "Decision",
  },
};

const CATEGORY_ORDER = ["Application", "Interview", "Decision", "Other"];

function metaFor(key) {
  return (
    TEMPLATE_META[key] || {
      label: key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      icon: Mail,
      color: THEME.primary,
      category: "Other",
    }
  );
}

const SAMPLE_DATA = {
  candidateName: "Priya Sharma",
  jobTitle: "Frontend Engineer",
};

function substitute(text, data) {
  if (!text) return "";
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => data[key] ?? `{{${key}}}`);
}

const TemplateEditor = ({ template, onSave, saving }) => {
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    setSubject(template.subject);
    setBody(template.body);
  }, [template]);

  const dirty = subject !== template.subject || body !== template.body;
  const { label, icon: Icon, color } = metaFor(template.key);

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
    >
      <div
        className="flex items-center justify-between px-6 py-4"
        style={{ borderBottom: `1px solid ${THEME.border}`, background: THEME.surface2 }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${color}1A` }}
          >
            <Icon size={16} color={color} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: THEME.ink }}>
              {label}
            </p>
            <p className="text-xs font-mono" style={{ color: THEME.inkFaint }}>
              {template.key}
            </p>
          </div>
        </div>

        <button
          onClick={() => setPreview((p) => !p)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
          style={{
            color: preview ? THEME.primary : THEME.inkMuted,
            background: preview ? THEME.primaryTint : "transparent",
            border: `1px solid ${preview ? THEME.primaryTintBorder : THEME.border}`,
          }}
        >
          <Eye size={13} />
          {preview ? "Editing" : "Preview"}
        </button>
      </div>

      <div className="p-6 space-y-4">
        {template.placeholders?.length > 0 && (
          <p className="text-xs" style={{ color: THEME.inkFaint }}>
            Placeholders:{" "}
            {template.placeholders.map((p) => (
              <code
                key={p}
                className="font-mono px-1.5 py-0.5 rounded mr-1"
                style={{ background: THEME.surface2, color: THEME.inkMuted }}
              >
                {`{{${p}}}`}
              </code>
            ))}
          </p>
        )}

        {preview ? (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: THEME.inkFaint }}>
                Subject
              </p>
              <p className="text-sm" style={{ color: THEME.ink }}>
                {substitute(subject, SAMPLE_DATA)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: THEME.inkFaint }}>
                Body (sample data)
              </p>
              <div
                className="text-sm whitespace-pre-wrap rounded-lg p-4"
                style={{ background: THEME.surface2, color: THEME.ink, lineHeight: 1.7 }}
              >
                {substitute(body, SAMPLE_DATA)}
              </div>
            </div>
          </div>
        ) : (
          <>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: THEME.inkFaint }}>
                Subject
              </label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full text-sm outline-none"
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  border: `1px solid ${THEME.border}`,
                  background: THEME.background,
                  color: THEME.ink,
                }}
              />
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-1 block" style={{ color: THEME.inkFaint }}>
                Body
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full text-sm outline-none"
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: `1px solid ${THEME.border}`,
                  background: THEME.background,
                  color: THEME.ink,
                  resize: "vertical",
                  lineHeight: 1.6,
                }}
              />
              <p className="text-xs mt-1.5" style={{ color: THEME.inkFaint }}>
                Separate paragraphs with a blank line. This wraps into InterVue's existing
                email layout — the header, footer, and interview-code/feedback boxes stay fixed.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end pt-1">
          <button
            onClick={() => onSave({ subject, body })}
            disabled={!dirty || saving}
            className="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-40 transition-opacity"
            style={{ background: THEME.ink, color: THEME.surface }}
          >
            <Save size={14} />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
};

const SectionHeading = ({ title, count }) => (
  <div className="flex items-center gap-2 mb-3">
    <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: THEME.inkFaint }}>
      {title}
    </p>
    <span
      className="text-[11px] font-semibold px-1.5 py-0.5 rounded-full"
      style={{ background: THEME.surface2, color: THEME.inkMuted }}
    >
      {count}
    </span>
  </div>
);

const EmailTemplates = () => {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();
  const [savingKey, setSavingKey] = useState(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-email-templates"],
    queryFn: async () => adminApi.getEmailTemplates(await getToken()),
    retry: 1,
  });

  const templates = data?.templates || [];

  const grouped = useMemo(() => {
    const byCategory = {};
    templates.forEach((t) => {
      const { category } = metaFor(t.key);
      if (!byCategory[category]) byCategory[category] = [];
      byCategory[category].push(t);
    });
    return CATEGORY_ORDER.map((cat) => ({ category: cat, items: byCategory[cat] || [] })).filter(
      (g) => g.items.length > 0
    );
  }, [templates]);

  const mutation = useMutation({
    mutationFn: async ({ key, subject, body }) =>
      adminApi.updateEmailTemplate(key, { subject, body }, await getToken()),
    onMutate: ({ key }) => setSavingKey(key),
    onSuccess: () => {
      toast.success("Template saved.");
      queryClient.invalidateQueries({ queryKey: ["admin-email-templates"] });
    },
    onError: (error) => toast.error(error.response?.data?.message || "Failed to save template."),
    onSettled: () => setSavingKey(null),
  });

  let cardIndex = 0;

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <PageHeader
          eyebrow="Library"
          title="Email Templates"
          description="Edit the subject and message for candidate emails. Layout and branding stay fixed."
          actions={
            templates.length > 0 && (
              <span
                className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                style={{ background: THEME.primaryTint, color: THEME.primary }}
              >
                <Sparkles size={13} />
                {templates.length} template{templates.length === 1 ? "" : "s"}
              </span>
            )
          }
        />
      </motion.div>

      {isError ? (
        <div
          className="flex flex-col items-center text-center py-16 rounded-xl"
          style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        >
          <div
            className="w-11 h-11 rounded-lg flex items-center justify-center mb-3"
            style={{ background: THEME.dangerTint }}
          >
            <AlertTriangleIcon size={20} color={THEME.danger} />
          </div>
          <p className="text-sm font-semibold" style={{ color: THEME.ink }}>
            Couldn't load templates
          </p>
          <button
            onClick={() => refetch()}
            className="mt-4 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg"
            style={{ background: THEME.ink, color: THEME.surface }}
          >
            <RefreshCwIcon size={14} />
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <Loading />
      ) : !templates.length ? (
        <EmptyState title="No templates found" description="Templates seed automatically on first load." />
      ) : (
        <div className="space-y-9">
          {grouped.map(({ category, items }) => (
            <div key={category}>
              <SectionHeading title={category} count={items.length} />
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                {items.map((template) => {
                  const i = cardIndex++;
                  return (
                    <motion.div
                      key={template.key}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.04 * i, ease: "easeOut" }}
                    >
                      <TemplateEditor
                        template={template}
                        saving={savingKey === template.key}
                        onSave={({ subject, body }) =>
                          mutation.mutate({ key: template.key, subject, body })
                        }
                      />
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;