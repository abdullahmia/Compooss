/** The message from a failed apiClient request, or the fallback. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  const apiErr = error as { payload?: { message?: string } } | null;
  return apiErr?.payload?.message ?? fallback;
}
