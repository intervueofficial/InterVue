import { useForm } from "react-hook-form";
import { XIcon } from "lucide-react";
import { useCreateSession } from "../../hooks/useSessions";
import { THEME } from "../../constants/theme";

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: `1px solid ${THEME.border}`,
  background: THEME.surface,
  color: THEME.ink,
  fontSize: 13.5,
  outline: "none",
};

const labelStyle = {
  display: "block",
  fontSize: 12.5,
  fontWeight: 600,
  color: THEME.inkMuted,
  marginBottom: 6,
};

const CreateSessionModal = ({ isOpen, onClose }) => {
  const { register, handleSubmit, reset } = useForm();

  const { mutate: createSession, isPending } = useCreateSession();

  const onSubmit = (data) => {
    const scheduledAt = new Date(
      `${data.date}T${data.time}`
    ).toISOString();

    createSession(
      {
        title: data.title,
        description: data.description,
        scheduledAt,
      },
      {
        onSuccess: () => {
          reset();
          onClose();
        },
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(23,23,31,0.45)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden"
        style={{ background: THEME.surface, border: `1px solid ${THEME.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4"
          style={{ borderBottom: `1px solid ${THEME.border}` }}
        >
          <h2 style={{ fontFamily: THEME.fontDisplay, fontSize: 17, fontWeight: 600, color: THEME.ink }}>
            Create Interview Session
          </h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-md" style={{ color: THEME.inkMuted }}>
            <XIcon size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-5 space-y-4">
          <div>
            <label style={labelStyle}>Session Title</label>
            <input
              type="text"
              placeholder="Campus Placement Round"
              style={inputStyle}
              {...register("title", { required: true })}
            />
          </div>

          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              rows={4}
              placeholder="Interview session for campus recruitment..."
              style={{ ...inputStyle, resize: "vertical" }}
              {...register("description", { required: true })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>Date</label>
              <input type="date" style={inputStyle} {...register("date", { required: true })} />
            </div>

            <div>
              <label style={labelStyle}>Time</label>
              <input type="time" style={inputStyle} {...register("time", { required: true })} />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-md text-[13px] font-semibold transition-colors"
              style={{ border: `1px solid ${THEME.border}`, color: THEME.ink, background: THEME.surface }}
            >
              Cancel
            </button>

            <button
              disabled={isPending}
              className="px-4 py-2 rounded-md text-[13px] font-semibold transition-colors disabled:opacity-60"
              style={{ background: THEME.ink, color: THEME.surface }}
            >
              {isPending ? "Creating..." : "Create Session"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSessionModal;
