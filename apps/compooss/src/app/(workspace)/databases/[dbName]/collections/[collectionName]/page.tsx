import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Collection - Compooss",
  description: "Browse documents and manage this collection.",
};

/**
 * Collections are rendered by WorkspaceShell rather than here, so each open
 * collection stays mounted as a tab when you navigate between them.
 */
export default function CollectionPage() {
  return null;
}
