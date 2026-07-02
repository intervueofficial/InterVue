import { useAuth } from "@clerk/clerk-react";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

import { quizApi } from "../../api/quizApi";

const DeleteQuizModal = ({
  quiz,
  onClose,
  onSuccess,
}) => {
  const { getToken } = useAuth();

  const [loading, setLoading] =
    useState(false);

  const deleteQuiz = async () => {
    try {
      setLoading(true);

      const token = await getToken();

      await quizApi.deleteQuiz(
        quiz._id,
        token
      );

      toast.success("Quiz deleted");

      onSuccess();
    } catch (err) {
      toast.error("Delete failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex justify-center items-center z-50">

      <div className="bg-white rounded-3xl w-full max-w-md p-8">

        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex justify-center items-center">

          <Trash2
            className="text-red-600"
            size={30}
          />

        </div>

        <h2 className="text-2xl font-bold mt-6 text-center">
          Delete Quiz?
        </h2>

        <p className="text-slate-500 mt-3 text-center">
          This action cannot be undone.
        </p>

        <div className="mt-8 flex justify-end gap-3">

          <button
            onClick={onClose}
            className="btn"
          >
            Cancel
          </button>

          <button
            onClick={deleteQuiz}
            className="btn btn-error"
            disabled={loading}
          >
            Delete
          </button>

        </div>

      </div>

    </div>
  );
};

export default DeleteQuizModal;