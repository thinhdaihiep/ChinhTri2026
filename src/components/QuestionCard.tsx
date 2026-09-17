import React, { useState } from 'react';
import { CheckCircle2, Copy, Check } from 'lucide-react';
import { QuestionItem, AnswerFilterMode } from '../types';
import { HighlightedText } from './HighlightedText';

interface QuestionCardProps {
  key?: React.Key;
  item: QuestionItem;
  query: string;
  answerFilterMode?: AnswerFilterMode;
}

export function QuestionCard({ item, query, answerFilterMode = 'correct_only' }: QuestionCardProps) {
  const [copied, setCopied] = useState(false);

  const correctAnswerKey = item.answer?.toUpperCase();
  const correctAnswerText = item.options[correctAnswerKey] || '';

  const handleCopy = async () => {
    const textToCopy = `Câu ${item.id}: ${item.question}\n-> Đáp án đúng (${correctAnswerKey}): ${correctAnswerText}`;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      id={`question-card-${item.id}`}
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center px-2.5 py-1 text-xs font-bold text-slate-700 bg-slate-100 rounded-lg">
            #{item.id}
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {correctAnswerKey}
          </span>
        </div>

        <button
          id={`copy-btn-${item.id}`}
          onClick={handleCopy}
          title={copied ? 'Đã sao chép' : 'Sao chép câu hỏi & đáp án'}
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          {copied ? (
            <Check className="w-4 h-4 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Question statement */}
      <h3 className="text-base font-semibold text-slate-900 mb-3 leading-relaxed">
        <HighlightedText text={item.question} query={query} />
      </h3>

      {/* Answers rendering: Only correct answer vs All answers */}
      {answerFilterMode === 'correct_only' ? (
        <div className="pt-1">
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-emerald-300 bg-emerald-50/90 text-emerald-950 font-medium ring-1 ring-emerald-300/60 shadow-2xs">
            <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold bg-emerald-600 text-white shadow-xs">
              {correctAnswerKey}
            </span>
            <div className="flex-1 leading-relaxed text-sm pt-0.5">
              <HighlightedText text={correctAnswerText} query={query} />
            </div>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-2 pt-1">
          {Object.entries(item.options).map(([key, value]) => {
            const isCorrect = key.toUpperCase() === correctAnswerKey;
            return (
              <div
                key={key}
                className={`flex items-start gap-2.5 p-2.5 rounded-lg border text-sm transition-all ${
                  isCorrect
                    ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-medium ring-1 ring-emerald-300/60'
                    : 'bg-slate-50/60 border-slate-200/80 text-slate-700'
                }`}
              >
                <span
                  className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-xs font-bold ${
                    isCorrect
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-600'
                  }`}
                >
                  {key}
                </span>
                <div className="flex-1 leading-normal pt-0.5">
                  <HighlightedText text={value} query={query} />
                </div>
                {isCorrect && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
