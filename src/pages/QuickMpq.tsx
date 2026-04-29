import { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ProjectDropdown from "../components/dropdowns/ProjectDropdown";
import useDeployPipeline from "../hooks/useDeployPipeline";
import { useToast } from "../context/ToastContext";

const STATUS_ICON: Record<string, string> = {
  pending: "○",
  active: "◉",
  done: "✓",
  error: "✕",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "text-ayu-dim",
  active: "text-ayu-orange",
  done: "text-ayu-green",
  error: "text-red-400",
};

export default function QuickMpq() {
  const [projects, setProjects] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const { steps, running, error, run } = useDeployPipeline();
  const { push } = useToast();

  useEffect(() => {
    invoke<string[]>("get_noggit_projects")
      .then((p) => {
        setProjects(p);
        if (p.length > 0) setSelected(p[0]);
      })
      .catch((err) => push(`Failed to get list of Noggit projects: ${err}`));
  }, []);

  const allDone = steps.every((s) => s.status === "done");

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
            disabled={running}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          {steps.map((step) => (
            <div
              key={step.name}
              className={`flex items-center gap-2 text-[11px] ${STATUS_COLOR[step.status]}`}
            >
              <span>{STATUS_ICON[step.status]}</span>
              <span>{step.name}</span>
            </div>
          ))}
        </div>

        {error && <div className="text-red-400 text-[11px] wrap-break-words">{error}</div>}

        <button
          onMouseDown={() => selected && run(selected, "patch-9.mpq")}
          disabled={!selected || running}
          className={`ayu-btn ayu-btn-md ${allDone ? "ayu-btn-green" : "ayu-btn-orange"}`}
        >
          {running ? "Deploying…" : allDone ? "✓ Done" : "Deploy"}
        </button>
      </div>
    </div>
  );
}
