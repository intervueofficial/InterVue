import {
  AlertTriangle,
  Loader2,
  X,
} from "lucide-react";

const DeleteModal = ({
  open,
  title,
  description,
  loading = false,
  onCancel,
  onConfirm,
}) => {

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6">

      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">

        <div className="flex justify-between items-center px-8 py-6 border-b">

          <div className="flex items-center gap-3">

            <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center">

              <AlertTriangle
                className="text-red-600"
                size={28}
              />

            </div>

            <div>

              <h2 className="text-2xl font-bold">
                Delete Problem
              </h2>

              <p className="text-slate-500">
                This action cannot be undone.
              </p>

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

        <div className="px-8 py-8">

          <p className="text-slate-600">
            Are you sure you want to permanently delete
          </p>

          <h3 className="font-bold text-xl mt-3">
            {title}
          </h3>

          {description && (
            <p className="text-slate-500 mt-4">
              {description}
            </p>
          )}

        </div>

        <div className="flex justify-end gap-4 border-t px-8 py-6">

          <button
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-3 rounded-xl border hover:bg-slate-50"
          >
            Cancel
          </button>

          <button
            disabled={loading}
            onClick={onConfirm}
            className="px-6 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
          >

            {loading ? (
              <>
                <Loader2
                  className="animate-spin"
                  size={18}
                />
                Deleting...
              </>
            ) : (
              <>
                Delete Problem
              </>
            )}

          </button>

        </div>

      </div>

    </div>
  );
};

export default DeleteModal;