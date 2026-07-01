import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";
import { authApi } from "../api/auth";

const useSelectRole = () => {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (role) => {
      const token = await getToken();

      return authApi.selectRole(
        role,
        token
      );
    },
  });
};

export default useSelectRole;