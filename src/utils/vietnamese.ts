import { QuestionItem, SearchScope, MatchMode, AnswerFilterMode } from '../types';

/**
 * Remove Vietnamese accents/diacritics and normalize string
 */
export function removeVietnameseTones(str: string): string {
  if (!str) return '';
  let result = str;
  result = result.replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a');
  result = result.replace(/À|Á|Ạ|Ả|Ã|Â|Ầ|Ấ|Ậ|Ẩ|Ẫ|Ă|Ằ|Ắ|Ặ|Ẳ|Ẵ/g, 'A');
  result = result.replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'e');
  result = result.replace(/È|É|Ẹ|Ẻ|Ẽ|Ê|Ề|Ế|Ệ|Ể|Ễ/g, 'E');
  result = result.replace(/ì|í|ị|ỉ|ĩ/g, 'i');
  result = result.replace(/Ì|Í|Ị|Ỉ|Ĩ/g, 'I');
  result = result.replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o');
  result = result.replace(/Ò|Ó|Ọ|Ỏ|Õ|Ô|Ồ|Ố|Ộ|Ổ|Ỗ|Ơ|Ờ|Ớ|Ợ|Ở|Ỡ/g, 'O');
  result = result.replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u');
  result = result.replace(/Ù|Ú|Ụ|Ủ|Ũ|Ư|Ừ|Ứ|Ự|Ử|Ữ/g, 'U');
  result = result.replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y');
  result = result.replace(/Ỳ|Ý|Ỵ|Ỷ|Ỹ/g, 'Y');
  result = result.replace(/đ/g, 'd');
  result = result.replace(/Đ/g, 'D');

  // Combining diacritical marks
  result = result.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return result;
}

