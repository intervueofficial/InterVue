import { useForm } from "react-hook-form";
import { useCreateSession } from "../../hooks/useSessions";

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
    <dialog className="modal modal-open">
      <div className="modal-box max-w-2xl">

        <h2 className="font-bold text-2xl mb-6">
          Create Interview Session
        </h2>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-5"
        >

          <div>
            <label className="label">
              <span className="label-text">
                Session Title
              </span>
            </label>

            <input
              type="text"
              placeholder="Campus Placement Round"
              className="input input-bordered w-full"
              {...register("title", {
                required: true,
              })}
            />
          </div>

          <div>
            <label className="label">
              <span className="label-text">
                Description
              </span>
            </label>

            <textarea
              rows={4}
              className="textarea textarea-bordered w-full"
              placeholder="Interview session for campus recruitment..."
              {...register("description", {
                required: true,
              })}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-5">

            <div>
              <label className="label">
                <span className="label-text">
                  Date
                </span>
              </label>

              <input
                type="date"
                className="input input-bordered w-full"
                {...register("date", {
                  required: true,
                })}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">
                  Time
                </span>
              </label>

              <input
                type="time"
                className="input input-bordered w-full"
                {...register("time", {
                  required: true,
                })}
              />
            </div>

          </div>

          <div className="modal-action">

            <button
              type="button"
              className="btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              className="btn btn-primary"
              disabled={isPending}
            >
              {isPending
                ? "Creating..."
                : "Create Session"}
            </button>

          </div>

        </form>

      </div>
    </dialog>
  );
};

export default CreateSessionModal;