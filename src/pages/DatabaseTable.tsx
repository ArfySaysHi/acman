import { useParams } from "react-router-dom";
import { JSX, useState, useEffect } from "react";
import TableEditor from "../components/tables/TableEditor";
import { TableRow } from "../types";

export default function DatabaseTable(): JSX.Element {
  const { tableName } = useParams<{ tableName: string }>();
  const [data, setData] = useState<TableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadTableData = async () => {
      setLoading(true);
      setError(null);
      try {
        const mockData: TableRow[] = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          value: Math.floor(Math.random() * 1000),
          status: ["active", "inactive", "pending"][Math.floor(Math.random() * 3)],
        }));
        setData(mockData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load table data");
      } finally {
        setLoading(false);
      }
    };
    if (tableName) loadTableData();
  }, [tableName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-ayu-dim text-[12px]">
        Loading…
      </div>
    );
  }

  if (error) {
    return <div className="ayu-error">{error}</div>;
  }

  return (
    <div>
      <div className="ayu-page-header">
        <h2 className="ayu-heading">{tableName}</h2>
        <span className="text-ayu-muted text-[11px]">— {data.length} rows</span>
      </div>
      <TableEditor tableName={tableName || ""} data={data} />
    </div>
  );
}