export function normalizeSearchString(str: string): string {
  return removeVietnameseTones(str)
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export interface SearchResult {
  item: QuestionItem;
  score: number;
  matchedField: 'id' | 'question' | 'options' | 'answer';
}

/**
 * Intelligent diacritic-insensitive search
 * @param items List of questions
 * @param query Search query
 * @param scope Field to search in ('all' | 'question' | 'options')
 * @param matchMode Match mode ('all_words' | 'any_word') - defaults to 'all_words'
 * @param answerFilterMode Answer filter mode ('correct_only' | 'all_answers') - defaults to 'correct_only'
 */
export function searchQuestions(
  items: QuestionItem[],
  query: string,
  scope: SearchScope = 'all',
  matchMode: MatchMode = 'all_words',
  answerFilterMode: AnswerFilterMode = 'correct_only'
): QuestionItem[] {
  const trimmed = query.trim();
  if (!trimmed) return items;

  // Check if searching by ID directly (e.g., "12", "#12", "cau 12")
  const idMatch = trimmed.match(/^(?:câu|cau|#)?\s*(\d+)$/i);
  if (idMatch) {
    const targetId = parseInt(idMatch[1], 10);
    const exactIdItem = items.find((q) => q.id === targetId);
    if (exactIdItem) {
      // Return exact match first, followed by others containing the number
      const others = items.filter((q) => q.id !== targetId);
      return [exactIdItem, ...searchByText(others, trimmed, scope, matchMode, answerFilterMode)];
    }
  }

  return searchByText(items, trimmed, scope, matchMode, answerFilterMode);
}

function searchByText(
  items: QuestionItem[],
  query: string,
  scope: SearchScope,
  matchMode: MatchMode,
  answerFilterMode: AnswerFilterMode
): QuestionItem[] {
  const normQuery = normalizeSearchString(query);
  if (!normQuery) return items;

  const queryWords = normQuery.split(' ').filter((w) => w.length > 0);
  if (queryWords.length === 0) return items;

  const scored: SearchResult[] = [];

  for (const item of items) {
    const normQuestion = normalizeSearchString(item.question);
    const correctAnswerKey = item.answer?.toUpperCase();
    const correctAnswerText = item.options[correctAnswerKey] || '';
    const normAnswer = normalizeSearchString(correctAnswerText);

    // If answerFilterMode === 'correct_only', only search within the correct answer
    const searchAllOptions = answerFilterMode === 'all_answers';
    const optionsEntries = Object.entries(item.options);
    const optionsText = optionsEntries.map(([k, v]) => `${k} ${v}`).join(' ');
    const normOptions = searchAllOptions ? normalizeSearchString(optionsText) : normAnswer;

    let score = 0;
    let matchedField: SearchResult['matchedField'] = 'question';

    // 1. Exact continuous phrase match (Highest Priority)
    const exactInQ = normQuestion.includes(normQuery);
    const exactInAns = normAnswer.includes(normQuery);
    const exactInOpt = searchAllOptions ? normOptions.includes(normQuery) : false;

    if (scope === 'all' || scope === 'question') {
      if (exactInQ) {
        score += 2000;
        matchedField = 'question';
      }
    }

    if (scope === 'all' || scope === 'options') {
      if (exactInAns) {
        score += 1800;
        matchedField = 'answer';
      } else if (exactInOpt) {
        score += 1500;
        matchedField = 'options';
      }
    }

    // 2. Word-by-word matching
    let qMatchedWords = 0;
    let optMatchedWords = 0;
    let ansMatchedWords = 0;

    for (const word of queryWords) {
      if (normQuestion.includes(word)) qMatchedWords++;
      if (normAnswer.includes(word)) ansMatchedWords++;
      if (searchAllOptions && normOptions.includes(word)) optMatchedWords++;
    }

    if (!searchAllOptions) {
      optMatchedWords = ansMatchedWords;
    }

    const allInQ = qMatchedWords === queryWords.length;
    const allInAns = ansMatchedWords === queryWords.length;
    const allInOpt = optMatchedWords === queryWords.length;
    const allInCombined = queryWords.every(
      (w) => normQuestion.includes(w) || (searchAllOptions ? normOptions.includes(w) : normAnswer.includes(w))
    );

    if (matchMode === 'all_words') {
      // In "All words" mode, we require either exact phrase OR all words present
      if (exactInQ || exactInAns || exactInOpt) {
        // already scored above, matches!
      } else if (scope === 'question') {
        if (allInQ) {
          score += 800 + qMatchedWords * 20;
          matchedField = 'question';
        }
      } else if (scope === 'options') {
        if (allInAns) {
          score += 750 + ansMatchedWords * 20;
          matchedField = 'answer';
        } else if (exactInOpt || allInOpt) {
          score += 650 + optMatchedWords * 20;
          matchedField = 'options';
        }
      } else {
        // scope === 'all'
        if (allInQ) {
          score += 800 + qMatchedWords * 20;
          matchedField = 'question';
        } else if (allInAns) {
          score += 750 + ansMatchedWords * 20;
          matchedField = 'answer';
        } else if (allInOpt) {
          score += 650 + optMatchedWords * 20;
          matchedField = 'options';
        } else if (allInCombined) {
          score += 500 + (qMatchedWords + optMatchedWords) * 10;
        }
      }
    } else {
      // In "any_word" mode, any matched word contributes to score
      if (scope === 'question') {
        if (allInQ) {
          score += 800 + qMatchedWords * 20;
        } else if (qMatchedWords > 0) {
          score += qMatchedWords * 30;
        }
      } else if (scope === 'options') {
        if (allInAns) {
          score += 750 + ansMatchedWords * 20;
        } else if (allInOpt) {
          score += 650 + optMatchedWords * 20;
        } else if (ansMatchedWords > 0) {
          score += ansMatchedWords * 35;
        } else if (optMatchedWords > 0) {
          score += optMatchedWords * 25;
        }
      } else {
        // scope === 'all'
        if (allInQ) {
          score += 800;
        }
        if (allInAns) {
          score += 750;
        }
        if (allInOpt) {
          score += 650;
        }
        if (qMatchedWords > 0 || optMatchedWords > 0) {
          score += qMatchedWords * 25 + optMatchedWords * 15;
        }
      }
    }

    // ID match
    if (String(item.id) === normQuery) {
      score += 3000;
      matchedField = 'id';
    }

    if (score > 0) {
      scored.push({ item, score, matchedField });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.item.id - b.item.id);
  return scored.map((s) => s.item);
}

function tokenize(text: string): { raw: string; norm: string; start: number; end: number }[] {
  const tokens: { raw: string; norm: string; start: number; end: number }[] = [];
  const regex = /[\p{L}\p{N}]+/gu;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const norm = removeVietnameseTones(raw).toLowerCase();
    tokens.push({ raw, norm, start: match.index, end: match.index + raw.length });
  }
  return tokens;
}

/**
 * Splits text into highlighted chunks based on search query (case & accent insensitive).
 * Respects matchMode: in 'all_words' mode, only complete phrase or all matching words are highlighted.
 */
export function getHighlightParts(
  text: string,
  query: string,
  matchMode: MatchMode = 'all_words'
): { text: string; isMatch: boolean }[] {
  if (!query || !query.trim() || !text) {
    return [{ text, isMatch: false }];
  }

  const queryTokens = tokenize(query).map((t) => t.norm);
  if (queryTokens.length === 0) return [{ text, isMatch: false }];

  const textTokens = tokenize(text);
  if (textTokens.length === 0) return [{ text, isMatch: false }];

  const matchMask = new Array(text.length).fill(false);
  const k = queryTokens.length;

  let hasPhraseMatch = false;
  for (let i = 0; i <= textTokens.length - k; i++) {
    let match = true;
    for (let j = 0; j < k; j++) {
      if (textTokens[i + j].norm !== queryTokens[j]) {
        match = false;
        break;
      }
    }
    if (match) {
      hasPhraseMatch = true;
      const startIdx = textTokens[i].start;
      const endIdx = textTokens[i + k - 1].end;
      for (let idx = startIdx; idx < endIdx && idx < text.length; idx++) {
        matchMask[idx] = true;
      }
    }
  }

  if (matchMode === 'all_words') {
    // In all_words mode:
    // If not a consecutive phrase, only highlight if ALL query tokens are present in this text
    if (!hasPhraseMatch && k > 1) {
      const allPresent = queryTokens.every((qw) => textTokens.some((t) => t.norm === qw));
      if (allPresent) {
        for (const t of textTokens) {
          if (queryTokens.includes(t.norm)) {
            for (let idx = t.start; idx < t.end; idx++) {
              matchMask[idx] = true;
            }
          }
        }
      }
    }
  } else {
    // any_word mode: any matched token can be highlighted
    for (const t of textTokens) {
      if (queryTokens.includes(t.norm)) {
        for (let idx = t.start; idx < t.end; idx++) {
          matchMask[idx] = true;
        }
      }
    }
  }

  const parts: { text: string; isMatch: boolean }[] = [];
  let currentMatch = matchMask[0];
  let currentBuffer = text[0];

  for (let i = 1; i < text.length; i++) {
    if (matchMask[i] === currentMatch) {
      currentBuffer += text[i];
    } else {
      parts.push({ text: currentBuffer, isMatch: currentMatch });
      currentBuffer = text[i];
      currentMatch = matchMask[i];
    }
  }
  if (currentBuffer) {
    parts.push({ text: currentBuffer, isMatch: currentMatch });
  }

  return parts;
}

