"use client";

import { apiClient } from "@/lib/config/api.config";
import { ENDPOINTS } from "@/lib/constants";
import { connectionDB } from "@/lib/storage/connection-db";
import type {
  ApiResponse,
  ConnectionStatus,
  ConnectionTestResult,
  SavedConnection,
} from "@compooss/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface ConnectionContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  isLoading: boolean;
  /** True when the active connection blocks writes (set per saved connection). */
  isReadOnly: boolean;
  activeConnection: SavedConnection | null;
  maskedUri: string | null;
  connect: (connection: SavedConnection) => Promise<ConnectionStatus | undefined>;
  disconnect: () => Promise<void>;
  testConnection: (
    uri: string,
    options?: Record<string, unknown>,
  ) => Promise<ConnectionTestResult>;
  checkStatus: () => Promise<void>;
}

const ConnectionContext = createContext<ConnectionContextValue | null>(null);

const ACTIVE_CONNECTION_KEY = "compooss-active-connection-id";

function buildConnectOptions(conn: SavedConnection): Record<string, unknown> {
  const opts: Record<string, unknown> = {};

  if (conn.advancedConfig) {
    const ac = conn.advancedConfig;
    if (ac.replicaSet) opts.replicaSet = ac.replicaSet;
    if (ac.readPreference) opts.readPreference = ac.readPreference;
    if (ac.connectTimeoutMS) opts.connectTimeoutMS = ac.connectTimeoutMS;
    if (ac.serverSelectionTimeoutMS)
      opts.serverSelectionTimeoutMS = ac.serverSelectionTimeoutMS;
    if (ac.directConnection !== undefined)
      opts.directConnection = ac.directConnection;
    if (ac.maxPoolSize) opts.maxPoolSize = ac.maxPoolSize;
  }

  if (conn.tlsConfig?.enabled) {
    const tc = conn.tlsConfig;
    opts.tls = true;
    if (tc.caFile) opts.tlsCAFile = tc.caFile;
    if (tc.certFile) opts.tlsCertificateKeyFile = tc.certFile;
    if (tc.allowInvalidCertificates)
      opts.tlsAllowInvalidCertificates = tc.allowInvalidCertificates;
    if (tc.allowInvalidHostnames)
      opts.tlsAllowInvalidHostnames = tc.allowInvalidHostnames;
  }

  return opts;
}

export function ConnectionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [activeConnection, setActiveConnection] =
    useState<SavedConnection | null>(null);
  const [maskedUri, setMaskedUri] = useState<string | null>(null);
  const activeConnectionRef = useRef<SavedConnection | null>(null);
  const hasChecked = useRef(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await apiClient.get<ApiResponse<ConnectionStatus>>(
        ENDPOINTS.connection.status,
      );
      const status = res.data;
      if (status?.connected) {
        setIsConnected(true);
        setMaskedUri(status.maskedUri ?? null);
        setIsReadOnly(status.readOnly ?? false);

        if (!activeConnectionRef.current) {
          const savedId = localStorage.getItem(ACTIVE_CONNECTION_KEY);
          if (savedId) {
            const saved = await connectionDB.getById(savedId);
            if (saved) {
              activeConnectionRef.current = saved;
              setActiveConnection(saved);
            }
          }
        }
      } else {
        setIsConnected(false);
        setMaskedUri(null);
      }
    } catch {
      setIsConnected(false);
      setMaskedUri(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasChecked.current) {
      hasChecked.current = true;
      checkStatus();
    }
  }, [checkStatus]);

  const connect = useCallback(async (connection: SavedConnection): Promise<ConnectionStatus | undefined> => {
    setIsConnecting(true);
    try {
      const options = buildConnectOptions(connection);
      const res = await apiClient.post<ApiResponse<ConnectionStatus>>(
        ENDPOINTS.connection.connect,
        { uri: connection.uri, options, readOnly: connection.readOnly ?? false },
      );
      const status = res.data;

      activeConnectionRef.current = connection;
      setIsConnected(true);
      setMaskedUri(status?.maskedUri ?? null);
      setIsReadOnly(status?.readOnly ?? false);
      setActiveConnection(connection);
      localStorage.setItem(ACTIVE_CONNECTION_KEY, connection.id);

      await connectionDB.markUsed(connection.id);
      return status;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await apiClient.post(ENDPOINTS.connection.disconnect);
    } finally {
      activeConnectionRef.current = null;
      setIsConnected(false);
      setMaskedUri(null);
      setIsReadOnly(false);
      setActiveConnection(null);
      localStorage.removeItem(ACTIVE_CONNECTION_KEY);
    }
  }, []);

  const testConnection = useCallback(
    async (
      uri: string,
      options?: Record<string, unknown>,
    ): Promise<ConnectionTestResult> => {
      const res = await apiClient.post<ApiResponse<ConnectionTestResult>>(
        ENDPOINTS.connection.test,
        { uri, options },
      );
      return res.data ?? { ok: false, message: "No response data" };
    },
    [],
  );

  const value = useMemo<ConnectionContextValue>(
    () => ({
      isConnected,
      isConnecting,
      isLoading,
      isReadOnly,
      activeConnection,
      maskedUri,
      connect,
      disconnect,
      testConnection,
      checkStatus,
    }),
    [
      isConnected,
      isConnecting,
      isLoading,
      isReadOnly,
      activeConnection,
      maskedUri,
      connect,
      disconnect,
      testConnection,
      checkStatus,
    ],
  );

  return (
    <ConnectionContext.Provider value={value}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection(): ConnectionContextValue {
  const ctx = useContext(ConnectionContext);
  if (!ctx) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return ctx;
}
