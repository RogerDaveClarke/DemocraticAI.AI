import AdvancedAnalyticsModal from '../modals/AdvancedAnalyticsModal';
import { PageShell, SectionCard } from '@/components/patterns';

interface SentimentProps {
  featureId?: string;
}

export default function Sentiment({ featureId = 'question-patterns' }: SentimentProps) {
  return (
    <PageShell className="min-h-screen">
      <SectionCard className="p-0">
        <AdvancedAnalyticsModal
          isOpen={true}
          onClose={() => {}}
          featureId={featureId}
          embedded={true}
        />
      </SectionCard>
    </PageShell>
  );
}
