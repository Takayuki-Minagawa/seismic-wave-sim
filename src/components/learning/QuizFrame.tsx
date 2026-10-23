import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QUIZ_QUESTIONS } from './quizBank';

export function QuizFrame() {
  const { t } = useTranslation();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = QUIZ_QUESTIONS[currentIdx];
  const isCorrect = selected === question.answerIndex;

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);
    if (idx === question.answerIndex) setScore(s => s + 1);
  };

  const handleNext = () => {
    if (currentIdx < QUIZ_QUESTIONS.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    setSelected(null);
    setShowResult(false);
    setScore(0);
    setFinished(false);
  };

  if (finished) {
    return (
      <div className="flex flex-col items-center gap-4 py-4">
        <div className="text-4xl">
          {score >= 3 ? '🎉' : score >= 2 ? '👍' : '📚'}
        </div>
        <p className="text-sm font-bold text-gray-700 dark:text-gray-300">
          {t('quiz.score', { correct: score, total: QUIZ_QUESTIONS.length })}
        </p>
        <button
          onClick={handleRestart}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors"
        >
          {t('quiz.start')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Progress */}
      <div className="flex items-center gap-2">
        {QUIZ_QUESTIONS.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i < currentIdx
                ? 'bg-green-400'
                : i === currentIdx
                ? 'bg-blue-400'
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Question */}
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
        Q{currentIdx + 1}. {t(question.textKey)}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-1.5">
        {question.optionKeys.map((key, idx) => {
          let btnClass = 'bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600';
          if (showResult) {
            if (idx === question.answerIndex) {
              btnClass = 'bg-green-50 dark:bg-green-900/20 border-green-400 dark:border-green-500';
            } else if (idx === selected) {
              btnClass = 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-500';
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelect(idx)}
              disabled={showResult}
              className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors ${btnClass} text-gray-700 dark:text-gray-300 disabled:cursor-default`}
            >
              {String.fromCharCode(65 + idx)}. {t(key)}
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {showResult && (
        <div className={`text-xs p-2 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          <p className="font-bold mb-1">{isCorrect ? t('quiz.correct') : t('quiz.incorrect')}</p>
          <p className="leading-relaxed">{t(question.explanationKey)}</p>
        </div>
      )}

      {/* Next button */}
      {showResult && (
        <button
          onClick={handleNext}
          className="text-xs px-3 py-1.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors self-end"
        >
          {currentIdx < QUIZ_QUESTIONS.length - 1 ? t('quiz.next') : t('quiz.finish')} →
        </button>
      )}
    </div>
  );
}
