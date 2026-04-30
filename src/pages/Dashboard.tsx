import { ChangeEvent, JSX, useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import ProjectDropdown from "../components/dropdowns/ProjectDropdown";
import useDeployPipeline from "../hooks/useDeployPipeline";
import { useToast } from "../context/ToastContext";
import { ServerStream } from "../hooks/useStream";

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

interface DashboardProps {
  worldserverSocket: ServerStream;
}

export default function Dashboard({ worldserverSocket }: DashboardProps): JSX.Element {
  const [projects, setProjects] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [patchName, setPatchName] = useState<string>(
    localStorage.getItem("lastPatchName") ?? "patch-9.mpq",
  );
  const { steps, running, error, run } = useDeployPipeline();
  const { push } = useToast();
  const { connected } = worldserverSocket;

  useEffect(() => {
    // TODO: Filter by directories that contain noggitproject files, on the backend
    invoke<string[]>("get_noggit_projects")
      .then((p) => {
        setProjects(p);
        const prevSelected = localStorage.getItem("lastNoggitProject") ?? null;
        if (prevSelected && p.includes(prevSelected)) setSelected(prevSelected);
      })
      .catch((err) => push(`Failed to get list of Noggit projects: ${err}`, "error"));
  }, []);

  const allDone = steps.every((s) => s.status === "done");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPatchName(e.target.value);
    localStorage.setItem("lastPatchName", e.target.value);
  };

  const handleSelect = (option: string) => {
    setSelected(option);
    localStorage.setItem("lastNoggitProject", option);
  };

  return (
    <div className="h-full w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="ayu-page-header ayu-page-header-inline">
          <h2 className="ayu-heading">Dashboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className={connected ? "ayu-dot-connected" : "ayu-dot-disconnected"} />
          <span className="text-ayu-dim text-[11px]">
            {connected ? "connected" : "disconnected"}
          </span>
        </div>
      </div>

      <div className="ayu-panel-alt p-5 max-w-sm flex flex-col gap-4">
        <div>
          <div className="text-ayu-dim text-[10px] uppercase tracking-wider mb-1.5">Patch Name</div>
          <input
            className="ayu-input bg-transparent focus:ring-0 text-[12px] w-full"
            value={patchName}
            onChange={handleChange}
          />
        </div>
        <div>
          <div className="text-ayu-dim text-[10px] uppercase tracking-wider mb-1.5">
            Source folder
          </div>
          <ProjectDropdown
            projects={projects}
            selected={selected}
            onSelect={handleSelect}
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
          onMouseDown={() => selected && run(selected, patchName)}
          disabled={!selected || running}
          className={`ayu-btn ayu-btn-md ${allDone ? "ayu-btn-green" : "ayu-btn-orange"}`}
        >
          {running ? "Deploying…" : allDone ? "✓ Done" : "Deploy"}
        </button>
      </div>
    </div>
  );
}
