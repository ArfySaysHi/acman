export function pathToFileName(path: string) {
  return path.split(/[/\\]/).pop() ?? path;
}
