import { TableRow as TableRowType } from "../../types/index";
import { JSX } from "react";

interface TableRowProps {
  row: TableRowType;
  columns: string[];
  isEditing: boolean;
  editValues: Partial<TableRowType>;
  onEdit: () => void;
  onChange: (column: string, value: string | number | boolean) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onDelete: () => Promise<void>;
  loading: boolean;
}

export default function TableRow({
  row,
  columns,
  isEditing,
  editValues,
  onEdit,
  onChange,
  onSave,
  onCancel,
  onDelete,
  loading,
}: TableRowProps): JSX.Element {
  if (isEditing) {
    return (
      <tr className="editing">
        {columns.map((col) => (
          <td key={col}>
            <input
              type="text"
              value={String(editValues[col] ?? "")}
              onChange={(e) => onChange(col, e.target.value)}
              className="ayu-input w-full"
            />
          </td>
        ))}
        <td>
          <div className="flex items-center gap-1.5">
            <button onClick={onSave} disabled={loading} className="ayu-btn ayu-btn-green">
              {loading ? "…" : "Save"}
            </button>
            <button onClick={onCancel} disabled={loading} className="ayu-btn ayu-btn-ghost">
              Cancel
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr>
      {columns.map((col) => (
        <td key={col}>
          <span className="block truncate text-ayu-fg max-w-[180px]">
            {String(row[col])}
          </span>
        </td>
      ))}
      <td>
        <div className="flex items-center gap-1.5">
          <button onClick={onEdit} className="ayu-btn ayu-btn-cyan">Edit</button>
          <button onClick={onDelete} disabled={loading} className="ayu-btn ayu-btn-red">Delete</button>
        </div>
      </td>
    </tr>
  );
}
