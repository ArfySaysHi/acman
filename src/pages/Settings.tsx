import { useState, JSX } from "react";

interface SettingItem {
  id: string;
  label: string;
  description: string;
  value: string | boolean;
  type: "text" | "toggle" | "select";
  options?: string[];
}

export default function Settings(): JSX.Element {
  const [settings, setSettings] = useState<SettingItem[]>([
    {
      id: "auto-backup",
      label: "Auto Backup",
      description: "Automatically backup database daily",
      value: true,
      type: "toggle",
    },
    {
      id: "backup-time",
      label: "Backup Time",
      description: "Time to run daily backups",
      value: "02:00",
      type: "text",
    },
    {
      id: "log-level",
      label: "Log Level",
      description: "Server log level",
      value: "INFO",
      type: "select",
      options: ["DEBUG", "INFO", "WARNING", "ERROR"],
    },
    {
      id: "max-players",
      label: "Max Players",
      description: "Maximum concurrent players",
      value: "100",
      type: "text",
    },
  ]);

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

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6 text-green-400">Settings</h2>

      <div className="max-w-2xl space-y-6">
        {settings.map((setting) => (
          <div
            key={setting.id}
            className="bg-gray-800 p-6 rounded border border-gray-700"
          >
            <div className="flex items-center justify-between mb-2">
              <label className="text-lg font-semibold text-green-400">
                {setting.label}
              </label>
              {setting.type === "toggle" && (
                <button
                  onClick={() => handleChange(setting.id, !setting.value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    setting.value ? "bg-green-600" : "bg-gray-700"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      setting.value ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              )}
            </div>
            <p className="text-gray-400 text-sm mb-4">{setting.description}</p>

            {setting.type === "text" && (
              <input
                type="text"
                value={setting.value as string}
                onChange={(e) => handleChange(setting.id, e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-green-400 focus:outline-none focus:border-green-400"
              />
            )}

            {setting.type === "select" && (
              <select
                value={setting.value as string}
                onChange={(e) => handleChange(setting.id, e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-green-400 focus:outline-none focus:border-green-400"
              >
                {setting.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
          </div>
        ))}
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
