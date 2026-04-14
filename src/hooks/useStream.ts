import { invoke } from "@tauri-apps/api/core";
import { listen, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

interface UseStreamOptions {
  listener: string;
  attach: string;
  container: string;
}

export interface ServerStream {
  stream: string;
  connected: boolean;
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
      await invoke(attach);
      onSuccess();
    } catch (err) {
      console.error("Failed to attach in useStream:", err);
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
        await listen<{ name?: string; action?: string }>(
          "docker-event",
          async (event) => {
            const { payload } = event;
            if (!payload) return;

            const { name, action } = payload;

            if (!name || !action) return;
            if (name !== container) return;
            if (action.includes("_exec")) return;

            if (action === "start") {
              await tryAttach(() => {
                if (mounted) setConnected(true);
              });
            }
            if (action === "destroy") {
              if (mounted) setConnected(false);
            }
          },
        ),

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
