import { invoke } from "@tauri-apps/api/core";
import { useEffect, useState } from "react";
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

export default function useDbcData({ id, path }: UseDbcDataProps) {
  const [data, setData] = useState<DbcResponse | null>(null);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const { push } = useToast();

  useEffect(() => {
    setLoading(true);
    setFilter("");

    invoke<DbcResponse>("read_dbc", { id, path })
      .then(setData)
      .catch((err) => push(`Failed to read dbc file: ${err}`, "error"))
      .finally(() => setLoading(false));
  }, [id, path]);

  const filteredRows =
    data && filter.trim()
      ? data.rows.filter((row) =>
          row.some((cell) => String(cell).toLowerCase().includes(filter.toLowerCase())),
        )
      : (data?.rows ?? []);

  return { data, filter, setFilter, filteredRows, loading };
}
