import { useEffect, JSX, useRef } from "react";

interface ConsoleProps {
  stream: string;
}

export default function Console({ stream }: ConsoleProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [stream]);

  return (
    <div
      ref={scrollRef}
      className="ayu-panel p-3 h-96 overflow-y-auto font-mono text-[11px] leading-relaxed text-ayu-green"
    >
      {stream.length === 0 ? (
        <span className="text-ayu-muted italic">Waiting for server output…</span>
      ) : (
        <pre className="whitespace-pre-wrap break-words">{stream}</pre>
      )}
    </div>
  );
}
