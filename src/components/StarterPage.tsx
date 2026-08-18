import {
  ArrowRight,
  BookOpen,
  Building2,
  CheckCircle2,
  ChevronDown,
  HelpCircle,
  Library,
  LogOut,
  Mail,
  MessageCircle,
  Scale,
  Search,
  Send,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  Users,
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';

interface StarterPageProps {
  onEnterTracker: () => void;
}

type NavItem = {
  label: string;
  sub: string;
};

type NavGroup = {
  heading: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    heading: 'Research',
    items: [
      { label: 'Research', sub: 'AI Assistant' },
      { label: 'Research Library', sub: 'Saved prompts & reports' },
      { label: 'Saved Research', sub: 'Your conversations' },
    ],
  },
  {
    heading: 'Parliament',
    items: [
      { label: 'Members', sub: 'Elected representatives' },
      { label: 'Legislation', sub: 'Bills and amendments' },
      { label: 'Debates', sub: 'Parliamentary discussions' },
      { label: 'Voting', sub: 'Votes and divisions' },
    ],
  },
  {
    heading: 'AI Analytics',
    items: [
      { label: 'AI Integrity', sub: 'Detect AI-assisted text' },
      { label: 'Advanced AI Analytics', sub: 'Framing and rhetoric' },
      { label: 'Analytics', sub: 'Trends and insights' },
    ],
  },
  {
    heading: 'Platform',
    items: [
      { label: 'Architecture', sub: 'How it works' },
      { label: 'Responsible AI', sub: 'Our principles' },
      { label: 'About', sub: 'Mission and methodology' },
    ],
  },
];

const trustChips = [
  { title: 'Source Grounded', sub: 'Verified official records', icon: ShieldCheck },
  { title: 'Explainable', sub: 'Clear reasoning & evidence', icon: Search },
  { title: 'Verifiable', sub: 'Citations you can trust', icon: CheckCircle2 },
  { title: 'Responsible AI', sub: 'Designed for transparency', icon: Shield },
];

const researchGoals = [
  { label: 'Understand legislation', icon: BookOpen },
  { label: 'Analyze debate', icon: MessageCircle },
  { label: 'Compare parties', icon: Scale },
  { label: 'Track representatives', icon: Users },
  { label: 'Detect bias', icon: Target },
  { label: 'AI Integrity', icon: ShieldCheck },
];

const starterCards = [
  {
    title: 'Is the media accurately representing this debate?',
    text: 'Compare parliamentary statements with media coverage on the same topic.',
    cta: 'Try this prompt',
    color: 'text-blue-600 bg-blue-50',
    icon: MessageCircle,
  },
  {
    title: 'Has this member changed position over time?',
    text: "Analyze how a representative's stance on key issues has evolved.",
    cta: 'Try this prompt',
    color: 'text-emerald-600 bg-emerald-50',
    icon: Users,
  },
  {
    title: 'What themes dominate discussion on housing?',
    text: 'Identify key topics, concerns, and sentiment in housing-related debates.',
    cta: 'Try this prompt',
    color: 'text-violet-600 bg-violet-50',
    icon: Library,
  },
  {
    title: 'Does this speech show signs of AI assistance?',
    text: 'Detect potential AI usage and explain the confidence and evidence.',
    cta: 'Try this prompt',
    color: 'text-orange-600 bg-orange-50',
    icon: Scale,
  },
  {
    title: 'How did party members vote differently?',
    text: 'Compare voting patterns between parties on important legislation.',
    cta: 'Try this prompt',
    color: 'text-teal-600 bg-teal-50',
    icon: ShieldCheck,
  },
];

