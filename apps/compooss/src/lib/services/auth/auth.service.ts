import { apiClient } from "@/lib/config/api.config";
import { ENDPOINTS } from "@/lib/constants";
import type { TMutationOptions } from "@/lib/query.types";
import type { TLoginForm } from "@/lib/schemas";
import type { ApiResponse, AuthSession } from "@compooss/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AUTH_QUERY_KEYS } from "./auth-query.key";

export const useAuthSession = () =>
  useQuery({
    queryKey: AUTH_QUERY_KEYS.session(),
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<AuthSession>>(
        ENDPOINTS.auth.session,
      );
      return res.data;
    },
    staleTime: Infinity,
  });

export const useLogin = (
  options: TMutationOptions<ApiResponse<{ username: string }>, TLoginForm> = {},
) =>
  useMutation({
    ...options,
    mutationFn: (payload: TLoginForm) =>
      apiClient.post<ApiResponse<{ username: string }>>(
        ENDPOINTS.auth.login,
        payload,
      ),
  });

export const useLogout = (options: TMutationOptions<ApiResponse<null>, void> = {}) =>
  useMutation({
    ...options,
    mutationFn: () => apiClient.post<ApiResponse<null>>(ENDPOINTS.auth.logout),
  });
