import { useState } from "react";
import { FileEntry, ViewEntry } from "../../types";
import { useToast } from "../../context/ToastContext";
import {
  getNameFromPath,
  joinPath,
  mergeFiles,
  pathsToMpqFiles,
  pathToMpqFile,
  windowsify,
} from "../../helpers/mpqHelper";
import { invoke } from "@tauri-apps/api/core";

interface UseMpqFileCacheProps {
  activeMpqRef: React.RefObject<string | null>;
}

export default function useMpqFileCache({ activeMpqRef }: UseMpqFileCacheProps) {
  const [fileCache, setFileCache] = useState<Record<string, FileEntry[]>>({});
  const [archivePath, setArchivePath] = useState<string>("/");
  const [loading, setLoading] = useState(false);
  const { push } = useToast();

  const getId = () => activeMpqRef.current;
  const toArchivePath = (base: string, name: string) => windowsify(joinPath(base, name));

  const resolveFilesToDelete = (entry: ViewEntry, cache: FileEntry[]): string[] => {
    const filePath = toArchivePath(archivePath, entry.name);

    if (entry.kind === "dir") {
      const prefix = filePath.endsWith("\\") ? filePath : filePath + "\\";
      return cache.filter((fe) => windowsify(fe.name).startsWith(prefix)).map((fe) => fe.name);
    } else {
      const cached = cache.find((fe) => windowsify(fe.name) === filePath);
      return cached ? [cached.name] : [filePath];
    }
  };

  const fetchFiles = async (id: string, force = false) => {
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return push(`Invalid MPQ id: ${id}`, "error");
    if (!force && fileCache[id]) return;

    setLoading(true);
    try {
      const res = await invoke("list_files", { id: Number(id) });
      setFileCache((prev) => ({ ...prev, [id]: res as FileEntry[] }));
    } catch (err) {
      push(`Failed to list files: ${err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const addFiles = async (paths: string[]) => {
    const id = getId();
    if (!id) return;

    const filePaths = paths.map((p) => toArchivePath(archivePath, getNameFromPath(p).trim()));
    const optimisticFiles: FileEntry[] = pathsToMpqFiles(filePaths);

    setFileCache((p) => ({
      ...p,
      [id]: mergeFiles(p[id] || [], optimisticFiles),
    }));

    await invoke("add_files", {
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
  };

  const extractFiles = async (selected: ViewEntry[], path: string) => {
    const id = getId();
    if (!id) return;
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return push(`Invalid MPQ id: ${id}`, "error");

    let filePaths: string[] = [];
    selected.forEach((entry) => {
      if (entry.kind === "file") filePaths.push(toArchivePath(archivePath, entry.name));
      else {
        filePaths = [
          ...filePaths,
          ...fileCache[id]
            .filter((fe) => {
              const name = fe.name.toLowerCase();
              const dir = toArchivePath(archivePath, entry.name).toLowerCase();
              const prefix = dir.endsWith("\\") ? dir : dir + "\\";

              return name.startsWith(prefix);
            })
            .map((fe) => fe.name),
        ];
      }
    });

    await invoke("extract_files", { id: numericId, path, filePaths }).catch((err) => {
      push(`Failed to extract files: ${err}`, "error");
      throw err;
    });
  };

  const createDir = async (path: string) => {
    const id = getId();
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
    const id = getId();
    if (!id) return push("No MPQ open", "error");
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return push(`Invalid MPQ id: ${id}`, "error");

    const cache = fileCache[id] || [];
    const oldName = toArchivePath(archivePath, file.name);
    const newName = toArchivePath(archivePath, name);

    const oldPrefix =
      file.kind === "dir" ? (oldName.endsWith("\\") ? oldName : oldName + "\\") : oldName;
    const newPrefix =
      file.kind === "dir" ? (newName.endsWith("\\") ? newName : newName + "\\") : newName;

    const collision =
      file.kind === "dir"
        ? cache.some((f) => f.name.startsWith(newPrefix))
        : cache.some((f) => f.name === newName);

    if (collision) return push(`Entry already exists: ${newName}`, "error");

    const oldCache = [...cache];
    const newCache = cache.map((entry) => {
      if (entry.name.startsWith(oldPrefix))
        return { ...entry, name: entry.name.replace(oldPrefix, newPrefix) };
      else return entry;
    });

    setFileCache((prev) => ({ ...prev, [id]: newCache }));

    invoke("rename_dir", {
      id: numericId,
      oldPrefix,
      newPrefix,
    }).catch((err) => {
      push(`Failed to rename entry: ${err}`, "error");
      setFileCache((prev) => ({ ...prev, [id]: [...oldCache] }));
    });
  };

  const deleteEntries = async (entries: ViewEntry[]) => {
    if (entries.length === 0) return push("Please select entries before deleting", "info");
    const id = getId();
    if (!id) return push("No MPQ open", "error");
    const numericId = Number(id);
    if (Number.isNaN(numericId)) return push(`Invalid MPQ id: ${id}`, "error");

    const cache = fileCache[id] || [];

    const allFilesToDelete = new Set<string>();
    for (const entry of entries) {
      for (const path of resolveFilesToDelete(entry, cache)) {
        allFilesToDelete.add(path);
      }
    }

    const normalizedToDelete = new Set([...allFilesToDelete].map(windowsify));
    const newCache = cache.filter((fe) => !normalizedToDelete.has(windowsify(fe.name)));

    setFileCache((prev) => ({ ...prev, [id]: newCache }));

    try {
      await invoke("delete_files", {
        id: numericId,
        paths: [...allFilesToDelete],
      });
    } catch (err) {
      push(`Failed to delete entries, rolling back: ${err}`, "error");
      setFileCache((prev) => ({ ...prev, [id]: cache }));
    }
  };

  return {
    fileCache,
    archivePath,
    loading,
    setFileCache,
    setArchivePath,
    setLoading,
    fetchFiles,
    addFiles,
    extractFiles,
    createDir,
    renameEntry,
    deleteEntries,
  };
}
