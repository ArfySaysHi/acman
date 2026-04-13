import { invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { useEffect, useRef, useState } from "react";
import { MpqMetadataMap, ZMpqMetadataMap } from "../types/zod";

export default function Mpq() {
  const mounted = useRef(false);
  const [mpqs, setMpqs] = useState<MpqMetadataMap>({});
  const [activeMpq, setActiveMpq] = useState<string | null>(null);

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

    refreshMpqs();
  }, []);

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

  const selectPath = async () => {
    try {
      const path = await open({ title: "Select an MPQ" });
      const id = await invoke("open_mpq", { path });

      if (typeof id !== "number")
        return console.error("Non-number value returned");

      refreshMpqs();
      setActiveMpq(`${id}`);
    } catch (err) {
      console.error("Failed to open MPQ archive:", err);
    }
  };

  const getArchiveData = async (id: string | null) => {
    if (id === null) return;
    const res = await invoke("list_files", { id: Number(id) });
    console.log(res);
  };

  return (
    <div>
      <button className="ayu-btn" onMouseDown={() => getArchiveData(activeMpq)}>
        Test
      </button>
      <div className="ayu-page-header">
        <h2 className="ayu-heading mr-auto">MPQ</h2>
        <button onMouseDown={selectPath} className="ayu-btn ayu-btn-orange">
          Import MPQ
        </button>
      </div>

      <div className="ayu-panel p-2">
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
    </div>
  );
}
