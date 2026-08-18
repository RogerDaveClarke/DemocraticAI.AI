import { MessageSquareText } from 'lucide-react';
import { PageHeader, PageShell, SectionCard, StatusBadge } from '@/components/patterns';

export default function QuestionsAnswers() {
  return (
    <PageShell>
      <SectionCard className="p-6">
        <PageHeader
          title="Questions & Answers"
          subtitle="Review recent parliamentary questions and ministerial responses."
        />
      </SectionCard>

      <SectionCard className="p-6">
        <h3 className="mb-4 inline-flex items-center gap-2 text-lg font-semibold text-[var(--dai-ink)]">
          <MessageSquareText className="h-5 w-5 text-[var(--color-teal-600)]" />
          Recent Questions
        </h3>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="border-b border-[var(--dai-border)] pb-4 last:border-0">
              <div className="mb-2 flex items-start justify-between">
                <h4 className="font-medium text-[var(--dai-ink)]">Question about healthcare services</h4>
                <span className="text-xs text-[var(--dai-slate)]">2 days ago</span>
              </div>
              <p className="mb-2 text-sm text-[var(--dai-slate)]">
                Asked by Deputy John Smith to the Minister of Health
              </p>
              <StatusBadge status="active" label="Answered" />
            </div>
          ))}
        </div>
      </SectionCard>
    </PageShell>
  );
}

