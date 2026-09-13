import { useEffect, useRef } from 'react';
import { Chart, type ChartDataset } from 'chart.js';
import '@/components/charts/chart-setup';

export interface ChartData {
  labels: string[];
  datasets: ChartDataset<'bar'>[];
}

export function BarChart({
  data,
  height = 260,
  ariaLabel = 'Bar chart',
}: {
  data: ChartData;
  height?: number;
  ariaLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const client = new Chart(canvasRef.current, {
      type: 'bar',
      data: { labels: data.labels, datasets: data.datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { y: { beginAtZero: true } },
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