import { useEffect } from "react";
import { useAuth } from "@clerk/clerk-react";
import axios from "../lib/axios";
import { useQueryClient } from "@tanstack/react-query";

export default function useSyncRole() {
  const { isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    const syncRole = async () => {
      if (!isSignedIn) return;

      const role = localStorage.getItem("selectedRole");

      if (!role) return;

      const token = await getToken();

      await axios.post(
        "/auth/select-role",
        { role },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      localStorage.removeItem("selectedRole");

      queryClient.invalidateQueries({
        queryKey: ["auth-user"],
      });
    };

    syncRole();
  }, [isSignedIn]);
}