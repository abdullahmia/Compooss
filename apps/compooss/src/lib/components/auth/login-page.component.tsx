"use client";

import { ThemeSwitcher } from "@/lib/components/common/theme-switcher.component";
import { LoginFormSchema, type TLoginForm } from "@/lib/schemas";
import { useLogin } from "@/lib/services/auth/auth.service";
import { Button, Input } from "@compooss/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { Leaf, LogIn, XCircle } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";

/** Only same-site paths are allowed, so the login page can't redirect elsewhere. */
function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return "/";
  }
  return next;
}

export const LoginPage: React.FC = () => {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TLoginForm>({
    resolver: zodResolver(LoginFormSchema),
    defaultValues: { username: "", password: "" },
  });
  const hookForm = form as unknown as UseFormReturn<Record<string, unknown>>;

  const { mutate: login, isPending, isSuccess } = useLogin({
    onSuccess: () => {
      // Full page load so every provider re-reads its state with the new cookie.
      window.location.assign(safeNextPath(searchParams.get("next")));
    },
    onError: (err) => {
      const apiErr = err as { payload?: { message?: string } };
      setError(apiErr.payload?.message ?? "Sign-in failed. Please try again.");
    },
  });

  const handleSubmit = (data: TLoginForm) => {
    setError(null);
    login(data);
  };

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="h-12 flex items-center justify-between px-4 shrink-0 bg-topbar/60 backdrop-blur-xl border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-primary/15 flex items-center justify-center ring-1 ring-primary/20">
            <Leaf className="h-3.5 w-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm text-foreground tracking-tight">
            Compooss
          </span>
        </div>
        <ThemeSwitcher />
      </div>

      <div className="flex-1 overflow-y-auto relative flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-sm w-full mx-auto px-6 py-10">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 mb-4">
              <Leaf className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1.5">
              Sign in
            </h1>
            <p className="text-sm text-muted-foreground">
              This Compooss server requires a login
            </p>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="relative rounded-2xl overflow-hidden shadow-xl shadow-black/10 dark:shadow-black/30">
              <div className="absolute inset-0 bg-white/60 dark:bg-white/[0.04] backdrop-blur-2xl" />
              <div className="absolute inset-0 border border-black/[0.06] dark:border-white/[0.12] rounded-2xl pointer-events-none" />
              <div className="absolute inset-px rounded-2xl bg-gradient-to-b from-white/80 to-white/20 dark:from-white/[0.06] dark:to-transparent pointer-events-none" />

              <div className="relative z-10 p-6 space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="username"
                    className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Username
                  </label>
                  <Input
                    hookForm={hookForm}
                    name="username"
                    id="username"
                    autoComplete="username"
                    autoFocus
                    inputSize="lg"
                    className="w-full"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                  >
                    Password
                  </label>
                  <Input
                    hookForm={hookForm}
                    name="password"
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    inputSize="lg"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-3 flex items-start gap-2.5 text-xs px-3.5 py-3 rounded-xl border bg-destructive/5 text-destructive border-destructive/20">
                <XCircle className="h-3.5 w-3.5 mt-px shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full mt-5"
              loading={isPending || isSuccess}
              disabled={isPending || isSuccess}
              icon={<LogIn className="h-3.5 w-3.5" />}
            >
              Sign in
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
