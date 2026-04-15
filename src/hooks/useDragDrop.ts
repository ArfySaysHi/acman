import { useEffect, useRef } from "react";
import useMpqManager from "./useMpqManager";
import { getCurrentWebview } from "@tauri-apps/api/webview";

export default function useDragDrop(
  mpqManager: ReturnType<typeof useMpqManager>,
) {
  const managerRef = useRef(mpqManager);
  managerRef.current = mpqManager;

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let mounted = true;

    (async () => {
      const listener = await getCurrentWebview().listen(
        "tauri://drag-drop",
        async (event) => {
          const { paths } = event.payload as { paths: string[] };

          for (const path of paths) {
            if (path.toLowerCase().endsWith(".mpq"))
              await managerRef.current.openMpq(path);
            else await managerRef.current.addFile(path);
          }
        },
      );

      if (mounted) unlisten = listener;
      else listener();
    })();

    return () => {
      mounted = false;
      if (unlisten) unlisten();
    };
  }, []);
}
