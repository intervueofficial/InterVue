const colors = {
  scheduled: "badge-info",
  waiting: "badge-warning",
  live: "badge-success",
  completed: "badge-neutral",
  cancelled: "badge-error",
};

const SessionStatusBadge = ({ status }) => {
  return (
    <span
      className={`badge ${colors[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
};

export default SessionStatusBadge;