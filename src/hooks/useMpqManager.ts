import { useEffect, useState, useRef } from "react";
import {
  MpqMetadataMap,
  FileEntry,
  ZMpqMetadataMap,
  ViewEntry,
} from "../types/zod";
import { invoke } from "@tauri-apps/api/core";
import {
  getNameFromPath,
  joinPath,
  mergeFiles,
  pathsToMpqFiles,
  pathToMpqFile,
  windowsify,
} from "../helpers/mpqHelper";

export default function useMpqManager() {
  const [mpqs, setMpqs] = useState<MpqMetadataMap>({});
  const [activeMpq, setActiveMpq] = useState<string | null>(null);
  const [fileCache, setFileCache] = useState<Record<string, FileEntry[]>>({});
  const [loading, setLoading] = useState(false);
  const [archivePath, setArchivePath] = useState<string>("/");

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

  const createMpq = async () => {
    try {
      const id = await invoke("create_mpq");
      await refresh();
      setActiveMpq(`${id}`);
    } catch (err) {
      console.error("Failed to create MPQ:", err);
    }
  };

  const openMpq = async (path: string) => {
    const id = await invoke("open_mpq", { path });
    setActiveMpq(`${id}`);
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
    setArchivePath("/");
  };

  const fetchFiles = async (id: string, force = false) => {
    if (!force && fileCache[id]) return;

    setLoading(true);
    try {
      const res = await invoke("list_files", { id: Number(id) });
      console.log("from backend:", res);
      setFileCache((prev) => ({ ...prev, [id]: res as FileEntry[] }));
    } finally {
      setLoading(false);
    }
  };

  const addFile = async (path: string) => {
    const id = activeMpqRef.current;
    if (!id) return;
    const filename = getNameFromPath(path).trim();
    const formatted = windowsify(joinPath(archivePath, filename));
    const file = pathToMpqFile(formatted);

    setFileCache((prev) => ({
      ...prev,
      [id]: mergeFiles(prev[id] || [], [file]),
    }));

    invoke("add_file", {
      id: Number(id),
      path,
      archivePath: formatted,
    }).catch((err) => {
      console.error("Failed to add file:", err);
      setFileCache((prev) => ({
        ...prev,
        [id]: (prev[id] || []).filter((fe) => fe.name !== formatted),
      }));
    });
  };

  const addFiles = async (paths: string[]) => {
    const id = activeMpqRef.current;
    if (!id) return;

    const filePaths = paths.map((p) =>
      windowsify(joinPath(archivePath, getNameFromPath(p).trim())),
    );

    const optimisticFiles: FileEntry[] = pathsToMpqFiles(filePaths);

    try {
      setFileCache((p) => ({
        ...p,
        [id]: mergeFiles(p[id] || [], optimisticFiles),
      }));
      invoke("add_files", {
        id: Number(id),
        paths,
        archivePaths: filePaths,
      }).catch((err) => {
        console.error("Failed to add_files, reverting optimistic update", err);
        setFileCache((prev) => {
          const existing = prev[id] || [];

          const rollback = existing.filter(
            (fe) => !optimisticFiles.some((opt) => opt.name === fe.name),
          );

          return { ...prev, [id]: rollback };
        });
      });
    } catch (err) {
      console.error("Failed to add files:", err);
    }
  };

  const createDir = async (path: string) => {
    const id = activeMpqRef.current;
    if (!id) return console.error("No MPQ open");

    const fullPath = joinPath(archivePath, path);
    const name = fullPath + "\\";
    const file = pathToMpqFile(name);

    setFileCache((p) => ({
      ...p,
      [id]: mergeFiles(p[id] || [], [file]),
    }));
  };

  const renameEntry = async (file: ViewEntry, name: string) => {
    const id = activeMpqRef.current;
    if (!id) return console.error("No MPQ open");

    const oldName = joinPath(archivePath, file.name);
    const newName = joinPath(archivePath, name);
    const oldPrefix = windowsify(oldName);
    const newPrefix = windowsify(newName);

    if (fileCache[id].some((f) => f.name === newName)) {
      return console.error("File already named present:", newName);
    }

    const oldCache = [...fileCache[id]];
    const newCache = (fileCache[id] || []).map((entry) => {
      if (entry.name.startsWith(oldPrefix))
        return { ...entry, name: entry.name.replace(oldPrefix, newPrefix) };
      else return entry;
    });

    setFileCache((prev) => ({ ...prev, [id]: newCache }));

    if (file.kind === "file")
      invoke("rename_file", {
        id: Number(id),
        oldName,
        newName,
      }).catch((err) => {
        console.log("Failed to rename file", err);
        setFileCache((prev) => ({ ...prev, [id]: [...oldCache] }));
      });
  };

  const normalize = (s: string) => s.replace(/\//g, "\\");

  const resolveFilesToDelete = (
    entry: ViewEntry,
    cache: FileEntry[],
  ): string[] => {
    const filePath = normalize(windowsify(joinPath(archivePath, entry.name)));

    if (entry.kind === "dir") {
      const prefix = filePath.endsWith("\\") ? filePath : filePath + "\\";
      return cache
        .filter((fe) => normalize(fe.name).startsWith(prefix))
        .map((fe) => fe.name);
    } else {
      const cached = cache.find((fe) => normalize(fe.name) === filePath);
      return cached ? [cached.name] : [filePath];
    }
  };

  const deleteEntry = async (entry: ViewEntry) => {
    await deleteEntries([entry]);
  };

  const deleteEntries = async (entries: ViewEntry[]) => {
    const id = activeMpqRef.current;
    if (!id) return console.error("No MPQ open");

    const oldCache = fileCache[id] || [];

    const allFilesToDelete = new Set<string>();
    for (const entry of entries) {
      for (const path of resolveFilesToDelete(entry, oldCache)) {
        allFilesToDelete.add(path);
      }
    }

    const normalizedToDelete = new Set([...allFilesToDelete].map(normalize));
    const newCache = oldCache.filter(
      (fe) => !normalizedToDelete.has(normalize(fe.name)),
    );

    setFileCache((prev) => ({ ...prev, [id]: newCache }));

    try {
      await invoke("delete_files", {
        id: Number(id),
        paths: [...allFilesToDelete],
      });
    } catch (err) {
      console.error("Failed to delete entries, rolling back:", err);
      setFileCache((prev) => ({ ...prev, [id]: oldCache }));
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
    addFiles,
    archivePath,
    setArchivePath,
    createMpq,
    createDir,
    renameEntry,
    deleteEntry,
    deleteEntries,
  };
}
