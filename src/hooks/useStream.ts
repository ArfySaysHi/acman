import { invoke } from "@tauri-apps/api/core";
import { listen, Event, UnlistenFn } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

interface UseStreamOptions {
  listener: string; // console output events
  attach: string; // command to attach to container
  container: string; // container name, e.g. "ac-worldserver"
}

const useStream = ({ listener, attach, container }: UseStreamOptions) => {
  const [stream, setStream] = useState("");
  const [connected, setConnected] = useState(false);
  const streamRef = useRef("");
  const unlistenRef = useRef<UnlistenFn | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      try {
        // attach immediately
        await invoke(attach);
        if (mounted) setConnected(true);
      } catch {
        if (mounted) setConnected(false);
      }

      // Listen for Docker events
      unlistenRef.current = await listen<string>(
        "docker-event",
        async (event: Event<string>) => {
          const payload = event.payload;
          // Only react to our target container
          if (payload.includes(container) && payload.includes("→ start")) {
            try {
              await invoke(attach);
              if (mounted) setConnected(true);
            } catch {
              if (mounted) setConnected(false);
            }
          }
          // Append event to console stream
          streamRef.current += payload + "\n";
          if (mounted) setStream(streamRef.current);
        },
      );

      // Listen for console output
      await listen<string>(listener, (event) => {
        streamRef.current += event.payload + "\n";
        if (mounted) setStream(streamRef.current);
      });
    };

    setup();

    return () => {
      mounted = false;
      if (unlistenRef.current) unlistenRef.current();
    };
  }, [attach, container, listener]);

  return { stream, connected };
};

export default useStream;
