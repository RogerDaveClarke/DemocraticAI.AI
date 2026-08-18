import {
  Activity,
  BadgeInfo,
  BookOpen,
  Building2,
  CheckCircle2,
  FileText,
  Gamepad2,
  HelpCircle,
  Home,
  Landmark,
  Library,
  MessageCircle,
  Shield,
  ShieldCheck,
  Target,
  Users,
  Settings2,
} from 'lucide-react';
import type { ElementType } from 'react';

interface AppSidebarProps {
  currentSection: string;
  onBackToHome: () => void;
  onSectionChange: (section: string) => void;
}

type NavItem = {
  id: string;
  label: string;
  icon: ElementType;
  description?: string;
};

type NavGroup = {
  heading: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    heading: 'Main',
    items: [
      { id: 'research', label: 'Research', icon: MessageCircle, description: 'AI Assistant' },
      { id: 'research-library', label: 'Research Library', icon: Library, description: 'Saved prompts & reports' },
      { id: 'saved-research', label: 'Saved Research', icon: BookOpen, description: 'Your conversations' },
    ],
  },
  {
    heading: 'Parliament',
    items: [
      { id: 'officials', label: 'Elected Officials', icon: Users, description: 'Elected representatives' },
      { id: 'statistics', label: 'Legislation', icon: FileText, description: 'Bills and amendments' },
      { id: 'debates', label: 'Debates', icon: MessageCircle, description: 'Parliamentary discussions' },
      { id: 'voting', label: 'Voting', icon: CheckCircle2, description: 'Votes and divisions' },
    ],
  },
  {
    heading: 'AI Analytics',
    items: [
      { id: 'advanced-ai-analytics', label: 'Advanced AI Analytics', icon: Target, description: 'Linguistic & behavioral insights' },
      { id: 'ai-integrity', label: 'AI Integrity', icon: ShieldCheck, description: 'Detect AI-assisted text' },
    ],
  },
  {
    heading: 'General',
    items: [
      { id: 'qa', label: 'Questions & Answers', icon: HelpCircle, description: 'Parliamentary questions and responses' },
      { id: 'attendance', label: 'Attendance', icon: CheckCircle2, description: 'Session participation records' },
      { id: 'personas', label: 'Personas', icon: Users, description: 'Ministerial profile cards' },
      { id: 'virtual-dail', label: 'Virtual Dail', icon: Building2, description: 'Simulated chamber experience' },
      { id: 'analytics', label: 'Analytics', icon: Activity, description: 'Platform usage and trends', adminOnly: true },
      { id: 'fun', label: 'Fun', icon: Gamepad2, description: 'Interactive experiences' },
    ],
  },
  {
    heading: 'Platform',
    items: [
      { id: 'platform-status', label: 'Platform Status', icon: Activity, description: 'Data, health & configuration' },
      { id: 'architecture', label: 'Architecture', icon: Building2, description: 'How it works' },
      { id: 'responsible-ai', label: 'Responsible AI', icon: Shield, description: 'Our principles' },
      { id: 'about', label: 'About', icon: BadgeInfo, description: 'Mission and methodology' },
    ],
  },
  {
    heading: 'Admin',
    items: [
      { id: 'admin', label: 'Admin', icon: Settings2, description: 'Users, requests & features', adminOnly: true },
    ],
  },];

export default function AppSidebar({ currentSection, onBackToHome, onSectionChange, isAdmin = false }: AppSidebarProps) {
  const homeActive = currentSection === 'home';

  return (
    <div className="w-[285px] bg-[var(--color-navy-950)] text-white border-r border-[var(--color-navy-800)] flex flex-col h-screen fixed left-0 top-0">
      <div className="px-5 pt-4 pb-4 border-b border-[var(--color-navy-800)]">
        <div className="mb-2 flex items-start gap-3">
          <Landmark className="h-8 w-8 text-[var(--color-teal-500)]" />
          <div>
            <h1 className="whitespace-nowrap text-[24px] font-bold leading-tight text-white">Parliament AI</h1>
            <p className="mt-1 text-[13px] leading-none text-slate-300">Research Platform</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onBackToHome}
          aria-current={homeActive ? 'page' : undefined}
          className="mt-4 flex w-full items-center gap-3 rounded-xl bg-gradient-to-r from-teal-700 to-teal-600 px-3 py-3 text-left text-[18px] font-semibold text-white shadow-sm transition hover:from-teal-600 hover:to-teal-500"
        >
          <Home className="h-5 w-5" />
          <span>Home</span>
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto py-2">
        {navGroups.map((group) => (
          <div key={group.heading} className="mb-4">
            <div className="px-6 pb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {group.heading}
            </div>
            {group.items.filter((item) => !item.adminOnly || isAdmin).map((item) => {
              const isActive = currentSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={`${group.heading}-${item.label}`}
                  onClick={() => onSectionChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`w-full text-left px-5 py-2.5 transition-colors ${isActive ? 'bg-[var(--color-teal-600)]/20 border-l-4 border-[var(--color-teal-400)] text-white' : 'text-slate-200 hover:bg-[var(--color-navy-800)] border-l-4 border-transparent'}`}
                >
                  <div className={`flex items-center gap-2 font-medium ${isActive ? 'text-white' : 'text-slate-100'}`}>
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </div>
                  {item.description && (
                    <div className={`text-xs mt-0.5 pl-6 ${isActive ? 'text-slate-100' : 'text-slate-400'}`}>
                      {item.description}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--color-navy-800)] p-4">
        <div className="rounded-xl border border-[var(--color-navy-800)] bg-[var(--color-navy-900)] p-3">
          <div className="flex items-center gap-2 text-[var(--color-teal-100)]">
            <Shield className="h-5 w-5" />
            <p className="font-semibold">Responsible AI</p>
          </div>
          <p className="mt-1 text-xs text-slate-300">Transparent. Explainable. Verifiable.</p>
        </div>
      </div>
    </div>
  );
}
