import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

export default function QuickMpq() {
  const [path, setPath] = useState<string | null>(null);
  const [converting, setConverting] = useState<boolean>(false);

  const selectPath = async () => {
    const path = await open({
      directory: true,
      title: "Select folder to convert to MPQ",
    });
    setPath(path);
  };

  const convertToMpq = async () => {
    if (converting) return;

    setConverting(true);
    try {
      await invoke("path_to_mpq", { path });
    } catch (err) {
      console.error("Failed to create mpq:", err);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-gray-900 rounded-2xl shadow-lg border border-gray-800">
      <h2 className="text-3xl font-bold mb-4 text-green-400">Quick MPQ</h2>

      <div className="mb-6 text-gray-300">
        <span className="font-semibold text-gray-400">Current Path:</span>
        <div className="mt-1 break-all text-sm bg-gray-800 p-2 rounded-md border border-gray-700">
          {path ?? "Please select a folder."}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onMouseDown={selectPath}
          className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white cursor-pointer rounded-lg transition-colors duration-150"
        >
          Select Path
        </button>

        <button
          onMouseDown={convertToMpq}
          disabled={!path || converting}
          className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors duration-150
          ${
            path && !converting
              ? "bg-green-600 hover:bg-green-500 active:bg-green-700 cursor-pointer"
              : "bg-gray-700 cursor-not-allowed text-gray-400"
          }`}
        >
          Convert
        </button>
      </div>
    </div>
  );
}
