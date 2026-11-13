/**
 * The hosts in a MongoDB URI, e.g. "cluster0.abc.mongodb.net" or
 * "db1:27017,db2:27017". Everything up to the last "@" is dropped, so
 * credentials never show, even with unencoded characters in the password.
 */
export function connectionHosts(uri: string): string {
  const rest = uri.replace(/^mongodb(\+srv)?:\/\//, "");
  const at = rest.lastIndexOf("@");
  return (at === -1 ? rest : rest.slice(at + 1)).split(/[/?]/)[0];
}
