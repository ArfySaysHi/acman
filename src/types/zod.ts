import * as z from "zod";

export const ZFileEntry = z.object({
  name: z.string(),
  size: z.number(),
  compressed_size: z.number(),
  flags: z.number(),
  hashes: z.number().nullable(),
  table_indices: z.array(z.number()).nullable(),
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
