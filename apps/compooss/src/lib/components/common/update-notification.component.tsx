"use client";

import {
  DESKTOP_ACTION_EVENT,
  checkForUpdate,
  installUpdate,
  isDesktop,
  type AppUpdate,
  type UpdateProgress,
} from "@/lib/platform/platform";
import { formatBytes } from "@/lib/utils/format-bytes.util";
import { Button, IconButton } from "@compooss/ui";
import { AlertCircle, Download, Loader2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

const TOAST_ID = "app-update";
const FIRST_CHECK_DELAY_MS = 5_000;
const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000;
const RELEASE_NOTES_URL = "https://github.com/abdullahmia/compooss/releases/tag/v";

type UpdateState =
  | { step: "available"; update: AppUpdate }
  | { step: "installing"; update: AppUpdate; progress: UpdateProgress | null }
  | { step: "failed"; update: AppUpdate; error: string };

/**
 * In the desktop app, checks for a new version shortly after launch, every few
 * hours and on Check for Updates… (the macOS app menu, or the command
 * palette), and offers it in a notification. Updating shows the download's
 * progress, then installs it and restarts the app. Renders nothing itself.
 */
export const UpdateNotification: React.FC = () => {
  const [state, setState] = useState<UpdateState | null>(null);
  const installing = useRef(false);
  // Automatic checks don't bring back a version the user put off.
  const postponed = useRef<string | null>(null);

  useEffect(() => {
    if (!isDesktop()) return;
    let checking = false;

    const check = async (manual: boolean) => {
      if (checking || installing.current) return;
      checking = true;
      const loadingId = manual ? toast.loading("Checking for updates…") : undefined;
      try {
        const update = await checkForUpdate();
        if (!update) {
          if (manual) toast.success("Compooss is up to date.", { id: loadingId });
          return;
        }
        // Without an id, dismiss() would close every toast.
        if (loadingId !== undefined) toast.dismiss(loadingId);
        if (manual || update.version !== postponed.current) {
          setState({ step: "available", update });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (manual) toast.error("Couldn't check for updates", { id: loadingId, description: message });
        else console.warn("Update check failed:", message);
      } finally {
        checking = false;
      }
    };

    const onAction = (event: Event) => {
      if ((event as CustomEvent<string>).detail === "check-for-updates") check(true);
    };
    window.addEventListener(DESKTOP_ACTION_EVENT, onAction);

    // `tauri dev` can't install updates, so it only checks when asked.
    const automatic = process.env.NODE_ENV !== "development";
    const firstCheck = automatic ? setTimeout(() => check(false), FIRST_CHECK_DELAY_MS) : undefined;
    const interval = automatic ? setInterval(() => check(false), CHECK_INTERVAL_MS) : undefined;
    return () => {
      window.removeEventListener(DESKTOP_ACTION_EVENT, onAction);
      clearTimeout(firstCheck);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!state) {
      toast.dismiss(TOAST_ID);
      return;
    }

    const install = async () => {
      installing.current = true;
      setState({ step: "installing", update: state.update, progress: null });
      try {
        await installUpdate((progress) =>
          setState({ step: "installing", update: state.update, progress }),
        );
        // The app restarts now.
      } catch (err) {
        installing.current = false;
        const error = err instanceof Error ? err.message : String(err);
        setState({ step: "failed", update: state.update, error });
      }
    };
    const postpone = () => {
      postponed.current = state.update.version;
      setState(null);
    };

    toast.custom(() => <UpdateCard state={state} onInstall={install} onPostpone={postpone} />, {
      id: TOAST_ID,
      duration: Infinity,
      dismissible: false,
    });
  }, [state]);

  return null;
};

type UpdateCardProps = {
  state: UpdateState;
  onInstall: () => void;
  onPostpone: () => void;
};

const UpdateCard: React.FC<UpdateCardProps> = ({ state, onInstall, onPostpone }) => {
  const { version, currentVersion } = state.update;

  return (
    <div className="w-full flex gap-3 p-3.5 rounded-lg border border-border bg-popover text-popover-foreground shadow-lg">
      <div className="mt-0.5 shrink-0">
        {state.step === "failed" ? (
          <AlertCircle className="h-4 w-4 text-destructive" />
        ) : state.step === "installing" ? (
          <Loader2 className="h-4 w-4 text-primary animate-spin" />
        ) : (
          <Download className="h-4 w-4 text-primary" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        {state.step === "available" && (
          <>
            <p className="text-sm font-medium">Compooss {version} is available</p>
            <p className="text-xs text-muted-foreground">
              You have {currentVersion}. The app restarts to finish updating.
            </p>
            <div className="flex items-center gap-2 pt-2">
              {/* The desktop app opens other sites in the default browser. */}
              <a
                href={`${RELEASE_NOTES_URL}${version}`}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                What&apos;s new
              </a>
              <div className="flex-1" />
              <Button variant="outline" size="sm" onClick={onPostpone}>
                Later
              </Button>
              <Button size="sm" onClick={onInstall}>
                Update
              </Button>
            </div>
          </>
        )}

        {state.step === "installing" && <InstallStatus version={version} progress={state.progress} />}

        {state.step === "failed" && (
          <>
            <p className="text-sm font-medium">Couldn&apos;t update to {version}</p>
            <p className="text-xs text-muted-foreground break-words">{state.error}</p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onPostpone}>
                Later
              </Button>
              <Button size="sm" onClick={onInstall}>
                Try again
              </Button>
            </div>
          </>
        )}
      </div>

      {state.step === "available" && (
        <IconButton
          variant="ghost"
          size="sm"
          icon={<X className="h-3.5 w-3.5" />}
          label="Close"
          onClick={onPostpone}
          className="self-start -mt-1 -mr-1"
        />
      )}
    </div>
  );
};

const InstallStatus: React.FC<{ version: string; progress: UpdateProgress | null }> = ({
  version,
  progress,
}) => {
  if (progress?.kind === "installing") {
    return (
      <>
        <p className="text-sm font-medium">Installing Compooss {version}…</p>
        <p className="text-xs text-muted-foreground">The app restarts when it&apos;s done.</p>
      </>
    );
  }

  const downloaded = progress?.downloaded ?? 0;
  const total = progress?.total ?? null;
  const percent = total ? Math.min(100, Math.round((downloaded / total) * 100)) : null;

  return (
    <>
      <p className="text-sm font-medium">Downloading Compooss {version}…</p>
      <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full bg-primary transition-[width] duration-200"
          style={{ width: `${percent ?? 0}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground tabular-nums">
        {total
          ? `${formatBytes(downloaded)} of ${formatBytes(total)} · ${percent}%`
          : `${formatBytes(downloaded)} downloaded`}
      </p>
    </>
  );
};
