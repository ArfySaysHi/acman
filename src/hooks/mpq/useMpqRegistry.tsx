import { invoke } from "@tauri-apps/api/core";
import { ZMpqMetadataMap } from "../../types";
import type { FileEntry, MpqMetadataMap } from "../../types";
import { useState, Dispatch, SetStateAction } from "react";
import { useToast } from "../../context/ToastContext";

interface UseMpqRegistryProps {
  setArchivePath: Dispatch<SetStateAction<string>>;
  setFileCache: Dispatch<SetStateAction<Record<string, FileEntry[]>>>;
}

const ROOT_PATH = "/";

export default function useMpqRegistry({ setArchivePath, setFileCache }: UseMpqRegistryProps) {
  const [mpqs, setMpqs] = useState<MpqMetadataMap>({});
  const [activeMpq, setActiveMpq] = useState<string | null>(null);
  const { push } = useToast();

  const refresh = async () => {
    try {
      const res = await invoke("list_mpqs");
      const data = ZMpqMetadataMap.parse(res);
      setMpqs(data);

      if (!activeMpq && Object.keys(data).length > 0)
        setActiveMpq((prev) => {
          if (prev) return prev;
          const keys = Object.keys(data);
          return keys.length > 0 ? keys[0] : null;
        });
    } catch (err) {
      push(`Failed to refresh MPQs: ${err}`, "error");
      return {};
    }
  };

  const createMpq = async () => {
    try {
      const id = await invoke("create_mpq");
      const idStr = `${id}`;
      setActiveMpq(idStr);
      await refresh();
    } catch (err) {
      push(`Failed to create MPQ: ${err}`, "error");
    }
  };

  const openMpq = async (path: string) => {
    try {
      const id = await invoke("open_mpq", { path });
      setActiveMpq(`${id}`);
      return refresh();
    } catch (err) {
      push(`Failed to open MPQ: ${err}`, "error");
    }
  };

  const openBulkMpqs = async (paths: string[]) => {
    await Promise.allSettled(
      paths.map(async (path) => {
        const id = await invoke("open_mpq", { path });

        if (typeof id !== "number") return push("Failed to open MPQ, unexpected response", "error");

        return id;
      }),
    );

    await refresh();
  };

  const closeMpq = async (id: string) => {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return push(`Invalid MPQ id: ${id}`, "error");
    try {
      await invoke("close_mpq", { id: Number(id) });

      setFileCache((prev: Record<string, FileEntry[]>) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });

      const data = await refresh();
      if (!data) throw Error("No data from refresh.");

      const keys = Object.keys(data);
      setActiveMpq(keys[keys.length - 1] ?? null);
      setArchivePath(ROOT_PATH);
    } catch (err) {
      push(`Failed to close MPQ: ${err}`, "error");
    }
  };

  return {
    mpqs,
    activeMpq,
    setMpqs,
    setActiveMpq,
    refresh,
    createMpq,
    openMpq,
    openBulkMpqs,
    closeMpq,
  };
}
