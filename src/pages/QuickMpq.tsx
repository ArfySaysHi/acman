import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
import ProjectDropdown from "../components/dropdowns/ProjectDropdown";

export default function QuickMpq() {
  const [converting, setConverting] = useState(false);
  const [done, setDone] = useState(false);
  const [projects, setProjects] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    invoke<string[]>("get_noggit_projects")
      .then((projects) => {
        setProjects(projects);
        if (projects.length > 0) setSelected(projects[0]);
      })
      .catch(console.error);
  }, []);

  const deployToClient = async () => {
    if (converting || !selected) return;
    setConverting(true);
    try {
      await invoke("deploy_to_client", {
        inputDir: selected,
        patchName: "patch-9.mpq",
      });
      setDone(true);
    } catch (err) {
      console.error("Failed to deploy mpq:", err);
    } finally {
      setConverting(false);
    }
  };

  return (
    <div>
      <div className="ayu-page-header">
        <h2 className="ayu-heading">Quick MPQ</h2>
      </div>

      <div className="ayu-panel-alt p-5 max-w-sm flex flex-col gap-4">
        <div>
          <div className="text-ayu-dim text-[10px] uppercase tracking-wider mb-1.5">
            Source folder
          </div>
          <ProjectDropdown
            projects={projects}
            selected={selected}
            onSelect={setSelected}
            disabled={converting}
          />
        </div>

        <div className="flex gap-2">
          <button
            onMouseDown={deployToClient}
            disabled={!selected || converting}
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
