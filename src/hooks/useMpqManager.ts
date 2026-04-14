import { useEffect, useState, useRef } from "react";
import { MpqMetadataMap, FileEntry, ZMpqMetadataMap } from "../types/zod";
import { invoke } from "@tauri-apps/api/core";
import { getNameFromPath, joinPath, windowsify } from "../helpers/mpqHelper";

export default function useMpqManager(currentArchivePath: string) {
  const [mpqs, setMpqs] = useState<MpqMetadataMap>({});
  const [activeMpq, setActiveMpq] = useState<string | null>(null);
  const [fileCache, setFileCache] = useState<Record<string, FileEntry[]>>({});
  const [loading, setLoading] = useState(false);

  const activeMpqRef = useRef<string | null>(null);
  const mounted = useRef<boolean>(false);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    refresh();
  }, []);

  useEffect(() => {
    activeMpqRef.current = activeMpq;
  }, [activeMpq]);

  const refresh = async () => {
    const res = await invoke("list_mpqs");
    const data = ZMpqMetadataMap.parse(res);
    setMpqs(data);

    if (!activeMpq && Object.keys(data).length > 0)
      setActiveMpq(Object.keys(data)[0]);

    return data;
  };

  const openMpq = async (path: string) => {
    await invoke("open_mpq", { path });
    return refresh();
  };

  const closeMpq = async (id: string) => {
    await invoke("close_mpq", { id: Number(id) });

    setFileCache((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const data = await refresh();
    const keys = Object.keys(data || {});
    setActiveMpq(keys[keys.length - 1] ?? null);
  };

  const fetchFiles = async (id: string, force = false) => {
    if (!force && fileCache[id]) return;

    setLoading(true);
    try {
      const res = await invoke("list_files", { id: Number(id) });
      setFileCache((prev) => ({ ...prev, [id]: res as FileEntry[] }));
    } finally {
      setLoading(false);
    }
  };

  const invalidateCache = (id: string) => {
    setFileCache((p) => {
      const next = { ...p };
      delete next[id];
      return next;
    });
  };

  const addFile = async (path: string) => {
    const id = activeMpqRef.current;
    if (!id) return;
    const filename = getNameFromPath(path).trim();
    const archivePath = windowsify(joinPath(currentArchivePath, filename));

    try {
      await invoke("add_file", { id: Number(id), path, archivePath });
      invalidateCache(id);
      await fetchFiles(id, true);
    } catch (err) {
      console.error("Failed to add file:", err);
    }
  };

  return {
    mpqs,
    activeMpq,
    setActiveMpq,
    fileCache,
    loading,
    refresh,
    openMpq,
    closeMpq,
    fetchFiles,
    addFile,
  };
}
