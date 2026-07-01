import { createContext, useContext, useMemo, useState } from "react";

const RoleContext = createContext(null);

export function RoleProvider({ children }) {
  const [selectedRole, setSelectedRole] = useState("candidate");

  const value = useMemo(
    () => ({
      selectedRole,
      setSelectedRole,
    }),
    [selectedRole]
  );

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);

  if (!context) {
    throw new Error("useRole must be used inside RoleProvider");
  }

  return context;
}