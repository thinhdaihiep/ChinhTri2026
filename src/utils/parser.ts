import { QuestionItem } from '../types';

/**
 * Parses questions from either raw JSON string or markdown file containing ```json [...] ```
 */
export function parseQuestionsData(content: string): { questions: QuestionItem[]; error?: string } {
  if (!content || !content.trim()) {
    return { questions: [], error: 'Dữ liệu trống.' };
  }

  let jsonStr = content.trim();

  // If inside markdown code fence ```json ... ``` or ``` ... ```
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    // If there's an array bracket '[' and ']'
    const firstBracket = jsonStr.indexOf('[');
    const lastBracket = jsonStr.lastIndexOf(']');
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      jsonStr = jsonStr.slice(firstBracket, lastBracket + 1);
    }
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      return { questions: [], error: 'Dữ liệu không phải là một mảng JSON.' };
    }

    const validated: QuestionItem[] = [];
    for (let i = 0; i < parsed.length; i++) {
      const item = parsed[i];
      if (item && typeof item === 'object') {
        const id = typeof item.id === 'number' ? item.id : i + 1;
        const question = String(item.question || '').trim();
        const options = (item.options && typeof item.options === 'object') ? item.options : {};
        const answer = String(item.answer || '').trim().toUpperCase();

        if (question) {
          validated.push({
            id,
            question,
            options,
            answer,
          });
        }
      }
    }

    if (validated.length === 0) {
      return { questions: [], error: 'Không tìm thấy câu hỏi hợp lệ nào trong dữ liệu.' };
    }

    return { questions: validated };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { questions: [], error: `Lỗi đọc định dạng JSON: ${msg}` };
  }
}
