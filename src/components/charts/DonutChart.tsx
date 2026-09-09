import { useEffect, useRef } from 'react';
import { Chart, type ChartDataset } from 'chart.js';
import '@/components/charts/chart-setup';

export function DonutChart({
  data,
  height = 240,
  ariaLabel = 'Donut chart',
}: {
  data: { labels: string[]; datasets: ChartDataset<'doughnut'>[] };
  height?: number;
  ariaLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const client = new Chart(canvasRef.current, {
      type: 'doughnut',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
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