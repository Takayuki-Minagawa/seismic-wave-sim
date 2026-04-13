import { useEffect, useRef, useCallback } from 'react';
import * as d3 from 'd3';
import { useTranslation } from 'react-i18next';
import { TravelTimePoint } from '../../hooks/useTravelTimeData';
import { WavePhase } from '../../physics/types';
import { WAVE_COLORS } from '../../utils/colorScale';

interface TravelTimeGraphProps {
  data: TravelTimePoint[];
  isDark: boolean;
  selectedDistance?: number | null;
  onSelectDistance?: (deg: number | null) => void;
}

const MARGIN = { top: 20, right: 20, bottom: 40, left: 55 };

const PHASE_COLORS: Record<WavePhase, string> = {
  P: WAVE_COLORS.P.stroke,
  S: WAVE_COLORS.S.stroke,
  PKP: WAVE_COLORS.PKP.stroke,
  PP: WAVE_COLORS.PP.stroke,
  SKS: '#10b981',
};

export function TravelTimeGraph({
  data,
  isDark,
  selectedDistance,
  onSelectDistance,
}: TravelTimeGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Store xScale in a ref so the click handler can read the current scale
  // without being included in the drawing effect's dependencies (Issue #3).
  const xScaleRef = useRef<d3.ScaleLinear<number, number>>(
    d3.scaleLinear().domain([0, 180]).range([0, 1]),
  );
  const { t } = useTranslation();

  // D3 drawing effect — no event listeners registered here.
  useEffect(() => {
    const svg = svgRef.current;
    const container = containerRef.current;
    if (!svg || !container) return;

    const { width, height } = container.getBoundingClientRect();
    if (width === 0 || height === 0) return;

    const innerW = width - MARGIN.left - MARGIN.right;
    const innerH = height - MARGIN.top - MARGIN.bottom;

    const textColor = isDark ? '#d1d5db' : '#374151';
    const gridColor = isDark ? '#374151' : '#e5e7eb';

    d3.select(svg).selectAll('*').remove();

    const xScale = d3.scaleLinear().domain([0, 180]).range([0, innerW]);
    const yScale = d3.scaleLinear().domain([0, 2400]).range([innerH, 0]);

    // Keep scale up-to-date for the click handler.
    xScaleRef.current = xScale;

    const root = d3.select(svg)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${MARGIN.left},${MARGIN.top})`);

    // Grid lines
    root.append('g')
      .attr('class', 'grid')
      .attr('transform', `translate(0,${innerH})`)
      .call(
        d3.axisBottom(xScale)
          .ticks(9)
          .tickSize(-innerH)
          .tickFormat(() => ''),
      )
      .select('.domain').remove();
    root.selectAll('.grid line').attr('stroke', gridColor);

    root.append('g')
      .attr('class', 'grid-y')
      .call(
        d3.axisLeft(yScale)
          .ticks(6)
          .tickSize(-innerW)
          .tickFormat(() => ''),
      )
      .select('.domain').remove();
    root.selectAll('.grid-y line').attr('stroke', gridColor);

    // Axes
    root.append('g')
      .attr('transform', `translate(0,${innerH})`)
      .call(d3.axisBottom(xScale).ticks(9).tickFormat(d => `${d}°`))
      .selectAll('text').attr('fill', textColor);
    root.select('.domain').attr('stroke', gridColor);

    root.append('g')
      .call(d3.axisLeft(yScale).ticks(6).tickFormat(d => `${d}s`))
      .selectAll('text').attr('fill', textColor);

    // Axis labels
    root.append('text')
      .attr('x', innerW / 2)
      .attr('y', innerH + 35)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', 11)
      .text(t('graph.xAxis'));

    root.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerH / 2)
      .attr('y', -42)
      .attr('text-anchor', 'middle')
      .attr('fill', textColor)
      .attr('font-size', 11)
      .text(t('graph.yAxis'));

    // Shadow zone overlays
    root.append('rect')
      .attr('x', xScale(103))
      .attr('y', 0)
      .attr('width', xScale(143) - xScale(103))
      .attr('height', innerH)
      .attr('fill', 'rgba(251,146,60,0.1)');

    root.append('rect')
      .attr('x', xScale(103))
      .attr('y', 0)
      .attr('width', innerW - xScale(103))
      .attr('height', innerH)
      .attr('fill', 'rgba(239,68,68,0.07)');

    // Travel-time curves — only arrived data points
    const arrivedData = data.filter(d => d.isArrived);
    const phases: WavePhase[] = ['P', 'S', 'PKP', 'PP', 'SKS'];

    for (const phase of phases) {
      let phaseData = arrivedData
        .filter(d => d.phase === phase)
        .sort((a, b) => a.distanceDeg - b.distanceDeg);

      // S-wave ends at the shadow zone boundary
      if (phase === 'S') {
        phaseData = phaseData.filter(d => d.distanceDeg <= 103);
      }

      if (phaseData.length < 2) continue;

      const line = d3.line<TravelTimePoint>()
        .x(d => xScale(d.distanceDeg))
        .y(d => yScale(d.timeSec))
        .curve(d3.curveCatmullRom);

      root.append('path')
        .datum(phaseData)
        .attr('fill', 'none')
        .attr('stroke', PHASE_COLORS[phase])
        .attr('stroke-width', 2)
        .attr('opacity', 0.85)
        .attr('d', line);
    }

    // Selected distance indicator
    if (selectedDistance != null) {
      root.append('line')
        .attr('x1', xScale(selectedDistance))
        .attr('x2', xScale(selectedDistance))
        .attr('y1', 0)
        .attr('y2', innerH)
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '4,3');
    }

    // Phase legend
    const legendPhases: { phase: WavePhase; labelKey: string }[] = [
      { phase: 'P', labelKey: 'graph.pCurve' },
      { phase: 'S', labelKey: 'graph.sCurve' },
      { phase: 'PKP', labelKey: 'graph.pkpCurve' },
    ];
    legendPhases.forEach(({ phase, labelKey }, i) => {
      const lx = 5 + i * 55;
      root.append('line')
        .attr('x1', lx).attr('x2', lx + 15)
        .attr('y1', 8).attr('y2', 8)
        .attr('stroke', PHASE_COLORS[phase])
        .attr('stroke-width', 2);
      root.append('text')
        .attr('x', lx + 18).attr('y', 12)
        .attr('fill', textColor)
        .attr('font-size', 10)
        .text(t(labelKey));
    });

    // No addEventListener here — click is handled via React onClick below.
  }, [data, isDark, selectedDistance, t]);

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
    <div ref={containerRef} className="w-full h-full">
      <svg
        ref={svgRef}
        className="w-full h-full cursor-crosshair"
        onClick={handleClick}
      />
    </div>
  );
}
