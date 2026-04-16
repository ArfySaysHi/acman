import { FileEntry, ViewEntry } from "../types/zod";

export function toPrefix(path: string): string {
  return path === "/"
    ? ""
    : path.replace(/^\//, "").replace(/\//g, "\\") + "\\";
}

export function joinPath(current: string, segment: string): string {
  return current === "/" ? `${segment}` : `${current}/${segment}`;
}

export function windowsify(path: string): string {
  return path.replace(/\//g, "\\").replace(/^\\/, "");
}

export function getNameFromPath(path: string): string {
  const splitPath = path.split("/");
  return splitPath[splitPath.length - 1];
}

export function trimPath(current: string, crumbIndex: number): string {
  if (crumbIndex === -1) return "/";
  const parts = current.replace(/^\//, "").split("/").filter(Boolean);
  return "/" + parts.slice(0, crumbIndex + 1).join("/");
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function filterEntries(files: FileEntry[], path: string): ViewEntry[] {
  const prefix = toPrefix(path);
  const seen = new Set<string>();
  const result: ViewEntry[] = [];

  for (const file of files) {
    const norm = file.name.replace(/\//g, "\\");
    if (!norm.startsWith(prefix)) continue;

    const remainder = norm.slice(prefix.length);
    const sepIdx = remainder.indexOf("\\");

    if (sepIdx === -1) {
      result.push({ kind: "file", name: remainder, entry: file });
    } else {
      const dirName = remainder.slice(0, sepIdx);
      if (!seen.has(dirName)) {
        seen.add(dirName);
        result.push({ kind: "dir", name: dirName });
      }
    }
  }
  return [
    ...result
      .filter((e) => e.kind === "dir")
      .sort((a, b) => a.name.localeCompare(b.name)),
    ...result
      .filter((e) => e.kind === "file")
      .sort((a, b) => a.name.localeCompare(b.name)),
  ];
}
