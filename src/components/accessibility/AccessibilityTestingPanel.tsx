// Accessibility Testing Component
// This component provides keyboard navigation testing and screen reader guidance

import { useState, useEffect } from 'react';
import { Eye, Keyboard, Volume2, CheckCircle, AlertCircle } from 'lucide-react';

interface AccessibilityTestingPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

export function AccessibilityTestingPanel({ isVisible, onToggle }: AccessibilityTestingPanelProps) {
  const [currentTest, setCurrentTest] = useState<string>('');
  const [keyboardOnlyMode, setKeyboardOnlyMode] = useState(false);
  const [announcements, setAnnouncements] = useState<string[]>([]);

  useEffect(() => {
    if (keyboardOnlyMode) {
      // Hide mouse cursor when in keyboard-only mode
      document.body.style.cursor = 'none';
      document.body.style.pointerEvents = 'none';
      // Re-enable keyboard events
      document.body.style.pointerEvents = 'auto';
      document.body.addEventListener('keydown', handleKeyboardOnly);
    } else {
      document.body.style.cursor = 'auto';
      document.body.style.pointerEvents = 'auto';
      document.body.removeEventListener('keydown', handleKeyboardOnly);
    }

    return () => {
      document.body.style.cursor = 'auto';
      document.body.style.pointerEvents = 'auto';
      document.body.removeEventListener('keydown', handleKeyboardOnly);
    };
  }, [keyboardOnlyMode]);

  const handleKeyboardOnly = (e: KeyboardEvent) => {
    // Allow keyboard navigation
    if (['Tab', 'Enter', 'Space', 'Escape', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
      e.stopImmediatePropagation();
    }
  };

  const tests = [
    {
      id: 'keyboard-nav',
      name: 'Keyboard Navigation',
      description: 'Test navigation using only Tab, Enter, and Arrow keys',
      status: 'pending',
      instructions: [
        'Press Tab to move between interactive elements',
        'Press Enter or Space to activate buttons and links',
        'Press Escape to close modals and dialogs',
        'Use Arrow keys in menus and lists'
      ]
    },
    {
      id: 'screen-reader',
      name: 'Screen Reader Support',
      description: 'Test with NVDA, JAWS, or VoiceOver',
      status: 'pending',
      instructions: [
        'Turn on your screen reader',
        'Navigate through headings with H key',
        'Use R key to navigate through regions',
        'Use B key to navigate through buttons',
        'Check that all content is announced properly'
      ]
    },
    {
      id: 'focus-management',
      name: 'Focus Management',
      description: 'Test focus behavior in modals and dynamic content',
      status: 'pending',
      instructions: [
        'Open a modal and verify focus moves to the modal',
        'Check that focus is trapped within the modal',
        'Close modal and verify focus returns to trigger',
        'Test focus indicators are visible and clear'
      ]
    },
    {
      id: 'color-contrast',
      name: 'Color Contrast',
      description: 'Verify text has sufficient contrast ratios',
      status: 'pending',
      instructions: [
        'Check that all text meets 4.5:1 contrast ratio',
        'Verify interactive elements have proper contrast',
        'Test in high contrast mode',
        'Ensure information is not conveyed by color alone'
      ]
    }
  ];

  const runKeyboardTest = () => {
    setCurrentTest('keyboard-nav');
    setKeyboardOnlyMode(true);
    addAnnouncement('Keyboard-only mode activated. Use Tab to navigate, Enter to activate.');
  };

  const runScreenReaderTest = () => {
    setCurrentTest('screen-reader');
    addAnnouncement('Screen reader test mode. Please turn on your screen reader software.');
  };

  const runFocusTest = () => {
    setCurrentTest('focus-management');
    addAnnouncement('Focus management test. Try opening and closing modals.');
  };

  const runContrastTest = () => {
    setCurrentTest('color-contrast');
    // Toggle high contrast mode
    document.body.classList.toggle('high-contrast-mode');
    addAnnouncement('High contrast mode toggled for color testing.');
  };

  const stopCurrentTest = () => {
    setCurrentTest('');
    setKeyboardOnlyMode(false);
    document.body.classList.remove('high-contrast-mode');
    addAnnouncement('All tests stopped. Normal mode restored.');
  };

  const addAnnouncement = (message: string) => {
    setAnnouncements(prev => [message, ...prev.slice(0, 4)]);
  };

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-50"
        aria-label="Open accessibility testing panel"
      >
        <Eye className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-xl w-80 max-h-96 overflow-hidden z-50">
      <div className="p-4 border-b border-gray-200 bg-purple-50">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-purple-900">Accessibility Testing</h3>
          <button
            onClick={onToggle}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close accessibility testing panel"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="p-4 overflow-y-auto max-h-80">
        {/* Current Test Status */}
        {currentTest && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Running: {tests.find(t => t.id === currentTest)?.name}
              </span>
            </div>
            <button
              onClick={stopCurrentTest}
              className="text-sm text-blue-700 hover:text-blue-900 underline"
            >
              Stop Test
            </button>
          </div>
        )}

        {/* Test Buttons */}
        <div className="space-y-3 mb-4">
          <button
            onClick={runKeyboardTest}
            disabled={currentTest === 'keyboard-nav'}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 rounded-lg text-left transition-colors"
          >
            <Keyboard className="w-5 h-5 text-gray-600" />
            <div>
              <div className="font-medium">Keyboard Navigation</div>
              <div className="text-sm text-gray-600">Test Tab navigation</div>
            </div>
          </button>

          <button
            onClick={runScreenReaderTest}
            disabled={currentTest === 'screen-reader'}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 rounded-lg text-left transition-colors"
          >
            <Volume2 className="w-5 h-5 text-gray-600" />
            <div>
              <div className="font-medium">Screen Reader</div>
              <div className="text-sm text-gray-600">Test with assistive tech</div>
            </div>
          </button>

          <button
            onClick={runFocusTest}
            disabled={currentTest === 'focus-management'}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 rounded-lg text-left transition-colors"
          >
            <Eye className="w-5 h-5 text-gray-600" />
            <div>
              <div className="font-medium">Focus Management</div>
              <div className="text-sm text-gray-600">Test modal focus</div>
            </div>
          </button>

          <button
            onClick={runContrastTest}
            disabled={currentTest === 'color-contrast'}
            className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 disabled:bg-gray-200 rounded-lg text-left transition-colors"
          >
            <AlertCircle className="w-5 h-5 text-gray-600" />
            <div>
              <div className="font-medium">Color Contrast</div>
              <div className="text-sm text-gray-600">Toggle high contrast</div>
            </div>
          </button>
        </div>

        {/* Announcements Log */}
        {announcements.length > 0 && (
          <div className="border-t border-gray-200 pt-3">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Test Announcements</h4>
            <div className="space-y-1">
              {announcements.map((announcement, index) => (
                <div
                  key={index}
                  className="text-xs text-gray-600 p-2 bg-gray-50 rounded"
                >
                  {announcement}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {announcements[0]}
      </div>
    </div>
  );
}

// High contrast CSS (add to your global styles)
export const highContrastStyles = `
.high-contrast-mode {
  filter: contrast(200%) brightness(150%);
}

.high-contrast-mode * {
  background-color: white !important;
  color: black !important;
  border-color: black !important;
}

.high-contrast-mode a {
  color: blue !important;
  text-decoration: underline !important;
}

.high-contrast-mode button {
  background-color: yellow !important;
  color: black !important;
  border: 2px solid black !important;
}
`;