export default function StarterPage({ onEnterTracker }: StarterPageProps) {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isAdmin = useIsAdmin();
  const navigate = (section: string) => { setMenuOpen(false); window.history.pushState({}, '', '/' + section); window.dispatchEvent(new PopStateEvent('popstate')); };

  const handleSignOut = async () => { setMenuOpen(false); await signOut(auth); };

  return (
    <div className="min-h-screen bg-[#f8fbff] text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-[285px] shrink-0 bg-[var(--color-navy-950)] text-white lg:flex lg:flex-col">
          <div className="border-b border-[var(--color-navy-800)] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-teal-600)]/20 p-2 text-[var(--color-teal-100)]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">Parliament AI</p>
                <p className="mt-1 text-xs text-slate-300">Research Platform</p>
              </div>
            </div>
            <a
              href="/"
              className="mt-4 block w-full rounded-xl bg-[var(--color-teal-600)]/20 px-3 py-2 text-left text-sm font-semibold text-white transition hover:bg-[var(--color-teal-600)]/30"
            >
              Home
            </a>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-4">
            {navGroups.map((group, index) => (
              <div key={group.heading} className={index > 0 ? 'mt-4' : ''}>
                <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {group.heading}
                </p>
                <div className="space-y-1">
                  {group.items.map((item, itemIndex) => {
                    const active = group.heading === 'Research' && itemIndex === 0;
                    return (
                      <button
                        key={`${group.heading}-${item.label}`}
                        type="button"
                        onClick={onEnterTracker}
                        className={`w-full rounded-xl px-3 py-2 text-left transition ${
                          active
                            ? 'bg-[var(--color-teal-600)]/20 text-white'
                            : 'text-slate-200 hover:bg-[var(--color-navy-800)]'
                        }`}
                      >
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className={`text-xs ${active ? 'text-slate-100' : 'text-slate-400'}`}>{item.sub}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="m-3 rounded-xl border border-[var(--color-navy-800)] bg-[var(--color-navy-900)] p-3">
            <div className="flex items-center gap-2 text-[var(--color-teal-100)]">
              <Shield className="h-5 w-5" />
              <p className="font-semibold">Responsible AI</p>
            </div>
            <p className="mt-1 text-xs text-slate-300">Transparent. Explainable. Verifiable.</p>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white px-8 py-3.5">
            <div className="flex items-center justify-between text-sm text-slate-700">
              <div className="inline-flex items-center gap-1.5">
                <BookOpen className="h-4 w-4" />
                English
                <ChevronDown className="h-3.5 w-3.5" />
              </div>
              <div className="flex items-center gap-5">
                <button type="button" className="inline-flex items-center gap-1.5 hover:text-slate-900">
                  <Mail className="h-4 w-4" />
                  Subscribe
                </button>
                <button type="button" className="inline-flex items-center gap-1.5 hover:text-slate-900">
                  <HelpCircle className="h-4 w-4" />
                  Help
                </button>
                <div className="relative" ref={menuRef}>
                  <button type="button" onClick={() => setMenuOpen(o => !o)} className="inline-flex items-center gap-1.5 hover:text-slate-900">
                    <UserRound className="h-4 w-4" />
                    My Account
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                  {menuOpen && (
                    <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-50">
                      {user?.email && (
                        <div className="px-3 py-2 border-b border-slate-100">
                          <p className="text-xs font-medium text-slate-800 truncate">{user.email}</p>
                          <div className="flex items-center gap-1 mt-1">
                            {isAdmin
                              ? <><ShieldCheck className="h-3 w-3 text-[#14b8a6]" /><span className="text-xs text-[#14b8a6] font-medium">Admin</span></>
                              : <><UserRound className="h-3 w-3 text-slate-400" /><span className="text-xs text-slate-400">User</span></>
                            }
                          </div>
                        </div>
                      )}
                      {isAdmin && (
                        <button type="button" onClick={() => navigate('admin')} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors">
                          <ShieldCheck className="h-3.5 w-3.5 text-[#14b8a6]" />
                          Platform Admin
                        </button>
                      )}
                      <button type="button" onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-6 md:px-8">
            <div className="mx-auto max-w-[1080px] space-y-6">
              <section className="rounded-2xl border border-slate-200 bg-gradient-to-r from-white via-white to-[#f2f9ff] px-8 py-9 shadow-sm">
                <h1 className="text-center text-4xl font-bold leading-tight text-slate-900 md:text-[56px]">
                  What would you like to understand
                  <br />
                  about <span className="text-[var(--color-teal-600)]">democracy</span> today?
                </h1>
                <p className="mx-auto mt-4 max-w-3xl text-center text-[31px] leading-8 text-slate-700 md:text-[30px]">
                  Explore parliamentary debates, legislation, voting records, and members using natural language.
                  Every response is grounded in official parliamentary records.
                </p>

                <div className="mt-7 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                  {trustChips.map((chip) => {
                    const Icon = chip.icon;
                    return (
                      <div key={chip.title} className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm min-h-[74px]">
                        <div className="flex items-start gap-2">
                          <div className="rounded-md bg-emerald-50 p-1.5 text-emerald-600">
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900">{chip.title}</p>
                            <p className="text-xs text-slate-600">{chip.sub}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
                  <div className="flex flex-col gap-2 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg px-3 py-2">
                      <Sparkles className="h-4 w-4 text-[var(--color-teal-600)]" />
                      <input
                        type="text"
                        readOnly
                        value="What would you like to understand about democracy?"
                        className="w-full bg-transparent text-sm text-slate-600 outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={onEnterTracker}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-[var(--color-navy-900)] hover:bg-slate-50"
                    >
                      <Library className="h-4 w-4" />
                      Research Library
                    </button>
                    <button
                      type="button"
                      onClick={onEnterTracker}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-teal-600)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-teal-500)]"
                    >
                      <Send className="h-4 w-4" />
                      Send
                    </button>
                  </div>
                </div>

                <p className="mt-3 text-center text-sm text-slate-600">
                  Try asking about debates, bills, votes, representatives, or policy issues
                </p>
              </section>

              <section>
                <h2 className="mb-3 text-2xl font-semibold text-slate-900">Research Goals</h2>
                <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
                  {researchGoals.map((goal) => {
                    const Icon = goal.icon;
                    return (
                    <button
                      key={goal.label}
                      type="button"
                      onClick={onEnterTracker}
                      className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-700 shadow-sm hover:border-[var(--color-teal-600)] hover:text-[var(--color-teal-600)]"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 text-slate-400" />
                        {goal.label}
                      </span>
                    </button>
                  );
                  })}
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-2xl font-semibold text-slate-900">Investigation Starters</h2>
                  <button type="button" onClick={onEnterTracker} className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-navy-900)] hover:text-[var(--color-teal-600)]">
                    View all examples
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
                  {starterCards.map((card) => {
                    const Icon = card.icon;
                    return (
                      <article key={card.title} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm min-h-[255px]">
                        <div className={`inline-flex rounded-xl p-2 ${card.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <h3 className="mt-3 text-xl font-semibold leading-7 text-slate-900">{card.title}</h3>
                        <p className="mt-2 text-sm leading-6 text-slate-600">{card.text}</p>
                        <button
                          type="button"
                          onClick={onEnterTracker}
                          className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-teal-600)] hover:text-[var(--color-teal-500)]"
                        >
                          {card.cta}
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      </article>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-[var(--color-teal-100)] p-2 text-[var(--color-teal-600)]">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Built on Official Parliamentary Records</p>
                      <p className="text-sm text-slate-600">
                        This platform uses data from the Oireachtas Open Data API under the PSI Licence.
                        Data ingestion period: September 2025 - October 2025
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={onEnterTracker}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-[var(--color-navy-900)] hover:bg-slate-50"
                  >
                    How it works
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </section>

              <footer className="flex flex-col gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
                <p className="max-w-3xl">Parliament AI is politically neutral and non-partisan. Our mission is to promote transparency, accountability, and informed civic engagement.</p>
                <div className="flex items-center gap-4">
                  <span>© 2025 Parliament AI</span>
                  <button type="button" onClick={onEnterTracker} className="hover:text-slate-700">Privacy Policy</button>
                  <button type="button" onClick={onEnterTracker} className="hover:text-slate-700">Terms of Use</button>
                  <button type="button" onClick={onEnterTracker} className="hover:text-slate-700">Contact</button>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
