import { useState, lazy, Suspense, useEffect } from 'react';
import StarterPage from './components/StarterPage';
import AppSidebar from './components/AppSidebar';
import AppHeader from './components/AppHeader';
import { SkipNavigation } from './components/accessibility/AccessibilityComponents';
import { AccessibilityTestingPanel } from './components/accessibility/AccessibilityTestingPanel';
import { useRouteAnnouncer } from './hooks/accessibilityHooks';
import { pageView, event } from './utils/analytics';
import { useIsAdmin } from './hooks/useIsAdmin';
import { useAuth } from './hooks/useAuth';
import SignInPage from './components/SignInPage';
import MfaEnrollModal from './components/MfaEnrollModal';
import { multiFactor, signOut } from 'firebase/auth';
import { auth } from './config/firebase';

const Enquire = lazy(() => import('./components/sections/Enquire'));
const Home = lazy(() => import('./components/sections/Home'));
const AIInsights = lazy(() => import('./components/sections/AIInsights'));
const SavedResearch = lazy(() => import('./components/sections/SavedResearch'));
const AIIntegrity = lazy(() => import('./components/sections/AIIntegrity'));
const ResponsibleAI = lazy(() => import('./components/sections/ResponsibleAI'));
const PlatformStatus = lazy(() => import('./components/sections/PlatformStatus'));
const Architecture = lazy(() => import('./components/sections/Architecture'));
const Officials = lazy(() => import('./components/sections/OfficialsNew'));
const Personas = lazy(() => import('./components/sections/Personas'));
const Debates = lazy(() => import('./components/sections/Debates'));
const Voting = lazy(() => import('./components/sections/Voting'));
const QuestionsAnswers = lazy(() => import('./components/sections/QuestionsAnswers'));
const Sentiment = lazy(() => import('./components/sections/Sentiment'));
const Attendance = lazy(() => import('./components/sections/Attendance'));
const Statistics = lazy(() => import('./components/sections/Statistics'));
const Analytics = lazy(() => import('./components/sections/Analytics'));
const Fun = lazy(() => import('./components/sections/Fun'));
const VirtualDail = lazy(() => import('./components/features/VirtualDail'));
const About = lazy(() => import('./components/sections/About'));
const Admin = lazy(() => import('./components/sections/Admin'));

type Section = 'home' | 'research' | 'admin' | 'research-library' | 'saved-research' | 'ai-integrity' | 'responsible-ai' | 'platform-status' | 'about' | 'architecture' | 'virtual-dail' | 'officials' | 'personas' | 'debates' | 'voting' | 'qa' | 'advanced-ai-analytics' | 'bias-detection' | 'attendance' | 'statistics' | 'analytics' | 'fun';

const DEFAULT_SECTION: Section = 'home';

const legacySectionAliases: Record<string, Section> = {
  'ai-insights': 'research-library',
  'ai-research': 'research-library',
  sentiment: 'advanced-ai-analytics',
  senitment: 'advanced-ai-analytics',
};

const getPathname = () => window.location.pathname;

const isSection = (value: string): value is Section => {
  return [
    'home',
    'research',
    'research-library',
    'saved-research',
    'ai-integrity',
    'responsible-ai',
    'platform-status',
    'about',
    'architecture',
    'virtual-dail',
    'officials',
    'personas',
    'debates',
    'voting',
    'qa',
    'advanced-ai-analytics',
    'bias-detection',
    'attendance',
    'statistics',
    'analytics',
    'admin',
    'fun',
  ].includes(value);
};

const getSectionFromPath = (pathname: string): Section => {
  const match = pathname.match(/^\/([^/]+)\/?$/);

  if (!match) {
    return DEFAULT_SECTION;
  }

  const section = match[1];

  if (section && legacySectionAliases[section]) {
    return legacySectionAliases[section];
  }

  return section && isSection(section) ? section : DEFAULT_SECTION;
};

const getCanonicalTrackerPath = (pathname: string): string | null => {
  if (pathname === '/') {
    return null;
  }

  const match = pathname.match(/^\/([^/]+)\/?$/);
  if (!match) {
    return '/home';
  }

  const section = match[1];
  if (!section) {
    return '/home';
  }

  const aliasTarget = legacySectionAliases[section];
  if (aliasTarget) {
    return `/${aliasTarget}`;
  }

  if (isSection(section)) {
    return `/${section}`;
  }

  return '/home';
};

