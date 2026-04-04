import "./App.css";
import { useState, useRef, useEffect } from "react";
import useStream from "./hooks/useStream";
import { invoke } from "@tauri-apps/api/core";

function App() {
  const { stream: worldserverStream, connected: worldserverConnected } =
    useStream({
      listener: "console-output",
      attach: "attach_worldserver",
      container: "ac-worldserver",
    });

  const [commandInput, setCommandInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [worldserverStream]);

  const sendCommand = async () => {
    if (!commandInput.trim()) return;
    try {
      await invoke("send_command", { command: commandInput });
      setCommandInput("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      sendCommand();
    }
  };

  return (
    <main className="h-screen flex flex-col bg-gray-900 text-green-400 p-4">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-lg font-bold">AzerothCore Console</h1>
        <span
          className={`text-sm ${worldserverConnected ? "text-green-500" : "text-red-500"}`}
        >
          {worldserverConnected ? "Connected" : "Disconnected"}
        </span>
      </div>

      <textarea
        ref={textareaRef}
        value={worldserverStream}
        readOnly
        className="flex-1 w-full bg-black text-green-400 p-2 rounded resize-none font-mono text-sm overflow-y-auto leading-none"
      />

      <div className="mt-2 flex gap-2">
        <input
          value={commandInput}
          onChange={(e) => setCommandInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter command..."
          className="flex-1 bg-gray-800 text-white p-2 rounded outline-none"
        />
        <button
          onClick={sendCommand}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded text-white"
        >
          Send
        </button>
      </div>
    </main>
  );
}

export default App;
