export type CollectionRef = { dbName: string; collectionName: string };

export function collectionPath({ dbName, collectionName }: CollectionRef): string {
  return `/databases/${encodeURIComponent(dbName)}/collections/${encodeURIComponent(collectionName)}`;
}

/** The collection a /databases/:db/collections/:col pathname points at, or null. */
export function parseCollectionPath(pathname: string | null): CollectionRef | null {
  const match = pathname?.match(/^\/databases\/([^/]+)\/collections\/([^/]+)\/?$/);
  if (!match) return null;
  try {
    return {
      dbName: decodeURIComponent(match[1]),
      collectionName: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
}

/** MongoDB's own unique name for a collection. Database names can't contain ".". */
export function namespaceOf({ dbName, collectionName }: CollectionRef): string {
  return `${dbName}.${collectionName}`;
}

/** The database a /databases/:db/... pathname is inside, or null. */
export function databaseFromPath(pathname: string | null): string | null {
  const match = pathname?.match(/^\/databases\/([^/]+)/);
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}
