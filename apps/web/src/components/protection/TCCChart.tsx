import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { useProjectStore } from '../../stores/projectStore';
import { calculateRatedCurrent } from '../../utils/calculations';
import type { CircuitBreaker, Generator, Load } from '../../types';

interface TCCChartProps {
  selectedBreakerId?: string;
  selectedGeneratorId?: string;
  selectedLoadId?: string;
}

// Generate a simple inverse-time trip curve for visualization
function generateTripCurve(ratedCurrentA: number, type: 'thermal' | 'magnetic'): [number, number][] {
  const points: [number, number][] = [];
  const multiples = [1.05, 1.1, 1.2, 1.3, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20];

  for (const mult of multiples) {
    const current = ratedCurrentA * mult;
    let time: number;
    if (type === 'thermal') {
      // Inverse time characteristic: t = k / (I/Ir)^2 - 1
      const ratio = mult;
      if (ratio <= 1.05) time = 3600;
      else time = Math.max(0.01, 80 / (ratio * ratio - 1));
    } else {
      // Magnetic trip (instantaneous above threshold)
      if (mult < 8) time = 100 / (mult * mult - 1);
      else time = 0.02;
    }
    points.push([current, time]);
  }
  return points;
}

// Cable damage curve (I2t based)
function generateCableDamageCurve(ampacity: number): [number, number][] {
  const points: [number, number][] = [];
  const k = ampacity * ampacity * 100; // simplified I2t
  for (let mult = 1; mult <= 20; mult += 0.5) {
    const current = ampacity * mult;
    const time = k / (current * current);
    if (time >= 0.01) {
      points.push([current, time]);
    }
  }
  return points;
}

// Generator damage curve
function generateGenDamageCurve(ratedCurrentA: number): [number, number][] {
  const points: [number, number][] = [];
  for (let mult = 1; mult <= 15; mult += 0.5) {
    const current = ratedCurrentA * mult;
    const time = Math.max(0.05, (ratedCurrentA * ratedCurrentA * 30) / (current * current));
    points.push([current, time]);
  }
  return points;
}

