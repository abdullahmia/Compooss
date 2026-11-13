"use client";

import { Palette, Settings, X } from "lucide-react";
import { useState } from "react";
import { IconButton, Modal, ModalContent, Tabs } from "@compooss/ui";
import { AppearanceSettings } from "@/lib/components/settings/appearance-settings.component";

type Props = {
  open: boolean;
  onClose: () => void;
};

type SettingsTab = "appearance";

export const SettingsModal: React.FC<Props> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("appearance");

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: "appearance", label: "Appearance", icon: <Palette className="h-3.5 w-3.5" /> },
  ];

  return (
    <Modal open={open} onClose={onClose}>
      <ModalContent className="max-w-3xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          </div>
          <IconButton
            onClick={onClose}
            icon={<X className="h-4 w-4" />}
            variant="ghost"
            size="sm"
            label="Close"
          />
        </div>

        <div className="flex min-h-[320px]">
          <Tabs
            variant="pill"
            items={tabs}
            activeTab={activeTab}
            onTabChange={(id) => setActiveTab(id as SettingsTab)}
          />

          <div className="flex-1 p-5 space-y-5 overflow-y-auto">
            {activeTab === "appearance" && <AppearanceSettings />}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
};
