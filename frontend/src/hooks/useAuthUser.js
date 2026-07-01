import { useAuth, useUser } from "@clerk/clerk-react";
import { useQuery } from "@tanstack/react-query";
import axios from "../lib/axios";

const useAuthUser = () => {
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ["auth-user"],

    enabled: isLoaded && isSignedIn,

    queryFn: async () => {
      const token = await getToken();

      const { data } = await axios.get("/auth/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data.user;
    },
  });
};

export default useAuthUser;