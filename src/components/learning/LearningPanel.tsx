import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SimulationState } from '../../physics/types';
import { generateExplanation } from './explanationEngine';
import { QuizFrame } from './QuizFrame';

interface LearningPanelProps {
  state: SimulationState;
}

export function LearningPanel({ state }: LearningPanelProps) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'explanation' | 'quiz'>('explanation');

  const explanation = generateExplanation(state);

  return (
    <div className="flex flex-col gap-2 p-3 h-full overflow-y-auto">
      <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 pb-1 flex-shrink-0">
        {t('learning.title')}
      </h2>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <button
          onClick={() => setActiveTab('explanation')}
          className={`text-xs px-3 py-1.5 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'explanation'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('learning.explanationTab')}
        </button>
        <button
          onClick={() => setActiveTab('quiz')}
          className={`text-xs px-3 py-1.5 font-medium transition-colors border-b-2 -mb-px ${
            activeTab === 'quiz'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
        >
          {t('learning.quizTab')}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'explanation' ? (
          <div className="flex flex-col gap-3">
            {/* Context explanation */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-l-4 border-blue-400">
              <p className="text-xs text-blue-800 dark:text-blue-200 leading-relaxed">
                {t(explanation.key, explanation.vars ?? {})}
              </p>
            </div>

            {/* Quick facts */}
            <div className="flex flex-col gap-2">
              <h3 className="text-xs font-semibold text-gray-600 dark:text-gray-400">波の基本</h3>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-1.5 text-center">
                  <div className="text-xs font-bold text-blue-600 dark:text-blue-400">P波</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">縦波 (疎密波)</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">固体・液体</div>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded p-1.5 text-center">
                  <div className="text-xs font-bold text-red-600 dark:text-red-400">S波</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">横波 (せん断波)</div>
                  <div className="text-xs text-gray-500 dark:text-gray-500">固体のみ</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                <p>🌐 <strong>操作方法:</strong></p>
                <ul className="mt-1 ml-2 space-y-0.5">
                  <li>• クリック/ドラッグ → 震源設定</li>
                  <li>• ダブルクリック → 観測点追加</li>
                  <li>• 再生ボタン → アニメーション開始</li>
                </ul>
              </div>
            </div>

            {/* Shadow zone info when relevant */}
            {(state.shadowZone.pShadowStart < 180) && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2 text-xs text-orange-800 dark:text-orange-200">
                <p className="font-semibold mb-1">シャドウゾーン</p>
                <p>P波: {state.shadowZone.pShadowStart.toFixed(0)}°–{state.shadowZone.pShadowEnd.toFixed(0)}°</p>
                <p>S波: {state.shadowZone.sShadowStart.toFixed(0)}° 以遠</p>
              </div>
            )}
          </div>
        ) : (
          <QuizFrame />
        )}
      </div>
    </div>
  );
}
