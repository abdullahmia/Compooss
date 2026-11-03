import { apiClient } from "@/lib/config/api.config";
import { ENDPOINTS } from "@/lib/constants";
import { DOCUMENTS_QUERY_KEYS } from "./documents-query.key";
import { TQueryOptions, TMutationOptions } from "@/lib/query.types";
import type {
  ApiResponse,
  BulkDeleteResult,
  BulkPreviewResult,
  BulkUpdateResult,
  Document,
  PaginatedResult,
} from "@compooss/types";
import { COLLECTION_QUERY_KEYS } from "@/lib/services/collections/collection-query.key";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export type TDocumentsQueryParams = {
  filter?: string;
  sort?: string;
  project?: string;
  limit?: number;
  skip?: number;
};

const defaultQueryParams: Required<TDocumentsQueryParams> = {
  filter: "{}",
  sort: "{}",
  project: "{}",
  limit: 20,
  skip: 0,
};

export const useGetDocuments = (
  db: string,
  collection: string,
  options?: TQueryOptions<PaginatedResult<Document>> & { queryParams?: TDocumentsQueryParams },
) => {
  const { queryParams: rawParams, ...queryOptions } = options ?? {};
  const queryParams = { ...defaultQueryParams, ...rawParams };

  return useQuery<PaginatedResult<Document>, Error, PaginatedResult<Document>, readonly unknown[]>({
    queryKey: DOCUMENTS_QUERY_KEYS.list(db, collection, queryParams),
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("filter", queryParams.filter);
      params.set("sort", queryParams.sort);
      params.set("project", queryParams.project);
      params.set("limit", String(queryParams.limit));
      params.set("skip", String(queryParams.skip));
      const url = `${ENDPOINTS.documents.all(db, collection)}?${params.toString()}`;
      const response = await apiClient.get<ApiResponse<PaginatedResult<Document>>>(url);
      return response.data;
    },
    enabled: !!db && !!collection,
    ...queryOptions,
  });
};

type AddDocumentVariables = { db: string; collection: string; payload: Record<string, unknown> };

export const useAddDocument = (options: TMutationOptions<unknown, AddDocumentVariables> = {}) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async ({ db, collection, payload }: AddDocumentVariables) => {
      const response = await apiClient.post<ApiResponse<unknown>>(
        ENDPOINTS.documents.all(db, collection),
        payload,
      );
      return response.data;
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENTS_QUERY_KEYS.list(variables.db, variables.collection),
      });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};

type UpdateDocumentVariables = { documentId: string; payload: Record<string, unknown> };

export const useUpdateDocument = (
  db: string,
  collection: string,
  options: TMutationOptions<unknown, UpdateDocumentVariables> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async ({ documentId, payload }: UpdateDocumentVariables) => {
      const response = await apiClient.patch<ApiResponse<unknown>>(
        ENDPOINTS.documents.byId(db, collection, documentId),
        { body: payload },
      );
      return response.data;
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENTS_QUERY_KEYS.list(db, collection),
      });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};

export const useDeleteDocument = (
  db: string,
  collection: string,
  options: TMutationOptions<null, string> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (documentId: string) => {
      const response = await apiClient.delete<ApiResponse<null>>(
        ENDPOINTS.documents.byId(db, collection, documentId),
      );
      return response.data;
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({
        queryKey: DOCUMENTS_QUERY_KEYS.list(db, collection),
      });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};

export type BulkAction = "update" | "delete";

/**
 * Counts the documents a bulk update/delete would affect, using the same
 * strict filter parsing as the operation itself.
 */
export const useBulkPreview = (
  db: string,
  collection: string,
  action: BulkAction,
  filter: string,
  options?: TQueryOptions<BulkPreviewResult>,
) =>
  useQuery({
    queryKey: [...DOCUMENTS_QUERY_KEYS.list(db, collection), "bulk-preview", action, filter],
    queryFn: async () => {
      const path = ENDPOINTS.documents.all(db, collection);
      const body = { filter, dryRun: true };
      const response =
        action === "update"
          ? await apiClient.patch<ApiResponse<BulkPreviewResult>>(path, { body })
          : await apiClient.delete<ApiResponse<BulkPreviewResult>>(path, { body });
      return response.data;
    },
    staleTime: 0,
    retry: false,
    ...options,
  });

type BulkUpdateVariables = { filter: string; update: unknown };

export const useBulkUpdate = (
  db: string,
  collection: string,
  options: TMutationOptions<BulkUpdateResult, BulkUpdateVariables> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async ({ filter, update }: BulkUpdateVariables) => {
      const response = await apiClient.patch<ApiResponse<BulkUpdateResult>>(
        ENDPOINTS.documents.all(db, collection),
        { body: { filter, update } },
      );
      return response.data;
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEYS.list(db, collection) });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};

export const useBulkDelete = (
  db: string,
  collection: string,
  options: TMutationOptions<BulkDeleteResult, string> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (filter: string) => {
      const response = await apiClient.delete<ApiResponse<BulkDeleteResult>>(
        ENDPOINTS.documents.all(db, collection),
        { body: { filter } },
      );
      return response.data;
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEYS.list(db, collection) });
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.list(db) });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};

export const useDuplicateDocument = (
  db: string,
  collection: string,
  options: TMutationOptions<unknown, string> = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    ...options,
    mutationFn: async (documentId: string) => {
      const response = await apiClient.post<ApiResponse<unknown>>(
        ENDPOINTS.documents.duplicate(db, collection, documentId),
      );
      return response.data;
    },
    onSuccess: (data, variables, context, mutation) => {
      queryClient.invalidateQueries({ queryKey: DOCUMENTS_QUERY_KEYS.list(db, collection) });
      queryClient.invalidateQueries({ queryKey: COLLECTION_QUERY_KEYS.list(db) });
      options.onSuccess?.(data, variables, context, mutation);
    },
  });
};
