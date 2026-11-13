"use client";

import { useConnection } from "@/lib/providers/connection-provider";
import { useShellPanel } from "@/lib/providers/shell-provider";
import { ThemeSwitcher } from "@/lib/components/common/theme-switcher.component";
import { SettingsModal } from "@/lib/components/settings/settings-modal.component";
import { DisconnectModal } from "@/lib/components/workspace/disconnect-modal.component";
import { useAuthSession, useLogout } from "@/lib/services/auth/auth.service";
import { Badge, Button, IconButton } from "@compooss/ui";
import {
  Activity,
  Database,
  Leaf,
  Lock,
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
  const { activeConnection, maskedUri, isReadOnly } = useConnection();
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
          <div className="flex items-center gap-2 bg-secondary rounded-sm px-3 py-1.5 max-w-2xl hover:bg-secondary/80 transition-colors">
            {activeConnection?.color && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: activeConnection.color }}
              />
            )}
            <Database className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs font-medium text-foreground truncate">
              {activeConnection?.name ?? "No connection"}
            </span>
            {activeConnection?.label && (
              <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-sm shrink-0">
                {activeConnection.label}
              </span>
            )}
            {isReadOnly && (
              <Badge variant="warning" size="sm" className="shrink-0 gap-1">
                <Lock className="h-2.5 w-2.5" />
                Read-only
              </Badge>
            )}
            <span className="text-xs font-mono text-muted-foreground truncate min-w-0 flex-1">
              {maskedUri ?? ""}
            </span>
          </div>
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
