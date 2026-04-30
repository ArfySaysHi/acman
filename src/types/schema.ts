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
});

export const ZMpqMetadataMap = z.record(z.string(), ZMpqMetadata);
