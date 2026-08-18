import { useEffect, useState } from 'react';
import { BarChart3, Clock3, DollarSign, MessageSquare, TrendingUp } from 'lucide-react';
import { PageHeader, PageMetric, PageShell, SectionCard } from '@/components/patterns';
import { API_URL } from '@/config/runtime';

type Metrics = {
  totalQueries: number;
  avgResponseTime: number;
  avgCost: number;
  satisfaction: number;
};

const defaultMetrics: Metrics = {
  totalQueries: 0,
  avgResponseTime: 0,
  avgCost: 0,
  satisfaction: 0,
};

export default function Analytics() {
  const [metrics, setMetrics] = useState<Metrics>(defaultMetrics);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        const response = await fetch(`${API_URL}/api/chat/metrics`);
        if (response.ok) {
          const data = await response.json();
          setMetrics({
            totalQueries: data.totalQueries ?? 0,
            avgResponseTime: data.avgResponseTime ?? 0,
            avgCost: data.avgCost ?? 0,
            satisfaction: data.satisfaction ?? 0,
          });
          return;
        }
      } catch {
        // Ignore and fall back to local metrics.
      }

      const localMetrics = localStorage.getItem('chat-metrics');
      if (localMetrics) {
        const parsed = JSON.parse(localMetrics);
        setMetrics({
          totalQueries: parsed.totalQueries ?? 0,
          avgResponseTime: parsed.avgResponseTime ?? 0,
          avgCost: parsed.avgCost ?? 0,
          satisfaction: parsed.satisfaction ?? 0,
        });
      }
    };

    loadMetrics().finally(() => setLoading(false));
  }, []);

  return (
    <PageShell>
      <SectionCard className="p-6">
        <PageHeader
          title="Analytics"
          subtitle="Trends and insights from research activity and AI usage."
        />
      </SectionCard>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SectionCard>
          <PageMetric
            label="Total Queries"
            value={loading ? '...' : metrics.totalQueries}
            icon={<MessageSquare className="h-5 w-5 text-[var(--color-teal-600)]" />}
            className="bg-transparent p-0 text-left"
          />
        </SectionCard>

        <SectionCard>
          <PageMetric
            label="Avg Response Time"
            value={loading ? '...' : `${metrics.avgResponseTime.toFixed(1)}s`}
            icon={<Clock3 className="h-5 w-5 text-[var(--color-teal-600)]" />}
            className="bg-transparent p-0 text-left"
          />
        </SectionCard>

        <SectionCard>
          <PageMetric
            label="Cost per Query"
            value={loading ? '...' : `$${metrics.avgCost.toFixed(4)}`}
            icon={<DollarSign className="h-5 w-5 text-[var(--color-teal-600)]" />}
            className="bg-transparent p-0 text-left"
          />
        </SectionCard>

        <SectionCard>
          <PageMetric
            label="Satisfaction"
            value={loading ? '...' : `${(metrics.satisfaction * 100).toFixed(0)}%`}
            icon={<TrendingUp className="h-5 w-5 text-[var(--color-teal-600)]" />}
            className="bg-transparent p-0 text-left"
          />
        </SectionCard>
      </section>

      <SectionCard className="p-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-[var(--color-teal-600)]" />
            <h2 className="text-xl font-semibold text-[var(--dai-ink)]">Overview</h2>
        </div>
          <p className="mt-3 text-[var(--dai-slate)]">
          This page provides operational analytics for platform usage. Saved items, reports, and
          conversation archives are available under Saved Research.
        </p>
      </SectionCard>
    </PageShell>
  );
}
