// Enhanced Form Components with Accessibility
import { useState, forwardRef } from 'react';
import { useErrorAnnouncer } from '../../hooks/accessibilityHooks';

interface AccessibleFormProps {
  onSubmit: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const AccessibleSearchForm = forwardRef<HTMLInputElement, AccessibleFormProps>(
  ({ onSubmit, placeholder = "Enter your query", disabled = false, className = "" }, ref) => {
    const [value, setValue] = useState('');
    const [error, setError] = useState('');
    const { announceError, clearError, ErrorAnnouncementRegion } = useErrorAnnouncer();

    const validateInput = (input: string): boolean => {
      if (!input.trim()) {
        const errorMsg = 'Please enter a question or search term';
        setError(errorMsg);
        announceError(errorMsg);
        return false;
      }
      
      if (input.trim().length < 3) {
        const errorMsg = 'Please enter at least 3 characters';
        setError(errorMsg);
        announceError(errorMsg);
        return false;
      }
      
      clearError();
      setError('');
      return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      
      if (validateInput(value)) {
        onSubmit(value.trim());
        setValue('');
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setValue(e.target.value);
      // Clear error when user starts typing
      if (error) {
        setError('');
        clearError();
      }
    };

    return (
      <div className={className}>
        <ErrorAnnouncementRegion />
        <form onSubmit={handleSubmit}>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label htmlFor="search-input" className="sr-only">
                Search parliamentary records
              </label>
              <input
                ref={ref}
                id="search-input"
                type="text"
                value={value}
                onChange={handleInputChange}
                placeholder={placeholder}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={error ? "search-error" : "search-help"}
                className={`flex-1 max-w-md p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
              />
              <div id="search-help" className="sr-only">
                Enter your question about Irish Parliament proceedings
              </div>
              {error && (
                <div id="search-error" role="alert" className="text-sm text-red-600 mt-1">
                  {error}
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={!value.trim() || disabled}
              aria-label="Submit search query"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Send
            </button>
          </div>
        </form>
      </div>
    );
  }
);

AccessibleSearchForm.displayName = 'AccessibleSearchForm';

export default AccessibleSearchForm;