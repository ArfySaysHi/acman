import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MpqMetadataMap,
  ZMpqMetadataMap,
  ViewEntry,
  FileEntry,
} from "../types/zod";
import FileExplorer from "../components/mpq/FileExplorer";

function toPrefix(path: string): string {
  return path === "/"
    ? ""
    : path.replace(/^\//, "").replace(/\//g, "\\") + "\\";
}

function joinPath(current: string, segment: string): string {
  return current === "/" ? `/${segment}` : `${current}/${segment}`;
}

function trimPath(current: string, crumbIndex: number): string {
  if (crumbIndex === -1) return "/";
  const parts = current.replace(/^\//, "").split("/").filter(Boolean);
  return "/" + parts.slice(0, crumbIndex + 1).join("/");
}

function filterEntries(files: FileEntry[], path: string): ViewEntry[] {
  const prefix = toPrefix(path);
  const seen = new Set<string>();
  const result: ViewEntry[] = [];

  for (const file of files) {
    const norm = file.name.replace(/\//g, "\\");
    if (!norm.startsWith(prefix)) continue;

    const remainder = norm.slice(prefix.length);
    const sepIdx = remainder.indexOf("\\");

    if (sepIdx === -1) {
      result.push({ kind: "file", name: remainder, entry: file });
    } else {
      const dirName = remainder.slice(0, sepIdx);
      if (!seen.has(dirName)) {
        seen.add(dirName);
        result.push({ kind: "dir", name: dirName });
      }
    }
  }
  return [
    ...result
      .filter((e) => e.kind === "dir")
      .sort((a, b) => a.name.localeCompare(b.name)),
    ...result
      .filter((e) => e.kind === "file")
      .sort((a, b) => a.name.localeCompare(b.name)),
  ];
}

export default function Mpq() {
  const mounted = useRef(false);
  const [mpqs, setMpqs] = useState<MpqMetadataMap>({});
  const [activeMpq, setActiveMpq] = useState<string | null>(null);
  const [fileCache, setFileCache] = useState<Record<string, FileEntry[]>>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [path, setPath] = useState<string>("/");

  const visibleEntries = useMemo<ViewEntry[]>(() => {
    if (!activeMpq) return [];
    return filterEntries(fileCache[activeMpq] ?? [], path);
  }, [activeMpq, path, fileCache]);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    refreshMpqs();
  }, []);

  useEffect(() => {
    setPath("/");
    fetchFiles(activeMpq);
  }, [activeMpq]);

  const refreshMpqs = async () => {
    try {
      const res = await invoke("list_mpqs");
      const data = ZMpqMetadataMap.parse(res);
      setMpqs(data);
      const keys = Object.keys(data);
      if (keys.length > 0 && activeMpq === null) setActiveMpq(keys[0]);
    } catch (err) {
      console.error("Failed to refresh MPQs:", err);
    }
  };

  const fetchFiles = async (id: string | null) => {
    if (id === null) return;
    if (fileCache[id]) return; // cache hit — nothing to do
    setLoading(true);
    try {
      const res = await invoke("list_files", { id: Number(id) });
      setFileCache((prev) => ({ ...prev, [id]: res as FileEntry[] }));
    } catch (err) {
      console.error("Failed to retrieve archive data:", err);
    } finally {
      setLoading(false);
    }
  };

  const selectPath = async () => {
    try {
      const filePath = await open({ title: "Select an MPQ" });
      const id = await invoke("open_mpq", { path: filePath });
      if (typeof id !== "number")
        return console.error("Non-number value returned");
      await refreshMpqs();
      setActiveMpq(`${id}`);
    } catch (err) {
      console.error("Failed to open MPQ archive:", err);
    }
  };

  const navigate = (segment: string) => setPath((p) => joinPath(p, segment));
  const navigateTo = (idx: number) => setPath((p) => trimPath(p, idx));

  return (
    <div>
      <div className="ayu-page-header">
        <h2 className="ayu-heading mr-auto">MPQ Editor</h2>
        <button onMouseDown={selectPath} className="ayu-btn ayu-btn-orange">
          + Import MPQ
        </button>
      </div>

      <div className="ayu-panel p-2 mb-4">
        {Object.keys(mpqs).map((k) => (
          <button
            key={k}
            className={`ayu-btn ${activeMpq === k ? "ayu-btn-orange" : "ayu-btn-ghost"}`}
            onMouseDown={() => setActiveMpq(k)}
          >
            {mpqs[k].name}
          </button>
        ))}
      </div>

      <FileExplorer
        data={visibleEntries}
        loading={loading}
        path={path}
        onDirClick={(val: string) => navigate(val)}
        onCrumbClick={(val: number) => navigateTo(val)}
      />
    </div>
  );
}
