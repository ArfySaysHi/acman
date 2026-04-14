import { useEffect } from "react";
import useMpqManager from "./useMpqManager";
import { getCurrentWebview } from "@tauri-apps/api/webview";

export default function useDragDrop(
  mpqManager: ReturnType<typeof useMpqManager>,
) {
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    const setup = async () => {
      unlisten = await getCurrentWebview().listen(
        "tauri://drag-drop",
        async (event) => {
          const { paths } = event.payload as { paths: string[] };

          for (const path of paths) {
            if (path.toLowerCase().endsWith(".mpq")) {
              await mpqManager.openMpq(path);
            } else {
              await mpqManager.addFile(path);
            }
          }
        },
      );
    };

    setup();
    return () => unlisten?.();
  }, [mpqManager]);
}
