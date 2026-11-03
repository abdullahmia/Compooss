import { PerformanceView } from "@/lib/components/performance/performance-view.component";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Performance - Compooss",
  description: "Live server metrics, running operations, and slow queries.",
};

export default function PerformancePage() {
  return <PerformanceView />;
}