export default function TCCChart({ selectedBreakerId, selectedGeneratorId, selectedLoadId }: TCCChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; current: number; time: number } | null>(null);
  const { project } = useProjectStore();

  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = { top: 30, right: 40, bottom: 50, left: 60 };
    const width = 700 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Log scales
    const xScale = d3.scaleLog()
      .domain([10, 100000])
      .range([0, width]);

    const yScale = d3.scaleLog()
      .domain([0.01, 10000])
      .range([height, 0]);

    // Grid
    const xGridValues = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];
    const yGridValues = [0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000];

    // X grid
    g.selectAll('.grid-x')
      .data(xGridValues)
      .enter()
      .append('line')
      .attr('class', 'grid-x')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .attr('stroke', '#112a45')
      .attr('stroke-width', 0.5);

    // Y grid
    g.selectAll('.grid-y')
      .data(yGridValues)
      .enter()
      .append('line')
      .attr('class', 'grid-y')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#112a45')
      .attr('stroke-width', 0.5);

    // Axes
    const xAxis = d3.axisBottom(xScale)
      .tickValues([10, 100, 1000, 10000, 100000])
      .tickFormat(d3.format('.0f'));

    const yAxis = d3.axisLeft(yScale)
      .tickValues([0.01, 0.1, 1, 10, 100, 1000, 10000])
      .tickFormat(d3.format('.2~f'));

    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#9ca3af')
      .style('font-size', '10px');

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#9ca3af')
      .style('font-size', '10px');

    // Axis labels
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 40)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .style('font-size', '11px')
      .text('전류 Current (A)');

    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .style('font-size', '11px')
      .text('시간 Time (sec)');

    // Line generator
    const line = d3.line<[number, number]>()
      .x(d => xScale(d[0]))
      .y(d => yScale(d[1]))
      .defined(d => d[0] > 0 && d[1] > 0 && d[0] <= 100000 && d[1] <= 10000 && d[1] >= 0.01)
      .curve(d3.curveMonotoneX);

    // Draw sample breaker trip curves based on project data
    const breakers = project.breakers.length > 0 ? project.breakers : generateSampleBreakers();
    const colors = ['#4fc3f7', '#ce93d8', '#4caf50', '#ffd54f', '#ff6b35', '#ef5350'];

    breakers.forEach((breaker, i) => {
      const curve = generateTripCurve(breaker.ratedCurrentA, 'thermal');
      const color = colors[i % colors.length];
      const isSelected = breaker.id === selectedBreakerId;

      g.append('path')
        .datum(curve)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', color)
        .attr('stroke-width', isSelected ? 3 : 1.5)
        .attr('stroke-opacity', isSelected ? 1 : 0.7)
        .attr('stroke-dasharray', isSelected ? '' : '');

      // Label
      const lastPoint = curve[curve.length - 2];
      if (lastPoint) {
        g.append('text')
          .attr('x', xScale(lastPoint[0]) + 5)
          .attr('y', yScale(lastPoint[1]))
          .attr('fill', color)
          .style('font-size', '9px')
          .text(breaker.name);
      }
    });

    // Draw generator damage curves
    project.generators.forEach((gen, i) => {
      const ratedI = calculateRatedCurrent(gen.ratedPowerKW, gen.ratedVoltage, gen.ratedPF, gen.phase);
      const curve = generateGenDamageCurve(ratedI);
      const isSelected = gen.id === selectedGeneratorId;

      g.append('path')
        .datum(curve)
        .attr('d', line)
        .attr('fill', 'none')
        .attr('stroke', '#ff6b35')
        .attr('stroke-width', isSelected ? 2.5 : 1)
        .attr('stroke-dasharray', '6,3')
        .attr('stroke-opacity', isSelected ? 1 : 0.5);
    });

    // Mouse tracking overlay
    const overlay = g.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all');

    const crosshairV = g.append('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3,3')
      .style('display', 'none');

    const crosshairH = g.append('line')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 0.5)
      .attr('stroke-dasharray', '3,3')
      .style('display', 'none');

    overlay
      .on('mousemove', (event: MouseEvent) => {
        const [mx, my] = d3.pointer(event);
        const current = xScale.invert(mx);
        const time = yScale.invert(my);

        crosshairV.style('display', '').attr('x1', mx).attr('x2', mx).attr('y1', 0).attr('y2', height);
        crosshairH.style('display', '').attr('x1', 0).attr('x2', width).attr('y1', my).attr('y2', my);

        setTooltipData({
          x: event.offsetX,
          y: event.offsetY,
          current: Math.round(current),
          time: Number(time.toFixed(3)),
        });
      })
      .on('mouseout', () => {
        crosshairV.style('display', 'none');
        crosshairH.style('display', 'none');
        setTooltipData(null);
      });

  }, [project, selectedBreakerId, selectedGeneratorId, selectedLoadId]);

  return (
    <div className="relative">
      <svg ref={svgRef} className="bg-navy-900 rounded-lg border border-navy-600" />
      {tooltipData && (
        <div
          className="absolute pointer-events-none bg-navy-800 border border-navy-600 rounded px-2 py-1 text-xs font-mono text-gray-300 z-10"
          style={{ left: tooltipData.x + 15, top: tooltipData.y - 10 }}
        >
          {tooltipData.current} A / {tooltipData.time} sec
        </div>
      )}
    </div>
  );
}

function generateSampleBreakers(): CircuitBreaker[] {
  return [
    {
      id: 'sample-cb-1', name: 'CB-DG1 (400A)', type: 'MCCB',
      ratedCurrentA: 400, ratedVoltage: 440, breakingCapacityKA: 35,
      connectedFromId: '', connectedToId: '', isClosed: true,
    },
    {
      id: 'sample-cb-2', name: 'CB-DG2 (400A)', type: 'MCCB',
      ratedCurrentA: 400, ratedVoltage: 440, breakingCapacityKA: 35,
      connectedFromId: '', connectedToId: '', isClosed: true,
    },
    {
      id: 'sample-cb-3', name: 'CB-Pump (100A)', type: 'MCCB',
      ratedCurrentA: 100, ratedVoltage: 440, breakingCapacityKA: 25,
      connectedFromId: '', connectedToId: '', isClosed: true,
    },
    {
      id: 'sample-cb-4', name: 'CB-Fan (63A)', type: 'MCCB',
      ratedCurrentA: 63, ratedVoltage: 440, breakingCapacityKA: 25,
      connectedFromId: '', connectedToId: '', isClosed: true,
    },
  ];
}