function App() {
  const [pathname, setPathname] = useState<string>(() => getPathname());
  const { state: authState, user, redirectError } = useAuth();
  const [showA11yTesting, setShowA11yTesting] = useState(false);
  
  // Accessibility hooks
  const { announceRouteChange, AnnouncementRegion } = useRouteAnnouncer();
  const isAdmin = useIsAdmin();
  const mfaEnrolled = user ? multiFactor(user).enrolledFactors.length > 0 : null;

  const currentSection = pathname === '/' ? DEFAULT_SECTION : getSectionFromPath(pathname);


  useEffect(() => {
    const handlePopState = () => {
      setPathname(getPathname());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    pageView(pathname);
  }, [pathname]);

  useEffect(() => {
    const canonicalPath = getCanonicalTrackerPath(pathname);
    if (canonicalPath && canonicalPath !== pathname) {
      window.history.replaceState({}, '', canonicalPath);
      setPathname(canonicalPath);
    }
  }, [pathname]);

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#14b8a6]" />
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <SignInPage redirectError={redirectError} />;
  }

  // Force MFA enrollment before the app is accessible.
  if (mfaEnrolled === false && user) {
    return <MfaEnrollModal user={user} onComplete={() => signOut(auth)} />;
  }

  const handleEnterTracker = () => {
    window.history.pushState({}, '', '/home');
    setPathname('/home');
    event('enter_tracker', 'navigation', 'Enter Tracker Button');
  };

  const handleBackToHome = () => {
    window.history.pushState({}, '', '/home');
    setPathname('/home');
    event('back_to_home', 'navigation', 'Back to Home');
  };

  const getSectionTitle = (section: Section): string => {
    const titles: Record<Section, string> = {
      home: 'Parliament AI Home',
      research: 'Parliamentary AI Assistant',
      'research-library': 'Research Library',
      'saved-research': 'Saved Research',
      'ai-integrity': 'AI Integrity',
      'responsible-ai': 'Responsible AI',
      'platform-status': 'Platform Status',
      about: 'About',
      architecture: 'System Architecture',
      'virtual-dail': 'Virtual DÃ¡il',
      officials: 'Elected Officials',
      personas: 'Ministerial Personas',
      debates: 'Parliamentary Debates',
      voting: 'Voting Records',
      qa: 'Questions & Answers',
      'advanced-ai-analytics': 'Advanced AI Analytics',
      'bias-detection': 'Bias Detection',
      attendance: 'Attendance Records',
      statistics: 'Legislation Explorer',
      analytics: 'Analytics',
      admin: 'Platform Admin',
      fun: 'Fun Zone',
    };
    return titles[section];
  };

  const getSectionDescription = (section: Section): string => {
    const descriptions: Record<Section, string> = {
      home: 'AI-powered insights and research pathways for parliamentary transparency',
      research: 'Ask questions about the Irish Parliament with the Parliamentary AI Assistant',
      'research-library': 'Curated prompts to help you explore, analyze, and understand parliamentary data',
      'saved-research': 'Access and manage your saved research, prompts and reports',
      'ai-integrity': 'Detect likely AI-assisted drafting in debates and legislation',
      'responsible-ai': 'Understand the platform safety controls, transparency standards, and governance commitments',
      'platform-status': 'Transparency, data sources, and system health',
      about: 'Mission, methodology, and governance approach behind Parliament AI',
      architecture: 'Understand the end-to-end architecture for transparent and accountable parliamentary AI responses',
      'virtual-dail': 'Experience interactive parliamentary debates in a simulated chamber environment',
      officials: 'View and filter elected representatives',
      personas: 'Explore comprehensive ministerial profiles and data cards',
      debates: 'Explore recent parliamentary discussions and proceedings',
      voting: 'Analyze voting patterns and bill outcomes',
      qa: 'Review parliamentary questions and official responses',
      'advanced-ai-analytics': 'Analyze framing, rhetoric, and unparliamentary language patterns',
      'bias-detection': 'Identify linguistic bias and framing effects in parliamentary discourse',
      attendance: 'Track session participation and attendance records',
      statistics: 'Explore bills, acts, stages, and activity across the parliamentary journey',
      analytics: 'Trends and insights from research activity and AI usage',
      admin: 'Manage users, access requests, features, and usage',
      fun: 'Interactive games, simulations, and engaging parliamentary experiences',
    };
    return descriptions[section];
  };

  const renderSection = () => {
    const LoadingSpinner = () => (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );

    // Debug: Log current section to help troubleshoot
    console.log('Current section:', currentSection);

    return (
      <Suspense fallback={<LoadingSpinner />}>
        {currentSection === 'home' ? <Home /> :
         currentSection === 'research' ? <Enquire /> :
         currentSection === 'research-library' ? <AIInsights /> :
         currentSection === 'saved-research' ? <SavedResearch /> :
         currentSection === 'ai-integrity' ? <AIIntegrity /> :
         currentSection === 'responsible-ai' ? <ResponsibleAI /> :
         currentSection === 'platform-status' ? <PlatformStatus /> :
         currentSection === 'about' ? <About /> :
         currentSection === 'architecture' ? <Architecture /> :
         currentSection === 'virtual-dail' ? <VirtualDail /> :
         currentSection === 'officials' ? <Officials /> :
         currentSection === 'personas' ? <Personas /> :
         currentSection === 'debates' ? <Debates /> :
         currentSection === 'voting' ? <Voting /> :
         currentSection === 'qa' ? <QuestionsAnswers /> :
         currentSection === 'advanced-ai-analytics' ? <Sentiment /> :
         currentSection === 'bias-detection' ? <Sentiment featureId="bias-detection" /> :
         currentSection === 'attendance' ? <Attendance /> :
         currentSection === 'statistics' ? <Statistics /> :
         currentSection === 'admin' ? (isAdmin ? <Admin /> : <div className="flex items-center justify-center h-64 text-[var(--dai-slate)]"><p>Admin access required.</p></div>) :
         currentSection === 'analytics' ? (isAdmin ? <Analytics /> : <div className="flex items-center justify-center h-64 text-[var(--dai-slate)]"><p>Sign in as an authorised administrator to access Analytics.</p></div>) :
         currentSection === 'fun' ? <Fun /> :
         <Home />}
      </Suspense>
    );
  };

  const trackerShell = (
    <div className="min-h-screen bg-gray-50">
      <SkipNavigation />
      
      <AppHeader
        onBackToHome={handleBackToHome}
      />
      
      <AppSidebar
        currentSection={currentSection}
        onBackToHome={handleBackToHome}
        isAdmin={isAdmin}
        onSectionChange={(section) => {
          const nextSection = section as Section;
            window.history.pushState({}, '', `/${nextSection}`);
            setPathname(`/${nextSection}`);
          announceRouteChange(getSectionTitle(nextSection));
        }}
      />
      <AnnouncementRegion />

      <div className="ml-[285px] pt-16">

        <main id="main-content" className={currentSection === 'research' ? 'h-screen' : currentSection === 'home' || currentSection === 'fun' || currentSection === 'responsible-ai' || currentSection === 'platform-status' || currentSection === 'about' || currentSection === 'architecture' || currentSection === 'research-library' || currentSection === 'saved-research' || currentSection === 'analytics' || currentSection === 'about' ? '' : 'p-8'} role="main">
          {renderSection()}
        </main>

        {currentSection !== 'home' && currentSection !== 'research' && (
          <footer className="border-t border-gray-200 mt-12 py-6 px-8">
            <div className="text-center text-sm text-gray-600">
              <p className="text-xs text-gray-500">
                Data sourced from{' '}
                <a 
                  href="https://www.oireachtas.ie/en/copyright-and-reuse/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  official parliamentary records
                </a>
                {' '}under the{' '}
                <a 
                  href="https://data.oireachtas.ie/ie/oireachtas/corporate/governanceAndReform/2016/2016-03-27_oireachtas-psi-licence-open-data_en.pdf" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Oireachtas Open Data PSI Licence
                </a>
                . Current data ingestion period: September 2025 - October 2025. Platform is politically neutral and non-partisan.
              </p>
            </div>
          </footer>
        )}
      </div>
      {/* Accessibility Testing Panel - only in development */}
      {import.meta.env.DEV && (
        <AccessibilityTestingPanel
          isVisible={showA11yTesting}
          onToggle={() => setShowA11yTesting(!showA11yTesting)}
        />
      )}
    </div>
  );

  if (pathname === '/') {
    return <StarterPage onEnterTracker={handleEnterTracker} />;
  }

  return trackerShell;
}

function AppWithProviders() {
  return (
    <App />
  );
}

export default AppWithProviders;
