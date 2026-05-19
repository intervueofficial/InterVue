import { useEffect } from "react";
export default function TerminatedPage() {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: "#0F172A",
        color: "white",
      }}
    >
      <h1>Interview Terminated</h1>

      <p>
        Your session was terminated due to policy violation.
      </p>
    </div>
  );
}