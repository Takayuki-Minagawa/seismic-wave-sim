import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TabBar } from './TabBar';

interface AnalysisPanelProps {
  travelTimeGraph: ReactNode;
  seismogram: ReactNode;
}

type AnalysisTab = 'seismogram' | 'travelTime';

/** Seismograph + travel-time curve: side by side on wide screens, tabbed otherwise. */
export function AnalysisPanel({ travelTimeGraph, seismogram }: AnalysisPanelProps) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<AnalysisTab>('seismogram');

  const card = (title: string, icon: string, body: ReactNode, id: AnalysisTab) => (
    <section className={`min-h-0 min-w-0 flex-col ${tab === id ? 'flex' : 'hidden'} 2xl:flex`}>
      <h2 className="mb-1 hidden items-center gap-1.5 text-xs font-extrabold text-slate-600 dark:text-slate-300 2xl:flex">
        <span>{icon}</span>
        {title}
      </h2>
      <div className="min-h-0 flex-1">{body}</div>
    </section>
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-2 p-3">
      <TabBar
        className="flex-shrink-0 2xl:hidden"
        tabs={[
          { id: 'seismogram', label: t('tabs.seismogram'), icon: '📡' },
          { id: 'travelTime', label: t('tabs.travelTime'), icon: '📈' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div className="grid min-h-0 flex-1 gap-4 2xl:grid-cols-2">
        {card(t('seismo.title'), '📡', seismogram, 'seismogram')}
        {card(t('graph.title'), '📈', travelTimeGraph, 'travelTime')}
      </div>
    </div>
  );
}
