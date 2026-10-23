import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QUIZ_QUESTIONS } from './quizBank';
import { missionStore } from '../../game/missions';
import { sound } from '../../game/sound';
import { celebrate } from '../../game/toastStore';

type Stage = 'intro' | 'question' | 'finished';

export function QuizFrame() {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>('intro');
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const total = QUIZ_QUESTIONS.length;
  const question = QUIZ_QUESTIONS[currentIdx];
  const showResult = selected !== null;
  const isCorrect = selected === question.answerIndex;

  const start = () => {
    setStage('question');
    setCurrentIdx(0);
    setSelected(null);
    setScore(0);
    setStreak(0);
  };

  const handleSelect = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    if (idx === question.answerIndex) {
      setScore(s => s + 1);
      setStreak(s => s + 1);
      sound.correct();
    } else {
      setStreak(0);
      sound.wrong();
    }
  };

  const handleNext = () => {
    if (currentIdx < total - 1) {
      setCurrentIdx(i => i + 1);
      setSelected(null);
      return;
    }
    setStage('finished');
    missionStore.unlock('quizClear');
    if (score === total) {
      missionStore.unlock('quizPerfect');
      celebrate();
    }
  };

  if (stage === 'intro') {
    return (
      <div className="flex flex-col items-center gap-4 px-4 py-8 text-center">
        <div className="text-6xl animate-float">🧠</div>
        <p className="text-lg font-extrabold text-slate-800 dark:text-slate-100">{t('quiz.title')}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{t('quiz.intro', { total })}</p>
        <button onClick={start} className="btn-quake rounded-2xl px-6 py-2.5 text-sm font-extrabold text-white">
          {t('quiz.start')}
        </button>
      </div>
    );
  }

  if (stage === 'finished') {
    const ratio = score / total;
    const message = ratio === 1 ? t('quiz.resultPerfect') : ratio >= 0.6 ? t('quiz.resultGood') : t('quiz.resultTry');
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-6 text-center">
        <div className="text-6xl animate-bounce-in">{ratio === 1 ? '🏆' : ratio >= 0.6 ? '🎉' : '📚'}</div>
        <p className="font-hud text-3xl font-black">
          <span className="text-gradient">{score}</span>
          <span className="text-lg text-slate-400"> / {total}</span>
        </p>
        <div className="flex gap-1">
          {Array.from({ length: total }, (_, i) => (
            <span key={i} className={`text-lg ${i < score ? '' : 'opacity-25 grayscale'}`}>⭐</span>
          ))}
        </div>
        <p className="text-sm font-bold text-slate-700 dark:text-slate-200">{message}</p>
        <button onClick={start} className="mt-2 rounded-2xl bg-violet-500 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-violet-600">
          🔁 {t('quiz.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 gap-1">
          {QUIZ_QUESTIONS.map((q, i) => (
            <div
              key={q.id}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i < currentIdx || (i === currentIdx && showResult)
                  ? 'bg-emerald-400'
                  : i === currentIdx
                  ? 'bg-violet-400'
                  : 'bg-slate-200 dark:bg-white/10'
              }`}
            />
          ))}
        </div>
        <span className="font-hud text-[11px] font-bold text-slate-500">{currentIdx + 1}/{total}</span>
      </div>

      {streak >= 2 && (
        <div key={streak} className="self-start rounded-full bg-orange-500/15 px-2.5 py-0.5 text-[11px] font-extrabold text-orange-600 animate-pop-in dark:text-orange-300">
          🔥 {t('quiz.streak', { n: streak })}
        </div>
      )}

      {/* Question */}
      <p key={question.id} className="text-sm font-bold leading-relaxed text-slate-800 animate-fade-in dark:text-slate-100">
        <span className="mr-1 font-hud text-violet-500">Q{currentIdx + 1}.</span>
        {t(question.textKey)}
      </p>

      {/* Options */}
      <div className="flex flex-col gap-2">
        {question.optionKeys.map((key, idx) => {
          let cls = 'bg-white/70 ring-slate-200 hover:ring-violet-400 hover:-translate-y-0.5 dark:bg-white/5 dark:ring-white/10 dark:hover:ring-violet-400';
          if (showResult) {
            if (idx === question.answerIndex) cls = 'bg-emerald-500/15 ring-emerald-500';
            else if (idx === selected) cls = 'bg-rose-500/15 ring-rose-500 animate-quake';
            else cls = 'bg-white/40 ring-slate-200 opacity-60 dark:bg-white/5 dark:ring-white/5';
          }

          return (
            <button
              key={key}
              onClick={() => handleSelect(idx)}
              disabled={showResult}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-xs font-medium text-slate-700 ring-1 transition-all disabled:cursor-default dark:text-slate-200 ${cls}`}
            >
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-slate-900/5 font-hud text-[11px] font-bold dark:bg-white/10">
                {showResult && idx === question.answerIndex ? '✓' : showResult && idx === selected ? '✗' : String.fromCharCode(65 + idx)}
              </span>
              {t(key)}
            </button>
          );
        })}
      </div>

      {/* Result feedback */}
      {showResult && (
        <div className={`rounded-xl p-3 text-xs animate-pop-in ${isCorrect ? 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-200' : 'bg-rose-500/10 text-rose-800 dark:text-rose-200'}`}>
          <p className="mb-1 text-sm font-extrabold">{isCorrect ? `⭕ ${t('quiz.correct')}` : `❌ ${t('quiz.incorrect')}`}</p>
          <p className="leading-relaxed">{t(question.explanationKey)}</p>
        </div>
      )}

      {showResult && (
        <button
          onClick={handleNext}
          className="self-end rounded-xl bg-violet-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-600"
        >
          {currentIdx < total - 1 ? t('quiz.next') : t('quiz.finish')} →
        </button>
      )}
    </div>
  );
}
