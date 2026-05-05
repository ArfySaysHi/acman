export default class PathHelper {
  static pathToFileName(path: string) {
    return path.split(/[/\\]/).pop() ?? path;
  }
}
