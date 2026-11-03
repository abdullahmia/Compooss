import { LoginPage } from "@/lib/components/auth/login-page.component";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Sign in - Compooss",
  description: "Sign in to Compooss.",
};

export default function LoginRoute() {
  return (
    <Suspense>
      <LoginPage />
    </Suspense>
  );
}
