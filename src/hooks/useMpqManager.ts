import { useEffect, useRef } from "react";
import useMpqRegistry from "./mpq/useMpqRegistry";
import useMpqFileCache from "./mpq/useMpqFileCache";

export default function useMpqManager() {
  const activeMpqRef = useRef<string | null>(null);

  const cache = useMpqFileCache({ activeMpqRef });
  const registry = useMpqRegistry({
    setArchivePath: cache.setArchivePath,
    setFileCache: cache.setFileCache,
  });

  useEffect(() => {
    registry.refresh();
  }, []);

  useEffect(() => {
    activeMpqRef.current = registry.activeMpq;
  }, [registry.activeMpq]);

  return {
    ...cache,
    ...registry,
  };
}
