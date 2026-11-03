export type AuthType = "default" | "password" | "x509" | "ldap" | "kerberos";

export type AuthMechanism = "SCRAM-SHA-1" | "SCRAM-SHA-256";

export type ReadPreference =
  | "primary"
  | "primaryPreferred"
  | "secondary"
  | "secondaryPreferred"
  | "nearest";

export interface AuthConfig {
  username?: string;
  password?: string;
  authSource?: string;
  authMechanism?: AuthMechanism;
  tlsCertificateKeyFile?: string;
  gssapiServiceName?: string;
  canonicalizeHostName?: boolean;
}

export interface TlsConfig {
  enabled: boolean;
  caFile?: string;
  certFile?: string;
  keyFile?: string;
  allowInvalidCertificates?: boolean;
  allowInvalidHostnames?: boolean;
}

export interface AdvancedConfig {
  replicaSet?: string;
  readPreference?: ReadPreference;
  connectTimeoutMS?: number;
  serverSelectionTimeoutMS?: number;
  directConnection?: boolean;
  maxPoolSize?: number;
}

export const CONNECTION_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#3b82f6", // blue
  "#8b5cf6", // purple
  "#ec4899", // pink
  "#64748b", // slate
] as const;

export type ConnectionColor = (typeof CONNECTION_COLORS)[number];

export interface SavedConnection {
  id: string;
  name: string;
  uri: string;
  color?: string;
  label?: string;
  isFavorite: boolean;
  isPinned: boolean;

  authType: AuthType;
  authConfig?: AuthConfig;
  tlsConfig?: TlsConfig;
  advancedConfig?: AdvancedConfig;
  /** Blocks every write (documents, indexes, collections, shell) on this connection. */
  readOnly?: boolean;

  createdAt: string;
  lastUsedAt: string | null;
}

export interface ConnectionStatus {
  connected: boolean;
  maskedUri?: string;
  readOnly?: boolean;
  resolvedUri?: string;
  serverInfo?: {
    version?: string;
    host?: string;
  };
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  resolvedUri?: string;
  serverInfo?: {
    version?: string;
    host?: string;
  };
}

/** @deprecated Use SavedConnection instead */
export interface Connection {
  id: string;
  name: string;
  uri: string;
  createdAt: string;
  lastUsedAt: string | null;
}

/** @deprecated Use SavedConnection instead */
export type ConnectionDTO = Omit<Connection, "uri">;
