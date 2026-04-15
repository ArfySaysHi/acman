import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useState } from "react";

export default function QuickMpq() {
  const [path, setPath] = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);

  const selectPath = async () => {
    const p = await open({
      directory: true,
      title: "Select folder to convert to MPQ",
    });
    setPath(p);
    setDone(false);
  };

  const convertToMpq = async () => {
    if (converting || !path) return;
    setConverting(true);
    try {
      await invoke("path_to_mpq", { path });
      setDone(true);
    } catch (err) {
      console.error("Failed to create mpq:", err);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div>
      <div className="ayu-page-header">
        <h2 className="ayu-heading">Quick MPQ</h2>
      </div>

      <div className="ayu-panel p-5 max-w-sm flex flex-col gap-4">
        <div>
          <div className="text-ayu-dim text-[10px] uppercase tracking-wider mb-1.5">
            Source folder
          </div>
          <div
            className={`ayu-path font-mono break-all ${path ? "" : "empty"}`}
          >
            {path ?? "No folder selected"}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onMouseDown={selectPath}
            className="ayu-btn ayu-btn-ghost ayu-btn-md flex-1"
          >
            Browse
          </button>
          <button
            onMouseDown={convertToMpq}
            disabled={!path || converting}
            className={`ayu-btn ayu-btn-md flex-1 ${
              done ? "ayu-btn-green" : "ayu-btn-orange"
            }`}
          >
            {converting ? "Converting…" : done ? "✓ Done" : "Convert"}
          </button>
        </div>
      </div>
    </div>
  );
}
