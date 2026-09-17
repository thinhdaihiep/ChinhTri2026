import { useState, useEffect, useMemo, useTransition } from 'react';
import {
  Search,
  X,
  Clipboard,
  Layers,
  HelpCircle,
  CheckCircle2,
  FileQuestion,
  ChevronDown,
  WholeWord,
  Asterisk,
  BadgeCheck,
  List
} from 'lucide-react';
import { QuestionItem, SearchScope, MatchMode, AnswerFilterMode } from './types';
import { defaultQuestions } from './data/defaultQuestions';
import { searchQuestions } from './utils/vietnamese';
import { QuestionCard } from './components/QuestionCard';

const MATCH_MODE_STORAGE_KEY = 'quiz_lookup_match_mode';
const ANSWER_MODE_STORAGE_KEY = 'quiz_lookup_answer_mode';

export default function App() {
  const [questions] = useState<QuestionItem[]>(defaultQuestions);
  const [query, setQuery] = useState('');
  const [searchMode, setSearchMode] = useState<SearchScope>('all');
  
  const [matchMode, setMatchMode] = useState<MatchMode>(() => {
    try {
      const saved = localStorage.getItem(MATCH_MODE_STORAGE_KEY);
      if (saved === 'all_words' || saved === 'any_word') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'all_words'; // Mặc định: All word (đúng toàn bộ text)
  });

  const [answerFilterMode, setAnswerFilterMode] = useState<AnswerFilterMode>(() => {
    try {
      const saved = localStorage.getItem(ANSWER_MODE_STORAGE_KEY);
      if (saved === 'correct_only' || saved === 'all_answers') {
        return saved;
      }
    } catch {
      // ignore
    }
    return 'correct_only'; // Mặc định: Chỉ câu trả lời đúng
  });

  const [visibleCount, setVisibleCount] = useState(30);
  const [, startTransition] = useTransition();

  // Save matchMode preference
  useEffect(() => {
    try {
      localStorage.setItem(MATCH_MODE_STORAGE_KEY, matchMode);
    } catch {
      // ignore
    }
  }, [matchMode]);

  // Save answerFilterMode preference
  useEffect(() => {
    try {
      localStorage.setItem(ANSWER_MODE_STORAGE_KEY, answerFilterMode);
    } catch {
      // ignore
    }
  }, [answerFilterMode]);

  // Reset visible items when query or modes change
  useEffect(() => {
    setVisibleCount(30);
  }, [query, searchMode, matchMode, answerFilterMode]);

  // Filtered and scored questions
  const filteredQuestions = useMemo(() => {
    return searchQuestions(questions, query, searchMode, matchMode, answerFilterMode);
  }, [questions, query, searchMode, matchMode, answerFilterMode]);

  const displayedQuestions = useMemo(() => {
    return filteredQuestions.slice(0, visibleCount);
  }, [filteredQuestions, visibleCount]);

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        startTransition(() => {
          setQuery(text);
        });
      }
    } catch {
      // Ignore if permission denied
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/80 text-slate-800 flex flex-col font-sans">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">
                Kiểm tra chính trị năm 2026
              </h1>
              <p className="text-xs text-slate-500">
                Tra cứu thông minh không dấu ({questions.length} câu)
              </p>
            </div>
          </div>

          <div className="flex items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200/80 rounded-full text-xs font-semibold">
              Ngân hàng {questions.length} câu
            </span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        {/* Search & Filter Controls */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-5 h-5 text-slate-400 pointer-events-none" />
            <input
              id="search-input"
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập nội dung câu hỏi, từ khóa, đáp án hoặc số câu (VD: quan khu 5, chien dich 500, #12)..."
              className="w-full pl-11 pr-20 py-3 bg-slate-50 border border-slate-200 hover:border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-3 focus:ring-indigo-100 rounded-xl text-sm transition-all outline-hidden text-slate-900"
            />
            <div className="absolute right-2.5 flex items-center gap-1">
              <button
                id="paste-clipboard-btn"
                onClick={handlePasteClipboard}
                title="Dán nhanh từ bộ nhớ tạm"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
              >
                <Clipboard className="w-4 h-4" />
              </button>
              {query && (
                <button
                  id="clear-search-btn"
                  onClick={() => setQuery('')}
                  title="Xóa nội dung tìm kiếm"
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Filters Bar: Scope, Word Match Mode, and Answer Mode */}
          <div className="flex items-center justify-between flex-wrap gap-2.5 pt-1 text-xs">
            <div className="flex items-center flex-wrap gap-2">
              {/* Scope Filters (All, Question only, Options only) */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl">
                <button
                  id="filter-all-btn"
                  onClick={() => setSearchMode('all')}
                  title="Dò trên cả câu hỏi và các đáp án"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    searchMode === 'all'
                      ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Tất cả</span>
                </button>

                <button
                  id="filter-question-btn"
                  onClick={() => setSearchMode('question')}
                  title="Chỉ dò trong nội dung câu hỏi"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    searchMode === 'question'
                      ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Câu hỏi</span>
                </button>

                <button
                  id="filter-options-btn"
                  onClick={() => setSearchMode('options')}
                  title="Chỉ dò trong các đáp án"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    searchMode === 'options'
                      ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Đáp án</span>
                </button>
              </div>

              {/* Match Mode Filter (All words - Default vs Any word) */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
                <button
                  id="match-mode-all-words-btn"
                  onClick={() => setMatchMode('all_words')}
                  title="Đúng toàn bộ text / Tất cả các từ (All word - Mặc định)"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    matchMode === 'all_words'
                      ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <WholeWord className="w-3.5 h-3.5" />
                  <span>All word</span>
                </button>

                <button
                  id="match-mode-any-word-btn"
                  onClick={() => setMatchMode('any_word')}
                  title="Khớp bất kỳ từ nào (Any word)"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    matchMode === 'any_word'
                      ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Asterisk className="w-3.5 h-3.5" />
                  <span>Any word</span>
                </button>
              </div>

              {/* Answer View & Search Mode: Correct only (Default) vs All answers */}
              <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
                <button
                  id="answer-mode-correct-only-btn"
                  onClick={() => setAnswerFilterMode('correct_only')}
                  title="Chỉ câu trả lời đúng (Mặc định)"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    answerFilterMode === 'correct_only'
                      ? 'bg-white text-emerald-700 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Chỉ câu đúng</span>
                </button>

                <button
                  id="answer-mode-all-answers-btn"
                  onClick={() => setAnswerFilterMode('all_answers')}
                  title="Toàn bộ câu trả lời"
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    answerFilterMode === 'all_answers'
                      ? 'bg-white text-indigo-600 shadow-2xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <List className="w-3.5 h-3.5 text-slate-600" />
                  <span>Toàn bộ câu trả lời</span>
                </button>
              </div>
            </div>

            {/* Quick stats */}
            <div className="text-slate-500 font-medium">
              Tìm thấy <strong className="text-indigo-600">{filteredQuestions.length}</strong> / {questions.length} câu
            </div>
          </div>
        </div>

        {/* Results List */}
        {filteredQuestions.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
              <FileQuestion className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-700 mb-1">
              Không tìm thấy câu hỏi phù hợp
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Hãy thử rút gọn cụm từ tìm kiếm hoặc chuyển chế độ tìm kiếm sang "Tất cả".
            </p>
            {query && (
              <button
                id="reset-query-btn"
                onClick={() => setQuery('')}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
              >
                Xóa bộ lọc tìm kiếm
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3.5">
            {displayedQuestions.map((item) => (
              <QuestionCard
                key={item.id}
                item={item}
                query={query}
                answerFilterMode={answerFilterMode}
              />
            ))}

            {/* Load more button */}
            {visibleCount < filteredQuestions.length && (
              <div className="pt-2 text-center">
                <button
                  id="load-more-btn"
                  onClick={() => setVisibleCount((prev) => prev + 30)}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs rounded-xl border border-slate-300 shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-4 h-4" />
                  Hiển thị thêm {Math.min(30, filteredQuestions.length - visibleCount)} / {filteredQuestions.length - visibleCount} câu
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
