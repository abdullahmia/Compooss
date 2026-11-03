export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiClientOptions {
  baseUrl?: string;
  /**
   * Optional function to resolve an auth token (e.g. from cookies or storage).
   */
  getAuthToken?: () => string | null | undefined | Promise<string | null | undefined>;
  /**
   * Default headers applied to every request.
   */
  defaultHeaders?: HeadersInit;
  /**
   * Called when a request is rejected with 401, e.g. after the login expires.
   */
  onUnauthorized?: () => void;
}

export type RequestOptions<TBody = unknown> = Omit<RequestInit, "body" | "headers"> & {
  /**
   * JSON-serializable body for POST/PUT/PATCH.
   */
  body?: TBody;
  /**
   * Extra headers to merge with defaults.
   */
  headers?: HeadersInit;
};

export class ApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: ApiClientOptions["getAuthToken"];
  private readonly defaultHeaders: HeadersInit;
  private readonly onUnauthorized?: ApiClientOptions["onUnauthorized"];

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl ?? "";
    this.getAuthToken = options.getAuthToken;
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.onUnauthorized = options.onUnauthorized;
  }

  /**
   * Build headers for a request, including auth if available.
   */
  async getHeaders(extra?: HeadersInit): Promise<Headers> {
    const headers = new Headers(this.defaultHeaders);

    if (extra) {
      const extraHeaders = new Headers(extra);
      extraHeaders.forEach((value, key) => {
        headers.set(key, value);
      });
    }

    const token = this.getAuthToken ? await this.getAuthToken() : null;
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    return headers;
  }

  private resolveUrl(path: string): string {
    if (!this.baseUrl) return path;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const normalizedBase = this.baseUrl.endsWith("/")
      ? this.baseUrl.slice(0, -1)
      : this.baseUrl;
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${normalizedBase}${normalizedPath}`;
  }

  /**
   * Low-level request helper.
   */
  async request<TResponse = unknown, TBody = unknown>(
    path: string,
    method: HttpMethod,
    options: RequestOptions<TBody> = {},
  ): Promise<TResponse> {
    const { body, headers: extraHeaders, ...rest } = options;

    const headers = await this.getHeaders(extraHeaders);

    const init: RequestInit = {
      method,
      ...rest,
      headers,
    };

    if (body !== undefined && body !== null && method !== "GET") {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(body);
    }

    const response = await fetch(this.resolveUrl(path), init);

    if (!response.ok) {
      if (response.status === 401) this.onUnauthorized?.();
      const rawText = await response.text();
      let errorPayload: unknown;
      try {
        errorPayload = JSON.parse(rawText);
      } catch {
        errorPayload = rawText;
      }
      const error = new Error(
        `Request failed with status ${response.status}: ${response.statusText}`,
      ) as Error & { status?: number; payload?: unknown };
      error.status = response.status;
      error.payload = errorPayload;
      throw error;
    }

    // Try to parse JSON, fall back to text
    const contentType = response.headers.get("Content-Type") ?? "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as TResponse;
    }

    return (await response.text()) as unknown as TResponse;
  }

  get<TResponse = unknown>(
    path: string,
    options?: Omit<RequestOptions<never>, "body">,
  ): Promise<TResponse> {
    return this.request<TResponse, never>(path, "GET", options);
  }

  post<TResponse = unknown, TBody = unknown>(
    path: string,
    body?: TBody,
    options?: RequestOptions<TBody>,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>(path, "POST", { ...options, body: body ?? undefined });
  }

  put<TResponse = unknown, TBody = unknown>(
    path: string,
    options?: RequestOptions<TBody>,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>(path, "PUT", options);
  }

  patch<TResponse = unknown, TBody = unknown>(
    path: string,
    options?: RequestOptions<TBody>,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>(path, "PATCH", options);
  }

  delete<TResponse = unknown, TBody = unknown>(
    path: string,
    options?: RequestOptions<TBody>,
  ): Promise<TResponse> {
    return this.request<TResponse, TBody>(path, "DELETE", options);
  }
}

export const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_URL ?? "/api",
  onUnauthorized: () => {
    const { pathname, search } = window.location;
    if (pathname === "/login") return;
    window.location.assign(
      `/login?next=${encodeURIComponent(pathname + search)}`,
    );
  },
});