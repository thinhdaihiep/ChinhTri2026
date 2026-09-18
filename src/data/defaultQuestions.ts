import { QuestionItem } from '../types';
import q1 from './q_001_100.json';
import q2 from './q_101_200.json';
import q3 from './q_201_300.json';
import q4 from './q_301_400.json';
import q5 from './q_401_500.json';
import q6 from './q_501_600.json';
import q7 from './q_601_700.json';
import q8 from './q_701_800.json';
import q9 from './q_801_900.json';
import q10 from './q_901_1000.json';
import q11 from './q_1001_1021.json';

export const defaultQuestions: QuestionItem[] = [
  ...(q1 as QuestionItem[]),
  ...(q2 as QuestionItem[]),
  ...(q3 as QuestionItem[]),
  ...(q4 as QuestionItem[]),
  ...(q5 as QuestionItem[]),
  ...(q6 as QuestionItem[]),
  ...(q7 as QuestionItem[]),
  ...(q8 as QuestionItem[]),
  ...(q9 as QuestionItem[]),
  ...(q10 as QuestionItem[]),
  ...(q11 as QuestionItem[])
];


