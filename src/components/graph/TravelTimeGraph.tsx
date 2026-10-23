import { useEffect, useRef, useCallback, useState } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import { TravelTimePoint } from '../../hooks/useTravelTimeData';
import { ObserverPoint, WavePhase } from '../../physics/types';
import { WAVE_COLORS } from '../../utils/colorScale';
import { P_SHADOW_END_DEG, P_SHADOW_START_DEG, S_SHADOW_START_DEG } from '../../physics/shadowZone';

interface TravelTimeGraphProps {
  data: TravelTimePoint[];
  observers: ObserverPoint[];
  currentTimeSec: number;
  isDark: boolean;
  selectedDistance?: number | null;
  onSelectDistance?: (deg: number | null) => void;
}

const MARGIN = { top: 26, right: 14, bottom: 34, left: 48 };
const Y_MAX_SEC = 1800;

const PHASE_COLORS: Record<WavePhase, string> = {
  P: WAVE_COLORS.P.stroke,
  S: WAVE_COLORS.S.stroke,
  PKP: WAVE_COLORS.PKP.stroke,
  PP: WAVE_COLORS.PP.stroke,
  SKS: '#10b981',
};

export function TravelTimeGraph({
  data,
  observers,
  currentTimeSec,
  isDark,
  selectedDistance,
  onSelectDistance,
}: TravelTimeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  // Store xScale in a ref so the click handler can read the current scale
  // without being included in the drawing effect's dependencies (Issue #3).
  const xScaleRef = useRef<d3.ScaleLinear<number, number>>(
    d3.scaleLinear().domain([0, 180]).range([0, 1]),
  );
  const { t } = useTranslation();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setSize(prev => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // D3 drawing effect — no event listeners registered here.
  useEffect(() => {
    const svg = svgRef.current;
    const { width, height } = size;
    if (!svg || width === 0 || height === 0) return;

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;
    if (innerW <= 0 || innerH <= 0) return;

    const textColor = isDark ? '#cbd5e1' : '#334155';
    const gridColor = isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)';

    d3.select(svg).selectAll('*').remove();

    const xScale = d3.scaleLinear().domain([0, 180]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, Y_MAX_SEC]).range([innerH, 0]);
    xScaleRef.current = xScale;

    const svgSel = d3.select(svg).attr('width', width).attr('height', height);

    // Glow filter for the curves
    const defs = svgSel.append('defs');
    const glow = defs.append('filter').attr('id', 'tt-glow').attr('x', '-20%').attr('y', '-20%').attr('width', '140%').attr('height', '140%');
    glow.append('feGaussianBlur').attr('stdDeviation', 2.2).attr('result', 'blur');
    const merge = glow.append('feMerge');
    merge.append('feMergeNode').attr('in', 'blur');
    merge.append('feMergeNode').attr('in', 'SourceGraphic');

    const root = svgSel.append('g').attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Shadow zone overlays
    root.append('rect')
      .attr('x', xScale(S_SHADOW_START_DEG)).attr('y', 0)
      .attr('width', innerW - xScale(S_SHADOW_START_DEG)).attr('height', innerH)
      .attr('fill', 'rgba(244,63,94,0.07)');
    root.append('rect')
      .attr('x', xScale(P_SHADOW_START_DEG)).attr('y', 0)
      .attr('width', xScale(P_SHADOW_END_DEG) - xScale(P_SHADOW_START_DEG)).attr('height', innerH)
      .attr('fill', 'rgba(251,146,60,0.12)');
    root.append('text')
      .attr('x', (xScale(P_SHADOW_START_DEG) + xScale(P_SHADOW_END_DEG)) / 2)
      .attr('y', innerH - 6)
      .attr('text-anchor', 'middle')
      .attr('font-size', 9)
      .attr('font-weight', 700)
      .attr('fill', '#fb923c')
      .text(t('shadowZone.P'));

    // Grid
    root.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickValues([0, 30, 60, 90, 120, 150, 180]).tickSize(-innerH).tickFormat(() => ''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('line').attr('stroke', gridColor));
    root.append('g')
      .call(d3.axisLeft(yScale).ticks(6).tickSize(-innerW).tickFormat(() => ''))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('line').attr('stroke', gridColor));

    // Axes
    root.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).tickValues([0, 30, 60, 90, 120, 150, 180]).tickFormat(d => `${d}°`).tickSize(0).tickPadding(6))
      .call(g => g.select('.domain').attr('stroke', gridColor))
      .call(g => g.selectAll('text').attr('fill', textColor).attr('font-size', 10));
    root.append('g')
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => `${d}s`).tickSize(0).tickPadding(6))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('text').attr('fill', textColor).attr('font-size', 10));

    root.append('text')
      .attr('x', innerW).attr('y', innerH + 28)
      .attr('text-anchor', 'end').attr('fill', textColor).attr('font-size', 10)
      .text(t('graph.xAxis'));
    root.append('text')
      .attr('x', -MARGIN.left + 4).attr('y', -12)
      .attr('fill', textColor).attr('font-size', 10)
      .text(t('graph.yAxis'));

    // "Now" line — curves grow up to it as time passes
    if (currentTimeSec > 0) {
      const y = yScale(Math.min(currentTimeSec, Y_MAX_SEC));
      root.append('line')
        .attr('x1', 0).attr('x2', innerW).attr('y1', y).attr('y2', y)
        .attr('stroke', '#fbbf24').attr('stroke-width', 1).attr('stroke-dasharray', '2,3').attr('opacity', 0.8);
      root.append('text')
        .attr('x', innerW - 2).attr('y', y - 3)
        .attr('text-anchor', 'end').attr('font-size', 9).attr('font-weight', 700).attr('fill', '#fbbf24')
        .text(`${t('graph.now')} ${Math.round(currentTimeSec)}s`);
    }

    // Travel-time curves — only arrived data points
    const arrivedData = data.filter(d => d.isArrived);
    const phases: WavePhase[] = ['P', 'S', 'PKP', 'PP', 'SKS'];

    for (const phase of phases) {
      let phaseData = arrivedData
        .filter(d => d.phase === phase)
        .sort((a, b) => a.distanceDeg - b.distanceDeg);

      // S-wave ends at the shadow zone boundary
      if (phase === 'S') {
        phaseData = phaseData.filter(d => d.distanceDeg <= S_SHADOW_START_DEG);
      }

      if (phaseData.length < 2) continue;

      const line = d3.line<TravelTimePoint>()
        .x(d => xScale(d.distanceDeg))
        .y(d => yScale(d.timeSec))
        .curve(d3.curveMonotoneX);

      root.append('path')
        .datum(phaseData)
        .attr('fill', 'none')
        .attr('stroke', PHASE_COLORS[phase])
        .attr('stroke-width', 2.5)
        .attr('stroke-linecap', 'round')
        .attr('filter', 'url(#tt-glow)')
        .attr('d', line);
    }

    // Selected distance indicator
    if (selectedDistance != null) {
      root.append('line')
        .attr('x1', xScale(selectedDistance)).attr('x2', xScale(selectedDistance))
        .attr('y1', 0).attr('y2', innerH)
        .attr('stroke', '#fbbf24').attr('stroke-width', 1.5).attr('stroke-dasharray', '4,3');
    }

    // Station arrivals as labelled dots
    for (const obs of observers) {
      for (const a of obs.arrivals) {
        if (!a.hasArrived) continue;
        const cx = xScale(obs.surfaceAngleDeg);
        const cy = yScale(a.travelTimeSec);
        root.append('circle')
          .attr('cx', cx).attr('cy', cy).attr('r', 4.5)
          .attr('fill', PHASE_COLORS[a.phase])
          .attr('stroke', isDark ? '#0b1020' : '#ffffff').attr('stroke-width', 1.5);
      }
      if (obs.arrivals.some(a => a.hasArrived)) {
        const first = Math.min(...obs.arrivals.filter(a => a.hasArrived).map(a => a.travelTimeSec));
        root.append('text')
          .attr('x', xScale(obs.surfaceAngleDeg)).attr('y', yScale(first) + 14)
          .attr('text-anchor', 'middle').attr('font-size', 9).attr('font-weight', 800)
          .attr('fill', textColor)
          .text(obs.label);
      }
    }

    // Phase legend
    const legendPhases: { phase: WavePhase; labelKey: string }[] = [
      { phase: 'P', labelKey: 'graph.pCurve' },
      { phase: 'S', labelKey: 'graph.sCurve' },
      { phase: 'PKP', labelKey: 'graph.pkpCurve' },
    ];
    const legend = root.append('g').attr('transform', `translate(${Math.max(0, innerW - 190)}, -16)`);
    legendPhases.forEach(({ phase, labelKey }, i) => {
      const lx = i * 64;
      legend.append('line')
        .attr('x1', lx).attr('x2', lx + 14)
        .attr('y1', 0).attr('y2', 0)
        .attr('stroke', PHASE_COLORS[phase]).attr('stroke-width', 3).attr('stroke-linecap', 'round');
      legend.append('text')
        .attr('x', lx + 18).attr('y', 3.5)
        .attr('fill', textColor).attr('font-size', 10).attr('font-weight', 700)
        .text(t(labelKey));
    });

    // No addEventListener here — click is handled via React onClick below.
  }, [data, observers, currentTimeSec, isDark, selectedDistance, size, t]);

  // React onClick: reads the current scale from the ref, so it never becomes
  // stale and does not need to be part of the drawing effect (Issue #3).
  const handleClick = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || !onSelectDistance) return;
    const rect = svg.getBoundingClientRect();
    const mx = e.clientX - rect.left - MARGIN.left;
    const deg = xScaleRef.current.invert(mx);
    onSelectDistance(Math.max(0, Math.min(180, deg)));
  }, [onSelectDistance]);

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        ref={svgRef}
        className="absolute inset-0 h-full w-full cursor-crosshair font-sans"
        onClick={handleClick}
      />
    </div>
  );
}
