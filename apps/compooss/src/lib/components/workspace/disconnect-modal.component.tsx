"use client";

import { useWorkspaceTabs } from "@/lib/hooks/use-workspace-tabs.hook";
import { useConnection } from "@/lib/providers/connection-provider";
import {
  Badge,
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@compooss/ui";
import { BookmarkCheck, Database, History, Lock, LogOut, PanelTop } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onClose: () => void;
};

function DisconnectDialog({ onClose }: Omit<Props, "open">) {
  const router = useRouter();
  const { activeConnection, maskedUri, isReadOnly, disconnect } = useConnection();
  const openTabs = useWorkspaceTabs();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const name = activeConnection?.name ?? "this server";

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnect();
      toast.success(`Disconnected from ${name}`);
    } catch {
      // disconnect() clears the local session either way.
      toast.warning(`Disconnected from ${name}, but the server didn't confirm it.`);
    }
    router.push("/connect");
  };

  const close = isDisconnecting ? () => {} : onClose;

  const consequences = [
    openTabs.length > 0 && {
      icon: PanelTop,
      text:
        openTabs.length === 1
          ? "Your open collection tab closes. Unsaved edits in it are lost."
          : `Your ${openTabs.length} open collection tabs close. Unsaved edits in them are lost.`,
    },
    {
      icon: BookmarkCheck,
      text: "The connection stays saved, so you can reconnect from the connections page.",
    },
    { icon: History, text: "Query history and saved pipelines are kept." },
  ].filter((item) => !!item);

  return (
    <Modal open onClose={close}>
      <ModalContent
        size="md"
        role="dialog"
        aria-modal="true"
        aria-label={`Disconnect from ${name}`}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      >
        <ModalHeader
          title={`Disconnect from ${name}?`}
          icon={<LogOut className="h-4 w-4" />}
          onClose={isDisconnecting ? undefined : onClose}
        />
        <ModalBody className="space-y-4">
          <div className="flex items-center gap-3 rounded-md border border-border bg-secondary/50 px-3 py-2.5">
            <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <Database className="h-4 w-4" />
              {activeConnection?.color && (
                <span
                  className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card"
                  style={{ backgroundColor: activeConnection.color }}
                />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="truncate text-sm font-medium text-foreground">{name}</span>
                {activeConnection?.label && (
                  <Badge size="sm" className="shrink-0">
                    {activeConnection.label}
                  </Badge>
                )}
                {isReadOnly && (
                  <Badge variant="warning" size="sm" className="shrink-0 gap-1">
                    <Lock className="h-2.5 w-2.5" />
                    Read-only
                  </Badge>
                )}
              </div>
              {maskedUri && (
                <p className="truncate font-mono text-[11px] text-muted-foreground" title={maskedUri}>
                  {maskedUri}
                </p>
              )}
            </div>
          </div>

          <ul className="space-y-2">
            {consequences.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                <Icon className="mt-px h-3.5 w-3.5 shrink-0" />
                {text}
              </li>
            ))}
          </ul>
        </ModalBody>
        <ModalFooter>
          <Button variant="outline" size="md" onClick={onClose} disabled={isDisconnecting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="md"
            icon={<LogOut className="h-3.5 w-3.5" />}
            loading={isDisconnecting}
            onClick={handleDisconnect}
            autoFocus
          >
            {isDisconnecting ? "Disconnecting…" : "Disconnect"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/** Confirms ending the current MongoDB connection and says what it closes and keeps. */
export const DisconnectModal: React.FC<Props> = ({ open, onClose }) =>
  open ? <DisconnectDialog onClose={onClose} /> : null;
