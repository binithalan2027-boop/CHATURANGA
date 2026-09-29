import { useEffect, useRef } from 'react';

interface MoveHistoryProps {
  history: string[];
}

export default function MoveHistory({ history }: MoveHistoryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  const pairs: { num: number; white: string; black?: string }[] = [];
  for (let i = 0; i < history.length; i += 2) {
    pairs.push({
      num: Math.floor(i / 2) + 1,
      white: history[i],
      black: history[i + 1],
    });
  }

  return (
    <div className="w-full lg:w-80 bg-surface-card border border-surface-container-high rounded-xl p-space-md flex flex-col h-[60vh] max-h-[600px]">
      <div className="border-b border-surface-container pb-2 mb-2">
        <h3 className="font-headline-sm text-bone-ivory uppercase tracking-widest text-center">Grim Record</h3>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto pr-2 scrollbar-hide font-mono text-body-sm text-on-surface-variant flex flex-col gap-1">
        {pairs.length === 0 && (
          <div className="text-center italic opacity-50 mt-4">The void awaits the first move...</div>
        )}
        {pairs.map((pair) => (
          <div key={pair.num} className="flex hover:bg-surface-container-lowest px-2 py-1 rounded">
            <span className="w-8 text-on-surface-variant/50">{pair.num}.</span>
            <span className="flex-1 text-bone-ivory">{pair.white}</span>
            <span className="flex-1 text-bone-ivory">{pair.black || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
