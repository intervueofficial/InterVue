import { CalendarDays } from "lucide-react";

const EmptySessions = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24">

      <CalendarDays
        className="text-primary"
        size={70}
      />

      <h2 className="text-2xl font-bold mt-6">
        No Sessions Found
      </h2>

      <p className="opacity-70 mt-2">
        Create your first interview session.
      </p>

    </div>
  );
};

export default EmptySessions;