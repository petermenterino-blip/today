import { logger } from './logger';

type MetricType = 'query' | 'render' | 'network' | 'realtime' | 'upload' | 'navigation';

interface PerformanceMetric {
  type: MetricType;
  name: string;
  duration: number;
  timestamp: number;
  context?: Record<string, unknown>;
}

const MAX_METRICS = 200;
const metrics: PerformanceMetric[] = [];
let isTracking = false;

export function startPerformanceTracking(): void {
  if (isTracking) return;
  isTracking = true;
  logger.info('Performance', 'Performance tracking started');

  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('unload', () => {
      isTracking = false;
    });
  }
}

export function stopPerformanceTracking(): void {
  isTracking = false;
  logger.info('Performance', 'Performance tracking stopped');
}

export function recordMetric(
  type: MetricType,
  name: string,
  duration: number,
  context?: Record<string, unknown>
): void {
  if (!isTracking) return;

  const metric: PerformanceMetric = { type, name, duration, timestamp: Date.now(), context };
  metrics.push(metric);
  if (metrics.length > MAX_METRICS) metrics.shift();
}

export function getPerformanceReport(): {
  averageQueryTime: number;
  averageRenderTime: number;
  averageNetworkTime: number;
  slowQueries: PerformanceMetric[];
  totalMetrics: number;
  summary: string;
} {
  const queryMetrics = metrics.filter((m) => m.type === 'query');
  const renderMetrics = metrics.filter((m) => m.type === 'render');
  const networkMetrics = metrics.filter((m) => m.type === 'network');

  const avg = (arr: PerformanceMetric[]) =>
    arr.length > 0 ? Math.round(arr.reduce((s, m) => s + m.duration, 0) / arr.length) : 0;

  const slowQueries = queryMetrics.filter((m) => m.duration > 1000);

  return {
    averageQueryTime: avg(queryMetrics),
    averageRenderTime: avg(renderMetrics),
    averageNetworkTime: avg(networkMetrics),
    slowQueries,
    totalMetrics: metrics.length,
    summary: [
      `Queries: ${queryMetrics.length} (avg ${avg(queryMetrics)}ms, ${slowQueries.length} slow)`,
      `Renders: ${renderMetrics.length} (avg ${avg(renderMetrics)}ms)`,
      `Network: ${networkMetrics.length} (avg ${avg(networkMetrics)}ms)`,
    ].join(' | '),
  };
}

export function clearMetrics(): void {
  metrics.length = 0;
}

export function recordQueryDuration(name: string, duration: number): void {
  recordMetric('query', name, duration);
}

export function recordRenderDuration(name: string, duration: number): void {
  recordMetric('render', name, duration);
}

export function createQueryTimer(name: string): () => void {
  const start = performance.now();
  return () => {
    const duration = performance.now() - start;
    recordQueryDuration(name, duration);
    if (duration > 1000) {
      logger.warn('Performance', `Slow query: ${name}`, { duration: `${Math.round(duration)}ms` });
    }
  };
}
