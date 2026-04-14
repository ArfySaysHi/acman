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
import { getCurrentWebview } from "@tauri-apps/api/webview";

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

    let unlisten: (() => void) | undefined;
    const setupListener = async () => {
      await getCurrentWebview()
        .listen("tauri://drag-drop", async (event) => {
          const { paths } = event.payload as { paths: string[] };

          await Promise.allSettled(
            paths.map(async (path) => {
              if (path.toLowerCase().endsWith(".mpq"))
                await invoke("open_mpq", { path });
            }),
          );

          await refreshMpqs();
        })
        .then((fn) => {
          unlisten = fn;
        });
    };
    refreshMpqs();
    setupListener();

    return () => {
      mounted.current = false;
      if (unlisten) unlisten?.();
    };
  }, []);

  useEffect(() => {
    let keys = Object.keys(mpqs);
    if (activeMpq === null && keys.length > 0) setActiveMpq(keys[0]);
  }, [mpqs]);

  useEffect(() => {
    setPath("/");
    fetchFiles(activeMpq);
  }, [activeMpq]);

  const refreshMpqs = async () => {
    try {
      const res = await invoke("list_mpqs");
      const data = ZMpqMetadataMap.parse(res);
      setMpqs(data);
      setPath("/");
      return data;
    } catch (err) {
      console.error("Failed to refresh MPQs:", err);
    }
  };

  const fetchFiles = async (id: string | null) => {
    if (!id) return;
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
      const paths: string[] | null = await open({
        title: "Select an MPQ",
        multiple: true,
      });

      if (!paths || paths.length === 0) return;

      await Promise.allSettled(
        paths.map(async (path) => {
          const id = await invoke("open_mpq", { path });

          if (typeof id !== "number")
            return console.error("Non-number value returned");

          return id;
        }),
      );

      await refreshMpqs();
    } catch (err) {
      console.error("Failed to open MPQ archive:", err);
    }
  };

  const navigate = (segment: string) => setPath((p) => joinPath(p, segment));
  const navigateTo = (idx: number) => setPath((p) => trimPath(p, idx));

  const closeMpq = async (k: string) => {
    try {
      await invoke("close_mpq", { id: Number(k) });
      const data = await refreshMpqs();
      setFileCache((prev) => {
        let newObj = { ...prev };
        delete newObj[k];
        return newObj;
      });

      if (data) {
        let keys = Object.keys(data);
        setActiveMpq(keys[keys.length - 1]);
      }
    } catch (err) {
      console.error("Failed to close MPQ:", err);
    }
  };

  const mpqsOpen = Object.keys(mpqs).length > 0;

  return (
    <div>
      <div className="ayu-page-header">
        <h2 className="ayu-heading mr-auto">MPQ Editor</h2>
        <button onMouseDown={selectPath} className="ayu-btn ayu-btn-orange">
          + Import MPQ
        </button>
      </div>

      {mpqsOpen ? (
        <div className="ayu-muted mb-1">
          Left-click: Open | Right-click: Close
        </div>
      ) : null}

      <div
        className="ayu-panel p-2 mb-4"
        onContextMenu={(e) => e.preventDefault()}
      >
        {mpqsOpen ? (
          Object.keys(mpqs).map((k) => (
            <button
              key={k}
              className={`ayu-btn ${activeMpq === k ? "ayu-btn-orange" : "ayu-btn-ghost"} mr-1`}
              onMouseDown={(e) => {
                e.preventDefault();
                e.button === 2 ? closeMpq(k) : setActiveMpq(k);
              }}
            >
              {mpqs[k].name}
            </button>
          ))
        ) : (
          <div>Use the Create or Import MPQ option to see files.</div>
        )}
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
