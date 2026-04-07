// components/tables/TableEditor.tsx
import { useState, useEffect, JSX } from "react";
import TableRow from "./TableRow";
import { TableRow as TableRowType } from "../../types/index";

interface TableEditorProps {
  tableName: string;
  data?: TableRowType[];
}

export default function TableEditor({
  tableName,
  data = [],
}: TableEditorProps): JSX.Element {
  const [rows, setRows] = useState<TableRowType[]>(data);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editValues, setEditValues] = useState<Partial<TableRowType>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRows(data);
  }, [data]);

  const columns: string[] =
    data.length > 0 ? Object.keys(data[0]).filter((key) => key !== "id") : [];

  const handleEdit = (rowId: string | number, row: TableRowType): void => {
    setEditingId(rowId);
    setEditValues({ ...row });
  };

  const handleChange = (
    column: string,
    value: string | number | boolean,
  ): void => {
    setEditValues((prev: Partial<TableRowType>) => ({
      ...prev,
      [column]: value,
    }));
  };

  const handleSave = async (rowId: string | number): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Replace with your actual API call
      // await invoke("update_database_row", {
      //   table: tableName,
      //   id: rowId,
      //   data: editValues,
      // });

      setRows((prev: TableRowType[]) =>
        prev.map(
          (row) =>
            (row.id === rowId
              ? { ...row, ...editValues }
              : row) as TableRowType,
        ),
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = (): void => {
    setEditingId(null);
    setEditValues({});
  };

  const handleDelete = async (rowId: string | number): Promise<void> => {
    if (!window.confirm("Are you sure you want to delete this row?")) return;

    setLoading(true);
    setError(null);

    try {
      // Replace with your actual API call
      // await invoke("delete_database_row", {
      //   table: tableName,
      //   id: rowId,
      // });

      setRows((prev) => prev.filter((row) => row.id !== rowId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = (): void => {
    const newRow: TableRowType = {
      id: Date.now(),
    };
    columns.forEach((col) => {
      newRow[col] = "";
    });
    setRows((prev) => [...prev, newRow]);
    handleEdit(newRow.id, newRow);
  };

  if (columns.length === 0) {
    return <div className="text-gray-400">No data available</div>;
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-900 bg-opacity-30 border border-red-600 text-red-400 p-3 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleAddRow}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
      >
        + Add Row
      </button>

      <div className="overflow-x-auto border border-gray-700 rounded">
        {tableName}
        <table className="w-full">
          <thead>
            <tr className="bg-gray-800 border-b border-gray-700">
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-sm font-semibold text-green-400"
                >
                  {column}
                </th>
              ))}
              <th className="px-4 py-3 text-left text-sm font-semibold text-green-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <TableRow
                key={row.id || idx}
                row={row}
                columns={columns}
                isEditing={editingId === row.id}
                editValues={editValues}
                onEdit={() => handleEdit(row.id, row)}
                onChange={handleChange}
                onSave={() => handleSave(row.id)}
                onCancel={handleCancel}
                onDelete={() => handleDelete(row.id)}
                loading={loading}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
