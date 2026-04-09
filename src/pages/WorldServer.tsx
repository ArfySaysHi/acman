import { JSX, KeyboardEvent, useEffect, useRef, useState } from "react";
import { ServerStream } from "../hooks/useStream";
import { invoke } from "@tauri-apps/api/core";

interface WorldServerProps {
  worldserverSocket: ServerStream;
}

export default function WorldServer({
  worldserverSocket,
}: WorldServerProps): JSX.Element {
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
    if (!consoleRef.current) return;

    consoleRef.current.scrollTo(0, consoleRef.current.scrollHeight);
  }, [stream]);

  return (
    <div className="h-full w-full p-2 gap-3 flex flex-col">
      <div>{connected ? "Connected" : "Disconnected"}</div>
      <div className="w-full h-full flex rounded-lg bg-gray-800 p-2">
        <textarea
          value={stream}
          ref={consoleRef}
          readOnly
          className="w-full bg-black text-green-400 rounded-lg resize-none"
          tabIndex={-1}
        />
      </div>
      <div className="flex rounded-lg bg-gray-800 p-2">
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`bg-black text-green-400 rounded-sm p-2 w-full ${connected ? "cursor-normal" : "cursor-not-allowed"}`}
          readOnly={!connected}
        />
      </div>
    </div>
  );
}
