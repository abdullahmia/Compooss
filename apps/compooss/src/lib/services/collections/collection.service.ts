import { apiClient } from "@/lib/config/api.config";
import { ENDPOINTS } from "@/lib/constants";
import { TMutationOptions, TQueryOptions } from "@/lib/query.types";
import type { ApiResponse, Collection, CreateCollectionOptions } from "@compooss/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { COLLECTION_QUERY_KEYS } from "./collection-query.key";

export const useGetCollections = (
  db: string,
  options?: TQueryOptions<Collection[]>,
) =>
  useQuery({
    queryKey: COLLECTION_QUERY_KEYS.list(db),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<Collection[]>>(
        ENDPOINTS.collections.root(db),
      );
      return response.data ?? [];
    },
    enabled: !!db,
    ...options,
  });

type CreateCollectionVariables = {
  collectionName: string;
  options?: CreateCollectionOptions;
};

export const useCreateCollection = (
  dbName: string,
  options: TMutationOptions<ApiResponse<Collection>, CreateCollectionVariables> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (variables: CreateCollectionVariables) =>
      apiClient.post<ApiResponse<Collection>>(
        ENDPOINTS.collections.root(dbName),
        variables,
      ),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.list(dbName),
      });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};

export const useDeleteCollection = (
  dbName: string,
  options: TMutationOptions<ApiResponse<null>, string> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (collectionName: string) =>
      apiClient.delete<ApiResponse<null>>(
        ENDPOINTS.collections.byName(dbName, collectionName),
      ),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: COLLECTION_QUERY_KEYS.list(dbName),
      });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};

type RenameCollectionVariables = { collectionName: string; newName: string };

export const useRenameCollection = (
  dbName: string,
  options: TMutationOptions<ApiResponse<{ name: string }>, RenameCollectionVariables> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async ({ collectionName, newName }: RenameCollectionVariables) =>
      apiClient.patch<ApiResponse<{ name: string }>>(
        ENDPOINTS.collections.byName(dbName, collectionName),
        { body: { newName } },
      ),
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.list(dbName) });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};
