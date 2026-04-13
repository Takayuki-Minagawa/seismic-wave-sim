export interface QuizQuestion {
  id: string;
  textKey: string;
  optionKeys: string[];
  answerIndex: number;
  explanationKey: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    textKey: 'quiz.questions.q1.text',
    optionKeys: [
      'quiz.questions.q1.options.0',
      'quiz.questions.q1.options.1',
      'quiz.questions.q1.options.2',
      'quiz.questions.q1.options.3',
    ],
    answerIndex: 1,
    explanationKey: 'quiz.questions.q1.explanation',
  },
  {
    id: 'q2',
    textKey: 'quiz.questions.q2.text',
    optionKeys: [
      'quiz.questions.q2.options.0',
      'quiz.questions.q2.options.1',
      'quiz.questions.q2.options.2',
      'quiz.questions.q2.options.3',
    ],
    answerIndex: 1,
    explanationKey: 'quiz.questions.q2.explanation',
  },
  {
    id: 'q3',
    textKey: 'quiz.questions.q3.text',
    optionKeys: [
      'quiz.questions.q3.options.0',
      'quiz.questions.q3.options.1',
      'quiz.questions.q3.options.2',
      'quiz.questions.q3.options.3',
    ],
    answerIndex: 2,
    explanationKey: 'quiz.questions.q3.explanation',
  },
  {
    id: 'q4',
    textKey: 'quiz.questions.q4.text',
    optionKeys: [
      'quiz.questions.q4.options.0',
      'quiz.questions.q4.options.1',
      'quiz.questions.q4.options.2',
      'quiz.questions.q4.options.3',
    ],
    answerIndex: 1,
    explanationKey: 'quiz.questions.q4.explanation',
  },
];
