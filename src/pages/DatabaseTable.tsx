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
    const loadTableData = async (): Promise<void> => {
      setLoading(true);
      setError(null);
      try {
        // Replace with your actual API call
        // const result = await invoke("get_table_data", { table: tableName });
        // setData(result);

        // Mock data for demonstration
        const mockData: TableRow[] = Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Item ${i + 1}`,
          value: Math.floor(Math.random() * 1000),
          status: ["active", "inactive", "pending"][
            Math.floor(Math.random() * 3)
          ],
        }));
        setData(mockData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load table data",
        );
        console.error("Failed to load table data:", err);
      } finally {
        setLoading(false);
      }
    };

    if (tableName) {
      loadTableData();
    }
  }, [tableName]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading table data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900 bg-opacity-30 border border-red-600 text-red-400 p-4 rounded">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-green-400">{tableName} Table</h2>
        <span className="text-gray-400">{data.length} rows</span>
      </div>
      <TableEditor tableName={tableName || ""} data={data} />
    </div>
  );
}
