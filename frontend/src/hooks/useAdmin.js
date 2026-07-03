import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { adminApi } from "../api/adminApi";

export const useAdminUsers = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const token = await getToken();
      return adminApi.getUsers(token);
    },
  });
};

export const useAdminAnalytics = () => {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const token = await getToken();
      return adminApi.getAnalytics(token);
    },
  });
};
