import { useState, JSX, useEffect, useRef } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

interface Settings {
  client_path?: string;
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

      <div className="max-w-2xl space-y-6">
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          {settings["client_path"]}
          <br />
          <button onMouseDown={pickClientPath}>Select Client Path</button>
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
