import { useParams } from "react-router";

const SessionPage = () => {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-base-200 p-8">
      <h1 className="text-4xl font-bold">
        Interview Session
      </h1>

      <p className="mt-3 text-gray-500">
        Session ID : {id}
      </p>
    </div>
  );
};

export default SessionPage;