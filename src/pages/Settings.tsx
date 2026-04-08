import { useState, JSX } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";

interface SettingItem {
  id: string;
  label: string;
  description: string;
  value: string | boolean;
  type: "text" | "toggle" | "select";
  options?: string[];
}

export default function Settings(): JSX.Element {
  const [settings, setSettings] = useState<SettingItem[]>([]);

  const pickClientPath = async () => {
    const path = await open({
      directory: true,
      title: "Select WoW Client Folder",
    });
    if (path) handleChange("client-path", path);
  };

  const handleChange = (id: string, newValue: string | boolean): void => {
    setSettings((prev) =>
      prev.map((setting) =>
        setting.id === id ? { ...setting, value: newValue } : setting,
      ),
    );
  };

  const handleSave = async (): Promise<void> => {
    try {
      // Replace with your actual API call
      // await invoke("save_settings", { settings });
      console.log("Settings saved:", settings);
      alert("Settings saved successfully!");
    } catch (err) {
      console.error("Failed to save settings:", err);
      alert("Failed to save settings");
    }
  };

  const testFn = async () => {
    const res = await invoke("load_settings");
    console.log(res);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-green-400">Settings</h2>
      <button onClick={testFn}>Test Function</button>

      <div className="max-w-2xl space-y-6">
        <div className="bg-gray-800 p-6 rounded border border-gray-700">
          <button onMouseDown={pickClientPath}>Select Client Path</button>
        </div>
      </div>

      <div className="mt-8 flex gap-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors font-semibold"
        >
          Save Settings
        </button>
        <button className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors font-semibold">
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
