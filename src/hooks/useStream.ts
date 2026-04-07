import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

interface UseStreamOptions {
  listener: string;
  attach: string;
  container: string;
}

const useStream = ({ listener, attach, container }: UseStreamOptions) => {
  const [stream, setStream] = useState("");
  const [connected, setConnected] = useState(false);
  const streamRef = useRef("");

  const appendLine = (line: string) => {
    streamRef.current += line + "\n";
    setStream(streamRef.current);
  };

  const tryAttach = async (onSuccess: () => void) => {
    try {
      const res = await invoke(attach);
      console.log(res);
      onSuccess();
    } catch {
      // stay disconnected
    }
  };

  useEffect(() => {
    let mounted = true;
    const unlisteners: UnlistenFn[] = [];

    const setup = async () => {
      await tryAttach(() => {
        if (mounted) setConnected(true);
      });

      unlisteners.push(
        await listen<string>("docker-event", async (event) => {
          const { payload } = event;
          if (!payload.includes(container)) return;

          if (payload.includes("→ start")) {
            await tryAttach(() => {
              if (mounted) setConnected(true);
            });
          }
          if (!payload.includes("→ exec_")) {
            if (mounted) appendLine(payload);
          }
        }),

        await listen<string>(listener, (event) => {
          if (mounted) appendLine(event.payload);
        }),
      );
    };

    setup();

    return () => {
      mounted = false;
      unlisteners.forEach((fn) => fn());
    };
  }, [attach, container, listener]);

  return { stream, connected };
};

export default useStream;
