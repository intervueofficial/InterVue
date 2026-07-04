import SessionCard from "./SessionCard";
import EmptySessions from "./EmptySessions";

const SessionGrid = ({ sessions, emptyTitle, emptySubtitle }) => {
  if (!sessions.length) {
    return <EmptySessions title={emptyTitle} subtitle={emptySubtitle} />;
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {sessions.map((session) => (
        <SessionCard key={session._id} session={session} />
      ))}
    </div>
  );
};

export default SessionGrid;