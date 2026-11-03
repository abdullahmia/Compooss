"use client";

import { AggregationsTab } from "@/lib/components/collections/aggregations/aggregations-tab.component";
import { DocumentsTab } from "@/lib/components/collections/documents-tab.component";
import { ExplainTab } from "@/lib/components/collections/explain-tab.component";
import { IndexesTab } from "@/lib/components/collections/indexes-tab.component";
import { SchemaTab } from "@/lib/components/collections/schema-tab.component";
import { ValidationTab } from "@/lib/components/collections/validation-tab.component";
import { VALID_TABS, type ViewTab } from "@/lib/constants";
import { useConnection } from "@/lib/providers/connection-provider";
import { useGetCollections } from "@/lib/services/collections/collection.service";
import { formatBytes } from "@/lib/utils";
import { isProtectedDatabase } from "@compooss/types";
import { Badge, Tabs } from "@compooss/ui";
import { BarChart3, FileText, Grid3X3, ShieldCheck } from "lucide-react";
import { useState } from "react";

type Props = {
  dbName: string;
  collectionName: string;
  initialTab?: string;
};

export const CollectionView: React.FC<Props> = ({
  dbName,
  collectionName,
  initialTab,
}) => {
  const [activeTab, setActiveTab] = useState<ViewTab>(() => {
    if (initialTab && VALID_TABS.includes(initialTab as ViewTab)) {
      return initialTab as ViewTab;
    }
    return "documents";
  });
  const { data: collections } = useGetCollections(dbName);
  const { isReadOnly } = useConnection();
  const collection = collections?.find((c) => c.name === collectionName);

  const TABS: { id: ViewTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "documents",
      label: "Documents",
      icon: <FileText className="h-3.5 w-3.5" />,
    },
    {
      id: "aggregations",
      label: "Aggregations",
      icon: <BarChart3 className="h-3.5 w-3.5" />,
    },
    {
      id: "schema",
      label: "Schema",
      icon: <Grid3X3 className="h-3.5 w-3.5" />,
    },
    {
      id: "indexes",
      label: "Indexes",
      icon: <Grid3X3 className="h-3.5 w-3.5" />,
    },
    {
      id: "validation",
      label: "Validation",
      icon: <ShieldCheck className="h-3.5 w-3.5" />,
    },
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id as ViewTab);
  };

  const readOnly = isReadOnly || isProtectedDatabase(dbName);

  const renderTabContent = () => {
    switch (activeTab) {
      case "documents":
        return <DocumentsTab readOnly={readOnly} />;
      case "aggregations":
        return <AggregationsTab readOnly={readOnly} />;
      case "schema":
        return <SchemaTab />;
      case "explain":
        return <ExplainTab />;
      case "indexes":
        return <IndexesTab readOnly={readOnly} />;
      case "validation":
        return <ValidationTab readOnly={readOnly} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-card/50">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-foreground">
            {dbName}.{collectionName}
          </h2>
          <Badge>{collection?.documentCount.toLocaleString()} docs</Badge>
          <Badge variant="subtle" size="sm">
            {collection ? formatBytes(collection.size) : "-"} •{" "}
            {collection?.indexCount ?? 0} indexes • Avg:{" "}
            {collection ? formatBytes(collection.avgObjSize) : "-"}
          </Badge>
        </div>
      </div>

      <Tabs
        variant="underline"
        items={TABS}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {renderTabContent()}
    </div>
  );
};
