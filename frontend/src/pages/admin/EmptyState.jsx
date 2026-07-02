import { Inbox } from "lucide-react";

const EmptyState = ({
  title,
  description,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center">

      <Inbox
        size={55}
        className="mx-auto text-slate-400"
      />

      <h2 className="mt-6 text-2xl font-semibold">
        {title}
      </h2>

      <p className="text-slate-500 mt-2">
        {description}
      </p>

    </div>
  );
};

export default EmptyState;