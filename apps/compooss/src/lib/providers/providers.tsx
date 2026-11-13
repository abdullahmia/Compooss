"use client";

import "@/lib/config/monaco.config";
import { queryClient } from "@/lib/config/query.config";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import React from "react";
import { Toaster } from "sonner";
import { ConnectionProvider } from "./connection-provider";
import { ShellProvider } from "./shell-provider";

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  // disableTransitionOnChange: otherwise every transition-colors element fades to
  // the new theme, which smears the circular reveal in the theme switcher.
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <ConnectionProvider>
          <ShellProvider>{children}</ShellProvider>
        </ConnectionProvider>
        <Toaster position="top-right" />
      </QueryClientProvider>
    </ThemeProvider>
  );
};
