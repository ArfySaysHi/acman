import { useEffect, useState, useRef } from "react";
import { MpqMetadataMap, FileEntry, ZMpqMetadataMap, ViewEntry } from "../types/zod";
import { invoke } from "@tauri-apps/api/core";
import {
  getNameFromPath,
  joinPath,
  mergeFiles,
  pathsToMpqFiles,
  pathToMpqFile,
  windowsify,
} from "../helpers/mpqHelper";
import { useToast } from "../context/ToastContext";

export default function useMpqManager() {
  const [mpqs, setMpqs] = useState<MpqMetadataMap>({});
  const [activeMpq, setActiveMpq] = useState<string | null>(null);
  const [fileCache, setFileCache] = useState<Record<string, FileEntry[]>>({});
  const [loading, setLoading] = useState(false);
  const [archivePath, setArchivePath] = useState<string>("/");

  const activeMpqRef = useRef<string | null>(null);
  const mounted = useRef<boolean>(false);
  const { push } = useToast();
  console.log(fileCache);

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

    if (!activeMpq && Object.keys(data).length > 0) setActiveMpq(Object.keys(data)[0]);

    return data;
  };

  const createMpq = async () => {
    try {
      const id = await invoke("create_mpq");
      await refresh();
      setActiveMpq(`${id}`);
    } catch (err) {
      push(`Failed to create MPQ: ${err}`, "error");
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
      push(`Failed to add file: ${err}`, "error");
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
        push(`Failed to add files, reverting optimistic update: ${err}`, "error");
        setFileCache((prev) => {
          const existing = prev[id] || [];

          const rollback = existing.filter(
            (fe) => !optimisticFiles.some((opt) => opt.name === fe.name),
          );

          return { ...prev, [id]: rollback };
        });
      });
    } catch (err) {
      push(`Failed to add files: ${err}`, "error");
    }
  };

  const extractFiles = async (selected: ViewEntry[], path: string) => {
    const id = activeMpqRef.current;
    if (!id) return;

    let filePaths: string[] = [];
    selected.forEach((entry) => {
      if (entry.kind === "file") filePaths.push(windowsify(joinPath(archivePath, entry.name)));
      else {
        filePaths = [
          ...filePaths,
          ...fileCache[id]
            .filter((fe) => {
              const name = fe.name.toLowerCase();
              const dir = windowsify(joinPath(archivePath, entry.name)).toLowerCase();
              const prefix = dir.endsWith("\\") ? dir : dir + "\\";

              return name.startsWith(prefix);
            })
            .map((fe) => fe.name),
        ];
      }
    });

    await invoke("extract_files", { id: Number(id), path, filePaths }).catch((err) => {
      push(`Failed to extract files: ${err}`, "error");
      throw err;
    });
  };

  const createDir = async (path: string) => {
    const id = activeMpqRef.current;
    if (!id) return push("No MPQ open", "error");

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
    if (!id) return push("No MPQ open", "error");

    const oldName = windowsify(joinPath(archivePath, file.name));
    const newName = windowsify(joinPath(archivePath, name));

    const oldPrefix =
      file.kind === "dir" ? (oldName.endsWith("\\") ? oldName : oldName + "\\") : oldName;
    const newPrefix =
      file.kind === "dir" ? (newName.endsWith("\\") ? newName : newName + "\\") : newName;

    if (fileCache[id].some((f) => f.name === newName))
      return push(`File already exists: ${newName}`, "error");

    const oldCache = [...fileCache[id]];
    const newCache = (fileCache[id] || []).map((entry) => {
      if (entry.name.startsWith(oldPrefix))
        return { ...entry, name: entry.name.replace(oldPrefix, newPrefix) };
      else return entry;
    });

    setFileCache((prev) => ({ ...prev, [id]: newCache }));

    invoke("rename_dir", {
      id: Number(id),
      oldPrefix,
      newPrefix,
    }).catch((err) => {
      push(`Failed to rename entry: ${err}`, "error");
      setFileCache((prev) => ({ ...prev, [id]: [...oldCache] }));
    });
  };

  const resolveFilesToDelete = (entry: ViewEntry, cache: FileEntry[]): string[] => {
    const filePath = windowsify(joinPath(archivePath, entry.name));

    if (entry.kind === "dir") {
      const prefix = filePath.endsWith("\\") ? filePath : filePath + "\\";
      return cache.filter((fe) => windowsify(fe.name).startsWith(prefix)).map((fe) => fe.name);
    } else {
      const cached = cache.find((fe) => windowsify(fe.name) === filePath);
      return cached ? [cached.name] : [filePath];
    }
  };

  const deleteEntry = async (entry: ViewEntry) => {
    await deleteEntries([entry]);
  };

  const deleteEntries = async (entries: ViewEntry[]) => {
    if (entries.length === 0) return push("Please select entries before deleting", "info");

    const id = activeMpqRef.current;
    if (!id) return push("No MPQ open", "error");

    const oldCache = fileCache[id] || [];

    const allFilesToDelete = new Set<string>();
    for (const entry of entries) {
      for (const path of resolveFilesToDelete(entry, oldCache)) {
        allFilesToDelete.add(path);
      }
    }

    const normalizedToDelete = new Set([...allFilesToDelete].map(windowsify));
    const newCache = oldCache.filter((fe) => !normalizedToDelete.has(windowsify(fe.name)));

    setFileCache((prev) => ({ ...prev, [id]: newCache }));

    try {
      await invoke("delete_files", {
        id: Number(id),
        paths: [...allFilesToDelete],
      });
    } catch (err) {
      push(`Failed to delete entries, rolling back: ${err}`, "error");
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
    extractFiles,
  };
}
