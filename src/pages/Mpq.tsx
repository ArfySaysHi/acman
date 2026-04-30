import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useMemo, useState } from "react";
import { ViewEntry } from "../types/types";
import FileExplorer from "../components/mpq/FileExplorer";
import useMpqManager from "../hooks/useMpqManager";
import useDragDrop from "../hooks/useDragDrop";
import { filterEntries, joinPath, trimPath, windowsify } from "../helpers/mpqHelper";
import InputModal from "../components/modals/InputModal";
import DbcViewer from "../components/mpq/DbcViewer";
import { useToast } from "../context/ToastContext";

export default function Mpq() {
  const mpq = useMpqManager();
  useDragDrop(mpq);

  const [modal, setModal] = useState<string | null>(null);
  const [openDbc, setOpenDbc] = useState<string | null>(null);
  const [selected, setSelected] = useState<ViewEntry[]>([]);

  const { push } = useToast();

  const visibleEntries = useMemo<ViewEntry[]>(() => {
    if (!mpq.activeMpq) return [];
    return filterEntries(mpq.fileCache[mpq.activeMpq] ?? [], mpq.archivePath);
  }, [mpq.activeMpq, mpq.archivePath, mpq.fileCache]);

  useEffect(() => {
    if (mpq.activeMpq) {
      mpq.setArchivePath("/");
      mpq.fetchFiles(mpq.activeMpq);
    }
  }, [mpq.activeMpq]);

  useEffect(() => {
    setSelected([]);
  }, [mpq.archivePath]);

  const selectPath = async () => {
    try {
      const paths: string[] | null = await open({
        title: "Select an MPQ",
        multiple: true,
      });

      if (!paths || paths.length === 0) return push("You must select at least one file", "info");

      await mpq.openBulkMpqs(paths);
    } catch (err) {
      push(`Failed to open MPQ archive: ${err}`, "error");
    }
  };

  const navigate = (segment: string) => mpq.setArchivePath((p) => joinPath(p, segment));
  const navigateTo = (idx: number) => mpq.setArchivePath((p) => trimPath(p, idx));

  const mpqsOpen = Object.keys(mpq.mpqs).length > 0;

  const selectRow = (e: React.MouseEvent, viewEntry: ViewEntry) => {
    const isPresent = selected.some((ve) => ve.name === viewEntry.name);

    const filterVe = () => setSelected((prev) => prev.filter((ve) => ve.name !== viewEntry.name));
    const addVe = () => setSelected((prev) => [...prev, viewEntry]);

    if (e.ctrlKey) {
      if (isPresent) return filterVe();
      else return addVe();
    }

    if (isPresent && selected.length === 1) setSelected([]);
    else setSelected([viewEntry]);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete") mpq.deleteEntries(selected);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected]);

  const handleExtract = async () => {
    const path = await open({ title: "Select a directory to extract to", directory: true });
    if (!path) return;

    mpq
      .extractFiles(selected, path)
      .then(() => setSelected([]))
      .catch(() => {});
  };

  return (
    <div className="flex flex-col h-full">
      {modal === "mkdir" && (
        <InputModal
          title="Create Directory"
          label="Name"
          hint="Will be created at the current archive path."
          placeholder="e.g. Interface"
          confirmLabel="Create"
          onConfirm={(name) => {
            mpq.createDir(name);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal === "rename" && (
        <InputModal
          title="Rename Entry"
          label="Name"
          confirmLabel="Rename"
          onConfirm={(name) => {
            mpq.renameEntry(selected[0], name);
            setModal(null);
          }}
          onClose={() => setModal(null)}
        />
      )}

      <div className="shrink-0">
        <div className="ayu-page-header">
          <h2 className="ayu-heading mr-auto">MPQ Editor</h2>
          <button onMouseDown={mpq.createMpq} className="ayu-btn ayu-btn-green">
            + Create MPQ
          </button>
          <button onMouseDown={selectPath} className="ayu-btn ayu-btn-orange">
            + Import MPQ
          </button>
        </div>

        {mpqsOpen ? (
          <div className="ayu-muted mb-1">
            Left-click: Open | Right-click: Close | Double-click a .DBC file to view
          </div>
        ) : null}

        <div className="ayu-panel p-2 mb-3" onContextMenu={(e) => e.preventDefault()}>
          {mpqsOpen ? (
            Object.keys(mpq.mpqs).map((k) => (
              <button
                key={k}
                className={`ayu-btn ${mpq.activeMpq === k ? "ayu-btn-orange" : "ayu-btn-ghost"} mr-1`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.button === 2 ? mpq.closeMpq(k) : mpq.setActiveMpq(k);
                }}
              >
                {mpq.mpqs[k].name}
              </button>
            ))
          ) : (
            <div>Use the Create or Import MPQ option to see files.</div>
          )}
        </div>
      </div>

      <div className="flex flex-col min-h-0 gap-3">
        {openDbc && mpq.activeMpq && (
          <div style={{ flex: "1 1 60%", minHeight: 0 }}>
            <DbcViewer
              mpqId={Number(mpq.activeMpq)}
              path={openDbc}
              onClose={() => setOpenDbc(null)}
            />
          </div>
        )}

        <div className="flex flex-col min-h-0">
          <FileExplorer
            data={visibleEntries}
            selected={selected}
            loading={mpq.loading}
            path={mpq.archivePath}
            onDirClick={(val: string) => navigate(val)}
            onCrumbClick={(val: number) => navigateTo(val)}
            onCreateDirClick={() => setModal("mkdir")}
            onRenameDirClick={() => setModal("rename")}
            onExtractClick={handleExtract}
            onRowClick={selectRow}
            onDoubleClick={(entry: ViewEntry) => {
              if (entry.kind === "file" && entry.name.toLowerCase().endsWith(".dbc")) {
                const fullPath = windowsify(joinPath(mpq.archivePath, entry.name));
                setOpenDbc(fullPath);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}
