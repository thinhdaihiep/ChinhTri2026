import { useMemo } from 'react';
import { getHighlightParts } from '../utils/vietnamese';

interface HighlightedTextProps {
  text: string;
  query: string;
  className?: string;
}

export function HighlightedText({ text, query, className = '' }: HighlightedTextProps) {
  const parts = useMemo(() => getHighlightParts(text, query), [text, query]);

  return (
    <span className={className}>
      {parts.map((part, index) =>
        part.isMatch ? (
          <mark
            key={index}
            className="bg-amber-200 text-amber-950 font-medium px-0.5 rounded"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        )
      )}
    </span>
  );
}
