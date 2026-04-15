import * as z from "zod";

export const ZFileEntry = z.object({
  name: z.string(),
  size: z.number(),
  compressed_size: z.number(),
  flags: z.number(),
  hashes: z.tuple([z.number(), z.number()]).nullable(),
  table_indices: z.tuple([z.number(), z.number().nullable()]).nullable(),
});

export const ZFileEntryMap = z.record(z.string(), ZFileEntry);
export const ZFileEntryArr = z.array(ZFileEntry);

export const ZMpqMetadata = z.object({
  path: z.string(),
  name: z.string(),
  dirty: z.boolean(),
});

export const ZMpqMetadataMap = z.record(z.string(), ZMpqMetadata);

export type FileEntry = z.infer<typeof ZFileEntry>;
export type FileEntryMap = z.infer<typeof ZFileEntryMap>;
export type FileEntryArr = z.infer<typeof ZFileEntryArr>;
export type MpqMetadata = z.infer<typeof ZMpqMetadata>;
export type MpqMetadataMap = z.infer<typeof ZMpqMetadataMap>;

export type ViewEntry =
  | { kind: "dir"; name: string }
  | { kind: "file"; name: string; entry: FileEntry };

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
