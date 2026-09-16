import { useEffect, useRef } from 'react';
import { Chart, type ChartDataset } from 'chart.js';
import '@/components/charts/chart-setup';

export interface LineChartData {
  labels: string[];
  datasets: ChartDataset<'line'>[];
}

export function LineChart({
  data,
  height = 260,
  ariaLabel = 'Line chart',
}: {
  data: LineChartData;
  height?: number;
  ariaLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const client = new Chart(canvasRef.current, {
      type: 'line',
      data: { labels: data.labels, datasets: data.datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
        elements: { line: { tension: 0.3 } },
      },
    });
    chartRef.current = client;
    return () => {
      client.destroy();
      chartRef.current = null;
    };
  }, [data]);

  return (
    <div style={{ height }} role="img" aria-label={ariaLabel}>
      <canvas ref={canvasRef} />
    </div>
  );
}
