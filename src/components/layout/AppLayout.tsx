import { ReactNode, useState } from 'react';

interface AppLayoutProps {
  topBar: ReactNode;
  controlPanel: ReactNode;
  earthCanvas: ReactNode;
  travelTimeGraph: ReactNode;
  earthInfoPanel: ReactNode;
  learningPanel: ReactNode;
}

export function AppLayout({
  topBar,
  controlPanel,
  earthCanvas,
  travelTimeGraph,
  earthInfoPanel,
  learningPanel,
}: AppLayoutProps) {
  const [mobileTab, setMobileTab] = useState<'earth' | 'graph' | 'info' | 'quiz'>('earth');
  const [showControls, setShowControls] = useState(false);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Top bar */}
      <div className="flex-shrink-0">{topBar}</div>

      {/* Desktop layout: 3 columns */}
      <div className="hidden md:flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Controls */}
        <aside className="flex flex-col w-60 lg:w-64 flex-shrink-0 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          {controlPanel}
        </aside>

        {/* Center: Earth + Graph */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <div className="flex-1 min-h-0 bg-gray-900 dark:bg-gray-950">
            {earthCanvas}
          </div>
          <div className="flex-shrink-0 h-44 lg:h-52 border-t border-gray-700 dark:border-gray-800 bg-white dark:bg-gray-900 p-2">
            {travelTimeGraph}
          </div>
        </div>

        {/* Right: Info + Learning (lg+ only) */}
        <aside className="hidden lg:flex flex-col w-72 xl:w-80 flex-shrink-0 border-l border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="flex-1 min-h-0 overflow-y-auto border-b border-gray-200 dark:border-gray-700 max-h-[55%]">
            {earthInfoPanel}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {learningPanel}
          </div>
        </aside>
      </div>

      {/* Mobile layout: stacked with tab bar */}
      <div className="flex md:hidden flex-1 flex-col min-h-0 overflow-hidden">
        {/* Tab content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {mobileTab === 'earth' && (
            <div className="flex flex-col h-full bg-gray-900 dark:bg-gray-950">
              {earthCanvas}
            </div>
          )}
          {mobileTab === 'graph' && (
            <div className="h-full bg-white dark:bg-gray-900 p-2">
              {travelTimeGraph}
            </div>
          )}
          {mobileTab === 'info' && (
            <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
              {earthInfoPanel}
            </div>
          )}
          {mobileTab === 'quiz' && (
            <div className="h-full overflow-y-auto bg-white dark:bg-gray-900">
              {learningPanel}
            </div>
          )}
        </div>

        {/* Mobile bottom tab bar */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          {/* Controls drawer toggle */}
          <div
            className={`transition-all overflow-hidden ${showControls ? 'max-h-64' : 'max-h-0'}`}
          >
            <div className="border-t border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
              {controlPanel}
            </div>
          </div>
          <div className="flex items-center">
            <button
              onClick={() => setShowControls(v => !v)}
              className="flex flex-col items-center px-3 py-2 text-xs text-gray-500 dark:text-gray-400"
            >
              <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              設定
            </button>
            {(['earth', 'graph', 'info', 'quiz'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setMobileTab(tab)}
                className={`flex-1 flex flex-col items-center py-2 text-xs transition-colors ${
                  mobileTab === tab
                    ? 'text-blue-500 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                <span className="text-base mb-0.5">
                  {tab === 'earth' ? '🌍' : tab === 'graph' ? '📈' : tab === 'info' ? '📊' : '📚'}
                </span>
                <span>{tab === 'earth' ? '断面図' : tab === 'graph' ? '走時曲線' : tab === 'info' ? '構造' : '学習'}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
