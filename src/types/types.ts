import * as z from "zod";
import { ZMpqMetadataMap, ZFileEntry, ZFileEntryArr, ZFileEntryMap, ZMpqMetadata } from "./schema";

export type FileEntry = z.infer<typeof ZFileEntry>;
export type FileEntryMap = z.infer<typeof ZFileEntryMap>;
export type FileEntryArr = z.infer<typeof ZFileEntryArr>;
export type MpqMetadata = z.infer<typeof ZMpqMetadata>;
export type MpqMetadataMap = z.infer<typeof ZMpqMetadataMap>;
export type ViewEntry =
  | { kind: "dir"; name: string }
  | { kind: "file"; name: string; entry: FileEntry };
