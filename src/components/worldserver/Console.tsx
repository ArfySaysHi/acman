import { useEffect, JSX, useRef } from "react";

interface ConsoleProps {
  stream: string;
}

export default function Console({ stream }: ConsoleProps): JSX.Element {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stream]);

  return (
    <div
      ref={scrollRef}
      className="bg-gray-900 border border-gray-700 rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm text-white"
    >
      {stream.length === 0 ? (
        <div className="text-gray-500 italic">Waiting for server output...</div>
      ) : (
        <pre className="whitespace-pre-wrap break-words">{stream}</pre>
      )}
    </div>
  );
}
