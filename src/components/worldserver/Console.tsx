import { invoke } from "@tauri-apps/api/core";
import { useEffect, useRef, useState } from "react";

interface Props {
  stream: string;
}

const Console = ({ stream }: Props) => {
  const [commandInput, setCommandInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [stream]);

  const sendCommand = async () => {
    if (!commandInput.trim()) return;
    try {
      await invoke("send_ws_command", { command: commandInput });
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
    <>
      <textarea
        ref={textareaRef}
        value={stream}
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
    </>
  );
};

export default Console;
