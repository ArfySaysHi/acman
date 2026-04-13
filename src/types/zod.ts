import * as z from "zod";

export const ZMpqMetadata = z.object({
  path: z.string(),
  name: z.string(),
  dirty: z.boolean(),
});

export const ZMpqMetadataMap = z.record(z.string(), ZMpqMetadata);

export type MpqMetadata = z.infer<typeof ZMpqMetadata>;
export type MpqMetadataMap = z.infer<typeof ZMpqMetadataMap>;
