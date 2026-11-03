import { z } from "zod";

export const AuthConfigSchema = z.object({
  username: z.string().optional(),
  password: z.string().optional(),
  authSource: z.string().optional(),
  authMechanism: z.enum(["SCRAM-SHA-1", "SCRAM-SHA-256"]).optional(),
  tlsCertificateKeyFile: z.string().optional(),
  gssapiServiceName: z.string().optional(),
  canonicalizeHostName: z.boolean().optional(),
});

export const TlsConfigSchema = z.object({
  enabled: z.boolean(),
  caFile: z.string().optional(),
  certFile: z.string().optional(),
  keyFile: z.string().optional(),
  allowInvalidCertificates: z.boolean().optional(),
  allowInvalidHostnames: z.boolean().optional(),
});

export const AdvancedConfigSchema = z.object({
  replicaSet: z.string().optional(),
  readPreference: z
    .enum([
      "primary",
      "primaryPreferred",
      "secondary",
      "secondaryPreferred",
      "nearest",
    ])
    .optional(),
  connectTimeoutMS: z.number().min(0).optional(),
  serverSelectionTimeoutMS: z.number().min(0).optional(),
  directConnection: z.boolean().optional(),
  maxPoolSize: z.number().min(1).optional(),
});

export const ConnectionFormSchema = z.object({
  connectionString: z.string().min(1, "Connection string is required"),
  connectionName: z.string().min(1, "Connection name is required"),
  isFavorite: z.boolean(),
  readOnly: z.boolean().optional(),
  color: z.string().optional(),
  label: z.string().optional(),

  authType: z.enum(["default", "password", "x509", "ldap", "kerberos"]),
  authConfig: AuthConfigSchema.optional(),
  tlsConfig: TlsConfigSchema.optional(),
  advancedConfig: AdvancedConfigSchema.optional(),
});

export type TConnectionForm = z.input<typeof ConnectionFormSchema>;
export type TAuthConfig = z.input<typeof AuthConfigSchema>;
export type TTlsConfig = z.input<typeof TlsConfigSchema>;
export type TAdvancedConfig = z.input<typeof AdvancedConfigSchema>;

/** @deprecated Use ConnectionFormSchema */
export const ConnectionSchema = ConnectionFormSchema;
/** @deprecated Use TConnectionForm */
export type TConnectionSchema = TConnectionForm;
