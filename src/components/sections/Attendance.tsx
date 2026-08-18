import { CalendarDays, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PageHeader, PageMetric, PageShell, SectionCard } from '@/components/patterns';

const attendanceData = [
  { month: 'Jan', dail: 92, seanad: 88 },
  { month: 'Feb', dail: 89, seanad: 85 },
  { month: 'Mar', dail: 94, seanad: 90 },
  { month: 'Apr', dail: 91, seanad: 87 },
  { month: 'May', dail: 93, seanad: 89 },
  { month: 'Jun', dail: 90, seanad: 86 },
];

export default function Attendance() {
  return (
    <PageShell>
      <SectionCard className="p-6">
        <PageHeader
          title="Attendance Records"
          subtitle="Track participation across Dail and Seanad sessions."
        />
      </SectionCard>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SectionCard>
          <PageMetric
            label="Dail Average (Last 6 Months)"
            value="91.5%"
            icon={<Users className="h-5 w-5 text-[var(--color-teal-600)]" />}
            className="bg-transparent p-0 text-left"
          />
        </SectionCard>
        <SectionCard>
          <PageMetric
            label="Seanad Average (Last 6 Months)"
            value="87.5%"
            icon={<CalendarDays className="h-5 w-5 text-[var(--color-teal-600)]" />}
            className="bg-transparent p-0 text-left"
          />
        </SectionCard>
      </section>

      <SectionCard className="p-6">
        <h3 className="mb-4 text-lg font-semibold text-[var(--dai-ink)]">Attendance Trends</h3>
        <ResponsiveContainer width="100%" height={360}>
          <LineChart data={attendanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(var(--dai-border), 1)" />
            <XAxis dataKey="month" tick={{ fill: '#64748b' }} />
            <YAxis domain={[80, 100]} tick={{ fill: '#64748b' }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="dail" stroke="rgb(var(--dai-blue))" name="Dail" strokeWidth={2} />
            <Line type="monotone" dataKey="seanad" stroke="rgb(var(--dai-green))" name="Seanad" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </SectionCard>
    </PageShell>
  );
}
