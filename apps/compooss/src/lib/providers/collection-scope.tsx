"use client";

import { createContext, useContext } from "react";

type CollectionScope = { dbName: string; collectionName: string };

const CollectionScopeContext = createContext<CollectionScope | null>(null);

/**
 * Tells a collection's tabs which collection they belong to. Workspace tabs
 * keep several collections mounted at once, so components can't read the
 * route params: those always describe the active tab, not their own.
 */
export const CollectionScopeProvider = CollectionScopeContext.Provider;

export function useCollectionScope(): CollectionScope {
  const scope = useContext(CollectionScopeContext);
  if (!scope) {
    throw new Error("useCollectionScope must be used inside a CollectionView");
  }
  return scope;
}
