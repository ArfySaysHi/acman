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
      <tr className="bg-gray-800 border-b border-gray-700">
        {columns.map((column) => (
          <td key={column} className="px-4 py-3">
            <input
              type="text"
              value={editValues[column] ?? ""}
              onChange={(e) => onChange(column, e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-green-400 focus:outline-none focus:border-green-400"
            />
          </td>
        ))}
        <td className="px-4 py-3 space-x-2 flex">
          <button
            onClick={onSave}
            disabled={loading}
            className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
          >
            {loading ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 disabled:opacity-50 text-gray-300 text-sm rounded transition-colors"
          >
            Cancel
          </button>
        </td>
      </tr>
    );
  }

  return (
    <tr className="border-b border-gray-700 hover:bg-gray-800 transition-colors">
      {columns.map((column) => (
        <td key={column} className="px-4 py-3 text-gray-300">
          <span className="block truncate">{row[column]}</span>
        </td>
      ))}
      <td className="px-4 py-3 space-x-2 flex">
        <button
          onClick={onEdit}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors"
        >
          Edit
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="px-3 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm rounded transition-colors"
        >
          Delete
        </button>
      </td>
    </tr>
  );
}
