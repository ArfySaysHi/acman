export interface TableRow {
  id: number | string;
  [key: string]: string | number | boolean | null | undefined;
}

export interface TableEditorProps {
  tableName: string;
  data?: TableRow[];
  onSave?: (data: TableRow[]) => Promise<void>;
  onDelete?: (rowId: string | number) => Promise<void>;
}

export interface TableRowProps {
  row: TableRow;
  columns: string[];
  isEditing: boolean;
  editValues: Partial<TableRow>;
  onEdit: () => void;
  onChange: (column: string, value: string | number | boolean) => void;
  onSave: () => Promise<void>;
  onCancel: () => void;
  onDelete: () => Promise<void>;
  loading: boolean;
}

export interface StreamData {
  stream: string[];
  connected: boolean;
}

export interface DatabaseTable {
  name: string;
  rows: number;
}

export interface MenuItem {
  label: string;
  icon: string;
  path: string;
}
