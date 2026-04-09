import { useState, JSX, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

interface Settings {
  client_path?: string;
  output_path?: string;
}

export default function Settings(): JSX.Element {
  const [settings, setSettings] = useState<Settings>({});
  const strictModePlacator = useRef<boolean>(false);

  useEffect(() => {
    if (strictModePlacator.current) return;

    strictModePlacator.current = true;
    handleLoad();
  }, []);

  const pickClientPath = async () => {
    const path = await open({
      directory: true,
      title: "Select WoW Client Folder",
    });
    if (path) setSettings((prev) => ({ ...prev, client_path: path }));
  };

  const pickOutputPath = async () => {
    const path = await open({
      directory: true,
      title: "Pick a folder to dump patch files",
    });
    if (path) setSettings((prev) => ({ ...prev, output_path: path }));
  };

  const handleSave = async (): Promise<void> => {
    try {
      await invoke("save_settings", { newSettings: settings });
    } catch (err) {
      console.error("Failed to save settings:", err);
    }
  };

  const handleLoad = async () => {
    try {
      setSettings(JSON.parse(await invoke("load_settings")));
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-green-400">Settings</h2>

      <div className="max-w-2xl space-y-6 mb-4">
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <h3 className="text-lg font-semibold text-green-400 mb-1">
            WoW Client Path
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            Path to your unmodified 3.3.5a client directory. Used as the base
            for DBC extraction and patch output.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 font-mono truncate">
              {settings["client_path"] || (
                <span className="text-gray-500">No path selected…</span>
              )}
            </div>
            <button
              onMouseDown={pickClientPath}
              className="shrink-0 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-green-400 text-gray-300 hover:text-green-400 text-sm rounded transition-colors cursor-pointer"
            >
              Browse
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-2xl space-y-6">
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <h3 className="text-lg font-semibold text-green-400 mb-1">
            Patch Output Directory
          </h3>
          <p className="text-gray-400 text-sm mb-4">
            This is where any .MPQ files will be dumped.
          </p>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-sm text-gray-300 font-mono truncate">
              {settings["output_path"] || (
                <span className="text-gray-500">No path selected…</span>
              )}
            </div>
            <button
              onMouseDown={pickOutputPath}
              className="shrink-0 px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-600 hover:border-green-400 text-gray-300 hover:text-green-400 text-sm rounded transition-colors cursor-pointer"
            >
              Browse
            </button>
          </div>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-semibold cursor-pointer"
        >
          Save Settings
        </button>
      </div>
    </div>
  );
}
