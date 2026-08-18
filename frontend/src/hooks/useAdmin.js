import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { adminApi } from "../api/adminApi";

export const useAdminUsers = () => {
  const { getToken, isLoaded } = useAuth();

  return useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const token = await getToken();
      return adminApi.getUsers(token);
    },
    // Clerk's auth state isn't ready on the very first render — firing the
    // request before isLoaded means getToken() can resolve to null and the
    // request 401s, landing on a permanent error state with nothing to
    // retry against but a full page reload. Waiting for isLoaded avoids
    // that race outright.
    enabled: isLoaded,
    retry: 1,
  });
};

export const useAdminAnalytics = () => {
  const { getToken, isLoaded } = useAuth();

  return useQuery({
    queryKey: ["admin-analytics"],
    queryFn: async () => {
      const token = await getToken();
      return adminApi.getAnalytics(token);
    },
    enabled: isLoaded,
    retry: 1,
  });
};
