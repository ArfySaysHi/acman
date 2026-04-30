import { useEffect, useRef } from "react";
import useMpqRegistry from "./mpq/useMpqRegistry";
import useMpqFileCache from "./mpq/useMpqFileCache";

export default function useMpqManager() {
  const activeMpqRef = useRef<string | null>(null);
  const mounted = useRef<boolean>(false);

  const cache = useMpqFileCache({ activeMpqRef });
  const registry = useMpqRegistry({
    setArchivePath: cache.setArchivePath,
    setFileCache: cache.setFileCache,
  });

  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;

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
