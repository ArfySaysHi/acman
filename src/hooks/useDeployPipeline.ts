import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

export type StepStatus = "pending" | "active" | "done" | "error";

export interface PipelineStep {
  name: string;
  status: StepStatus;
}

const STEPS = [
  "Pack MPQ",
  "Deploy Noggit Project To Client",
  "Deploy Map Dbc To Server",
  "Restart Worldserver",
];

export default function useDeployPipeline() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>(
    STEPS.map((name) => ({ name, status: "pending" })),
  );

  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => unlistenRef.current?.();
  }, []);

  const reset = () => {
    setSteps(STEPS.map((name) => ({ name, status: "pending" })));
    setError(null);
  };

  const run = async (projectName: string, patchName: string) => {
    if (running) return;
    reset();
    setRunning(true);

    unlistenRef.current = await listen<string>("deploy_progress", (event) => {
      setSteps((prev) =>
        prev.map((step, i) => {
          if (step.name === event.payload) return { ...step, status: "active" };
          if (prev[i + 1]?.name === event.payload && step.status === "active")
            return { ...step, status: "done" };
          return step;
        }),
      );
    });

    try {
      await invoke("deploy_noggit_project", { projectName, patchName });
      setSteps((prev) =>
        prev.map((s) => ({ ...s, status: s.status === "pending" ? "pending" : "done" })),
      );
    } catch (err) {
      setError(`${err}`);
      setSteps((prev) => prev.map((s) => (s.status === "active" ? { ...s, status: "error" } : s)));
    } finally {
      unlistenRef.current?.();
      setRunning(false);
    }
  };

  return { steps, running, error, run };
}
