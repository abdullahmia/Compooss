"use client";

import { useShellPanel } from "@/lib/providers/shell-provider";
import { ThemeSwitcher } from "@/lib/components/common/theme-switcher.component";
import { SettingsModal } from "@/lib/components/settings/settings-modal.component";
import { ConnectionSwitcher } from "@/lib/components/workspace/connection-switcher.component";
import { DisconnectModal } from "@/lib/components/workspace/disconnect-modal.component";
import { useAuthSession, useLogout } from "@/lib/services/auth/auth.service";
import { Button, IconButton } from "@compooss/ui";
import {
  Activity,
  Leaf,
  LogOut,
  Search,
  Settings,
  TerminalSquare,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  onOpenCommandPalette: () => void;
};

const isMac = typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export const TopBar: React.FC<Props> = ({ onOpenCommandPalette }) => {
  const [disconnectOpen, setDisconnectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { isOpen: isShellOpen, toggle: toggleShell } = useShellPanel();
  const { data: auth } = useAuthSession();
  const { mutate: logout, isPending: isLoggingOut } = useLogout({
    onSuccess: () => window.location.assign("/login"),
    onError: () => toast.error("Sign-out failed. Please try again."),
  });
  const router = useRouter();
  const pathname = usePathname();

  return (
    <>
      <div className="h-11 flex items-center gap-2 px-3 bg-topbar border-b border-border shrink-0">
        <Link
          href="/databases"
          title="Databases"
          className="flex items-center gap-2 rounded-sm transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50"
        >
          <Leaf className="h-5 w-5 text-primary" />
          <span className="font-semibold text-sm text-foreground tracking-tight">
            Compooss
          </span>
        </Link>

        <div className="flex-1 mx-4">
          <ConnectionSwitcher />
        </div>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden md:flex items-center gap-2 h-7 px-2.5 rounded-sm border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <Search className="h-3.5 w-3.5" />
          Search
          <kbd className="px-1 rounded-sm border border-border text-[10px] font-sans">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        </button>
        <IconButton
          variant={pathname === "/performance" ? "active" : "ghost"}
          icon={<Activity className="h-4 w-4" />}
          label="Performance"
          onClick={() => router.push("/performance")}
        />
        <IconButton
          variant="default"
          icon={
            <TerminalSquare
              className={`h-4 w-4 ${isShellOpen ? "text-primary" : ""}`}
            />
          }
          label="MongoDB Shell"
          onClick={toggleShell}
        />
        <ThemeSwitcher />
        <IconButton
          variant="ghost"
          icon={<Settings className="h-4 w-4" />}
          label="Settings"
          onClick={() => setSettingsOpen(true)}
        />
        <div className="h-5 w-px bg-border mx-1" />
        {auth?.enabled && (
          <>
            <span className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound className="h-3.5 w-3.5" />
              {auth.username}
            </span>
            <Button
              variant="ghost"
              size="sm"
              loading={isLoggingOut}
              onClick={() => logout()}
            >
              Log out
            </Button>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          icon={<LogOut className="h-3.5 w-3.5" />}
          onClick={() => setDisconnectOpen(true)}
        >
          Disconnect
        </Button>
      </div>

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <DisconnectModal open={disconnectOpen} onClose={() => setDisconnectOpen(false)} />
    </>
  );
};
