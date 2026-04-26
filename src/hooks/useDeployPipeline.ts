import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";

export type StepStatus = "pending" | "active" | "done" | "error";

export interface PipelineStep {
  name: string;
  status: StepStatus;
}

export default function useDeployPipeline() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([]);

  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    reset();
    return () => unlistenRef.current?.();
  }, []);

  const getSteps = async () => {
    const steps = await invoke("get_pipeline_steps");
    if (Array.isArray(steps)) {
      return steps.map((step: string): PipelineStep => ({ name: step, status: "pending" }));
    }
    return [];
  };

  const reset = async () => {
    setSteps(await getSteps());
    setError(null);
  };

  const run = async (projectName: string, patchName: string) => {
    if (running) return;
    await reset();
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
