import { invoke } from "@tauri-apps/api/core";
import { useEffect, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";

export type DbcValue = number | string;

export interface DbcResponse {
  columns: string[];
  rows: DbcValue[][];
}

export interface UseDbcDataProps {
  id: number;
  path: string;
}

export interface IndexedRow {
  row: DbcValue[];
  originalIdx: number;
}

export default function useDbcData({ id, path }: UseDbcDataProps) {
  const [data, setData] = useState<DbcResponse | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  const loadDbc = async () => {
    setLoading(true);
    try {
      const result = await invoke<DbcResponse>("read_dbc", { id, path });
      setData(result);
    } catch (err) {
      push(String(err), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setData(null);
    setFilter("");
    loadDbc();
  }, [id, path]);

  const filteredRows =
    data && filter.trim()
      ? data.rows.filter((row) =>
          row.some((cell) => String(cell).toLowerCase().includes(filter.toLowerCase())),
        )
      : (data?.rows ?? []);

  const indexedRows = useMemo(
    () =>
      data?.rows
        .map((row, i) => ({ row, originalIdx: i }))
        .filter(
          ({ row }) =>
            !filter.trim() ||
            row.some((cell) => String(cell).toLowerCase().includes(filter.toLowerCase())),
        ) ?? [],
    [data, filter],
  );

  const reload = loadDbc;

  return { data, filter, setFilter, indexedRows, filteredRows, loading, reload };
}
