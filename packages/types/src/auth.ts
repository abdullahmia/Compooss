export interface AuthSession {
  /** True when the server requires a login (COMPOOSS_USERNAME / COMPOOSS_PASSWORD are set). */
  enabled: boolean;
  username: string | null;
}
