import { JSX, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ServerStream } from "../hooks/useStream";
import { invoke } from "@tauri-apps/api/core";

interface WorldServerProps {
  worldserverSocket: ServerStream;
}

export default function WorldServer({ worldserverSocket }: WorldServerProps): JSX.Element {
  const { stream, connected } = worldserverSocket;
  const [cmd, setCmd] = useState("");
  const consoleRef = useRef<HTMLTextAreaElement | null>(null);

  const sendCommand = async (command: string) => {
    if (!connected) return;
    await invoke("send_ws_command", { command });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      sendCommand(cmd);
      setCmd("");
    }
  };

  useEffect(() => {
    consoleRef.current?.scrollTo(0, consoleRef.current.scrollHeight);
  }, [stream]);

  return (
    <div className="h-full w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="ayu-page-header ayu-page-header-inline justify-between">
          <h2 className="ayu-heading">World Server</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={connected ? "ayu-dot-connected" : "ayu-dot-disconnected"} />
          <span className="text-ayu-dim text-[11px]">
            {connected ? "connected" : "disconnected"}
          </span>
        </div>
      </div>

      <div className="flex-1 ayu-panel-alt overflow-hidden">
        <textarea
          value={stream}
          ref={consoleRef}
          readOnly
          tabIndex={-1}
          placeholder="Waiting for server output…"
          className="ayu-console"
        />
      </div>

      <div className="ayu-panel-alt flex items-center gap-2 px-3 py-2">
        <span className="text-ayu-orange text-[11px] select-none">$</span>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          readOnly={!connected}
          placeholder={connected ? "Enter command…" : "Server not connected"}
          className="ayu-input flex-1 border-0 bg-transparent p-0 focus:ring-0 text-[12px]"
        />
      </div>
    </div>
  );
}
