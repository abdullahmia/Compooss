/**
 * Replaces // and /* comments with spaces, keeping line breaks, so positions
 * in JSON.parse errors still point at the original text.
 */
export function stripJsonComments(raw: string): string {
  const blank = (text: string) => text.replace(/[^\r\n]/g, " ");
  let result = "";
  let i = 0;
  while (i < raw.length) {
    if (raw[i] === '"') {
      const start = i;
      i++;
      while (i < raw.length && raw[i] !== '"') {
        if (raw[i] === "\\") i++;
        i++;
      }
      i++;
      result += raw.slice(start, i);
    } else if (raw[i] === "/" && raw[i + 1] === "/") {
      const start = i;
      while (i < raw.length && raw[i] !== "\n") i++;
      result += blank(raw.slice(start, i));
    } else if (raw[i] === "/" && raw[i + 1] === "*") {
      const start = i;
      i += 2;
      while (i < raw.length && !(raw[i] === "*" && raw[i + 1] === "/")) i++;
      i += 2;
      result += blank(raw.slice(start, i));
    } else {
      result += raw[i];
      i++;
    }
  }
  return result;
}
