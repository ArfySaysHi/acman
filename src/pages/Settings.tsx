import { useState, JSX, useEffect } from "react";
import { open } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { useToast } from "../context/ToastContext";

interface Settings {
  client_path?: string;
  output_path?: string;
  noggit_projects_path?: string;
  server_path?: string;
}

function PathField({
  label,
  description,
  value,
  onPick,
}: {
  label: string;
  description: string;
  value?: string;
  onPick: () => void;
}) {
  return (
    <div className="ayu-panel p-4">
      <div className="text-ayu-orange text-[11px] font-semibold mb-0.5">{label}</div>
      <div className="text-ayu-dim text-[11px] mb-3">{description}</div>
      <div className="flex items-center gap-2">
        <div className={`ayu-path flex-1 ${value ? "" : "empty"}`}>
          {value ?? "No path selected…"}
        </div>
        <button onMouseDown={onPick} className="ayu-btn ayu-btn-ghost ayu-btn-md shrink-0">
          Browse
        </button>
      </div>
    </div>
  );
}

export default function Settings(): JSX.Element {
  const [settings, setSettings] = useState<Settings>({});
  const [saved, setSaved] = useState(false);
  const { push } = useToast();

  useEffect(() => {
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

  const pickNoggitPath = async () => {
    const path = await open({
      directory: true,
      title: "Pick the folder that contains Noggit project folders",
    });
    if (path) setSettings((prev) => ({ ...prev, noggit_projects_path: path }));
  };

  const pickServerPath = async () => {
    const path = await open({
      directory: true,
      title: "Pick the folder that contains server data",
    });
    if (path) setSettings((prev) => ({ ...prev, server_path: path }));
  };

  const handleSave = async () => {
    try {
      await invoke("save_settings", { newSettings: settings });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      push(`Failed to save settings: ${err}`, "error");
    }
  };

  const handleLoad = async () => {
    try {
      setSettings(JSON.parse(await invoke("load_settings")));
    } catch (err) {
      push(`Failed to load settings: ${err}`, "error");
    }
  };

  return (
    <div>
      <div className="ayu-page-header">
        <h2 className="ayu-heading">Settings</h2>
      </div>

      <div className="max-w-xl flex flex-col gap-2">
        <PathField
          label="WoW Client Path"
          description="Path to your unmodified 3.3.5a client directory. Used as the base for DBC extraction and patch output."
          value={settings.client_path}
          onPick={pickClientPath}
        />
        <PathField
          label="Patch Output Directory"
          description="Where .MPQ files will be written."
          value={settings.output_path}
          onPick={pickOutputPath}
        />
        <PathField
          label="Noggit Red Projects Path"
          description="Where noggit-red project folders are stored."
          value={settings.noggit_projects_path}
          onPick={pickNoggitPath}
        />
        <PathField
          label="Server Data Path"
          description="Where the ./azerothcore-wotlk folder or equivalent is stored."
          value={settings.server_path}
          onPick={pickServerPath}
        />

        <div className="mt-2">
          <button
            onClick={handleSave}
            className={`ayu-btn ayu-btn-md ${saved ? "ayu-btn-green" : "ayu-btn-orange"}`}
          >
            {saved ? "✓ Saved" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
