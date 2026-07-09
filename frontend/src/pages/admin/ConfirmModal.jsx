import {
  HelpCircle,
  Loader2,
  X,
} from "lucide-react";

const ConfirmModal = ({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  loading = false,
  loadingLabel = "Processing...",
  icon: Icon = HelpCircle,
  tone = "primary", // "primary" | "danger" | "warning"
  onCancel,
  onConfirm,
}) => {

  if (!open) return null;

  const toneStyles = {
    primary: {
      iconBg: "bg-indigo-100",
      iconColor: "text-indigo-600",
      confirmBtn: "bg-indigo-600 hover:bg-indigo-700",
    },
    danger: {
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBtn: "bg-red-600 hover:bg-red-700",
    },
    warning: {
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      confirmBtn: "bg-amber-600 hover:bg-amber-700",
    },
  };

  const styles = toneStyles[tone] || toneStyles.primary;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">

        <div className="flex justify-between items-center px-8 py-6 border-b">

          <div className="flex items-center gap-3">

            <div className={`w-14 h-14 rounded-2xl ${styles.iconBg} flex items-center justify-center`}>

              <Icon
                className={styles.iconColor}
                size={28}
              />

            </div>

            <div>

              <h2 className="text-2xl font-bold">
                {title}
              </h2>

              {description && (
                <p className="text-slate-500">
                  {description}
                </p>
              )}

            </div>

          </div>

          <button
            onClick={onCancel}
            disabled={loading}
            className="w-10 h-10 rounded-xl hover:bg-slate-100 flex items-center justify-center"
          >
            <X/>
          </button>

        </div>

        <div className="flex justify-end gap-4 border-t px-8 py-6">

          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 rounded-xl border hover:bg-slate-50"
          >
            {cancelLabel}
          </button>

          <button
            disabled={loading}
            onClick={onConfirm}
            className={`px-6 py-3 rounded-xl ${styles.confirmBtn} text-white flex items-center gap-2`}
          >

            {loading ? (
              <>
                <Loader2
                  className="animate-spin"
                  size={18}
                />
                {loadingLabel}
              </>
            ) : (
              <>
                {confirmLabel}
              </>
            )}

          </button>

        </div>

      </div>

    </div>
  );
};

export default ConfirmModal;