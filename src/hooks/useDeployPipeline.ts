import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { useEffect, useRef, useState } from "react";
import { useToast } from "../context/ToastContext";

export type StepStatus = "pending" | "active" | "done" | "error";

export interface PipelineStep {
  name: string;
  status: StepStatus;
}

interface StepProgress {
  name: string;
  status: StepStatus;
}

export default function useDeployPipeline() {
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [steps, setSteps] = useState<PipelineStep[]>([]);

  const { push } = useToast();
  const unlistenRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    reset().catch((err) => push(`Failed to reset on mount: ${err}`, "error"));
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

    unlistenRef.current = await listen<StepProgress>("deploy_progress", (event) => {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.name === event.payload.name) return { ...step, status: event.payload.status };
          return step;
        }),
      );
    });

    try {
      await invoke("deploy_noggit_project", { projectName, patchName });
    } catch (err) {
      setError(`${err}`);
    } finally {
      unlistenRef.current?.();
      setRunning(false);
    }
  };

  return { steps, running, error, run };
}
