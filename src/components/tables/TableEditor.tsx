import { useState, useEffect, JSX } from "react";
import TableRow from "./TableRow";
import { TableRow as TableRowType } from "../../types/index";

interface TableEditorProps {
  tableName: string;
  data?: TableRowType[];
}

export default function TableEditor({ tableName, data = [] }: TableEditorProps): JSX.Element {
  const [rows, setRows] = useState<TableRowType[]>(data);
  const [editingId, setEditingId] = useState<string | number | null>(null);
  const [editValues, setEditValues] = useState<Partial<TableRowType>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setRows(data); }, [data]);

  const columns = data.length > 0 ? Object.keys(data[0]).filter((k) => k !== "id") : [];

  const handleEdit = (rowId: string | number, row: TableRowType) => {
    setEditingId(rowId);
    setEditValues({ ...row });
  };

  const handleChange = (column: string, value: string | number | boolean) => {
    setEditValues((prev) => ({ ...prev, [column]: value }));
  };

  const handleSave = async (rowId: string | number) => {
    setLoading(true);
    setError(null);
    try {
      setRows((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, ...editValues } : row) as TableRowType)
      );
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => { setEditingId(null); setEditValues({}); };

  const handleDelete = async (rowId: string | number) => {
    if (!window.confirm("Delete this row?")) return;
    setLoading(true);
    setError(null);
    try {
      setRows((prev) => prev.filter((row) => row.id !== rowId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRow = () => {
    const newRow: TableRowType = { id: Date.now() };
    columns.forEach((col) => { newRow[col] = ""; });
    setRows((prev) => [...prev, newRow]);
    handleEdit(newRow.id, newRow);
  };

  if (columns.length === 0) {
    return <div className="text-ayu-dim text-[12px]">No data available</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <div className="ayu-error">{error}</div>}

      <div>
        <button onClick={handleAddRow} className="ayu-btn ayu-btn-green ayu-btn-md">
          + Add Row
        </button>
      </div>

      <div className="ayu-panel overflow-x-auto">
        <table className="ayu-table">
          <thead>
            <tr>
              {columns.map((col) => <th key={col}>{col}</th>)}
              <th className="actions">Actions</th>
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
