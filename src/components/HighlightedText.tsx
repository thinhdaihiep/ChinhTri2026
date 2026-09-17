import { useMemo } from 'react';
import { getHighlightParts } from '../utils/vietnamese';
import { MatchMode } from '../types';

interface HighlightedTextProps {
  text: string;
  query: string;
  matchMode?: MatchMode;
  className?: string;
}

export function HighlightedText({
  text,
  query,
  matchMode = 'all_words',
  className = '',
}: HighlightedTextProps) {
  const parts = useMemo(
    () => getHighlightParts(text, query, matchMode),
    [text, query, matchMode]
  );

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
