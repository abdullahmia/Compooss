import { apiClient } from "@/lib/config/api.config";
import { ENDPOINTS } from "@/lib/constants";
import type { TMutationOptions } from "@/lib/query.types";
import {
  appendSample,
  PERFORMANCE_POLL_INTERVAL_MS,
  type PerformanceHistory,
} from "@/lib/utils/performance.util";
import type {
  ApiResponse,
  CurrentOperation,
  ProfilerStatus,
  ProfilingLevel,
  ServerStatusSample,
} from "@compooss/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { SERVER_QUERY_KEYS } from "./server-query.key";

/** Polls serverStatus and accumulates per-second rates for the charts. */
export const useServerStatusHistory = (connection: string, paused: boolean) => {
  const queryClient = useQueryClient();
  const queryKey = SERVER_QUERY_KEYS.status(connection);
  return useQuery({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ServerStatusSample>>(
        ENDPOINTS.server.status,
      );
      return appendSample(
        queryClient.getQueryData<PerformanceHistory>(queryKey),
        response.data,
      );
    },
    refetchInterval: paused ? false : PERFORMANCE_POLL_INTERVAL_MS,
    retry: false,
  });
};

export const useCurrentOperations = (connection: string, paused: boolean) =>
  useQuery({
    queryKey: SERVER_QUERY_KEYS.operations(connection),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<CurrentOperation[]>>(
        ENDPOINTS.server.operations,
      );
      return response.data ?? [];
    },
    refetchInterval: paused ? false : PERFORMANCE_POLL_INTERVAL_MS,
    retry: false,
  });

export const useKillOperation = (
  connection: string,
  options: TMutationOptions<ApiResponse<null>, string | number> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (opid: string | number) =>
      apiClient.delete<ApiResponse<null>>(ENDPOINTS.server.operationById(opid)),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: SERVER_QUERY_KEYS.operations(connection) });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};

export const useProfiler = (connection: string, db: string, paused: boolean) =>
  useQuery({
    queryKey: SERVER_QUERY_KEYS.profiler(connection, db),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<ProfilerStatus>>(
        `${ENDPOINTS.server.profiler}?db=${encodeURIComponent(db)}`,
      );
      return response.data;
    },
    enabled: !!db,
    refetchInterval: paused ? false : PERFORMANCE_POLL_INTERVAL_MS * 3,
    retry: false,
  });

type SetProfilingVariables = { db: string; level: ProfilingLevel; slowms?: number };

export const useSetProfilingLevel = (
  connection: string,
  options: TMutationOptions<ApiResponse<null>, SetProfilingVariables> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: (variables: SetProfilingVariables) =>
      apiClient.put<ApiResponse<null>>(ENDPOINTS.server.profiler, { body: variables }),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: SERVER_QUERY_KEYS.profiler(connection, variables.db),
      });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};
