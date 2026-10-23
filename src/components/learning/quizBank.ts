export interface QuizQuestion {
  id: string;
  textKey: string;
  optionKeys: string[];
  answerIndex: number;
  explanationKey: string;
}

function question(id: string, answerIndex: number): QuizQuestion {
  return {
    id,
    textKey: `quiz.questions.${id}.text`,
    optionKeys: [0, 1, 2, 3].map(i => `quiz.questions.${id}.options.${i}`),
    answerIndex,
    explanationKey: `quiz.questions.${id}.explanation`,
  };
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  question('q1', 1),
  question('q2', 1),
  question('q3', 2),
  question('q4', 1),
  question('q5', 2),
  question('q6', 0),
  question('q7', 2),
  question('q8', 1),
];
