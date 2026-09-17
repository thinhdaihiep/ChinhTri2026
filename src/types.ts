export interface QuestionItem {
  id: number;
  question: string;
  options: {
    [key: string]: string;
  };
  answer: string;
}

export type SearchScope = 'all' | 'question' | 'options';
export type SearchMode = SearchScope; // Backwards compatibility
export type MatchMode = 'all_words' | 'any_word';
export type AnswerFilterMode = 'correct_only' | 'all_answers';
