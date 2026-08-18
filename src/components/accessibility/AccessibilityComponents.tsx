// Accessibility Fixes Implementation Guide
// This file contains specific code improvements for the identified accessibility issues

// 1. MODAL ACCESSIBILITY WRAPPER
// Create a reusable accessible modal component

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function AccessibleModal({ 
  isOpen, 
  onClose, 
  title, 
  description,
  children 
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the currently focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the modal
      modalRef.current?.focus();
      
      // Prevent scrolling on the background
      document.body.style.overflow = 'hidden';
      
      // Handle escape key
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      
      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = 'unset';
        
        // Restore focus to the previous element
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  // Focus trap implementation
  const handleTabKey = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'Tab') return;

    const focusableElements = modalRef.current?.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (!focusableElements || focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        lastElement.focus();
        e.preventDefault();
      }
    } else {
      if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? "modal-description" : undefined}
        className="bg-white rounded-lg w-full max-w-7xl max-h-[90vh] overflow-hidden"
        tabIndex={-1}
        onKeyDown={handleTabKey}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <div>
              <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
                {title}
              </h2>
              {description && (
                <p id="modal-description" className="text-gray-600 mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

// 2. ACCESSIBLE BUTTON COMPONENT
// Reusable button with proper accessibility

interface AccessibleButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  className?: string;
}

export function AccessibleButton({
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = ''
}: AccessibleButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </button>
  );
}

// 3. ACCESSIBLE FORM INPUT
// Form input with proper labeling and error handling

interface AccessibleInputProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export function AccessibleInput({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  className = ''
}: AccessibleInputProps) {
  const hasError = !!error;
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = hasError ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
        }`}
      />
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600 mt-1">
          {helpText}
        </p>
      )}
      
      {hasError && (
        <p id={errorId} role="alert" className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// 4. ACCESSIBLE TEXTAREA
// Textarea with proper labeling and error handling

interface AccessibleTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  helpText?: string;
  rows?: number;
  className?: string;
}

export function AccessibleTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  helpText,
  rows = 4,
  className = ''
}: AccessibleTextareaProps) {
  const hasError = !!error;
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = hasError ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
        }`}
      />
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600 mt-1">
          {helpText}
        </p>
      )}
      
      {hasError && (
        <p id={errorId} role="alert" className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// 5. LOADING ANNOUNCER
// Component to announce loading states to screen readers

interface LoadingAnnouncerProps {
  isLoading: boolean;
  loadingText?: string;
  completedText?: string;
}

export function LoadingAnnouncer({ 
  isLoading, 
  loadingText = "Loading content", 
  completedText = "Content loaded" 
}: LoadingAnnouncerProps) {
  return (
    <div 
      role="status" 
      aria-live="polite" 
      aria-atomic="true"
      className="sr-only"
    >
      {isLoading ? loadingText : completedText}
    </div>
  );
}

// 6. SKIP NAVIGATION LINKS
// Skip links for keyboard navigation

export function SkipNavigation() {
  return (
    <div className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50">
      <a
        href="#main-content"
        className="bg-blue-600 text-white px-4 py-2 rounded-md focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>
    </div>
  );
}

// 7. ACCESSIBLE ICON BUTTON
// Icon-only button with proper accessibility

interface AccessibleIconButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function AccessibleIconButton({
  onClick,
  icon,
  label,
  variant = 'secondary',
  size = 'md',
  disabled = false,
  className = ''
}: AccessibleIconButtonProps) {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 focus:ring-gray-500',
    danger: 'text-red-600 hover:text-red-900 hover:bg-red-50 focus:ring-red-500'
  };
  
  const sizeClasses = {
    sm: 'p-1.5',
    md: 'p-2',
    lg: 'p-3'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {icon}
    </button>
  );
}

// 8. ACCESSIBLE SELECT DROPDOWN
// Select dropdown with proper accessibility

interface AccessibleSelectProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  required?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
}

export function AccessibleSelect({
  id,
  label,
  value,
  onChange,
  options,
  required = false,
  error,
  helpText,
  className = ''
}: AccessibleSelectProps) {
  const hasError = !!error;
  const helpId = helpText ? `${id}-help` : undefined;
  const errorId = hasError ? `${id}-error` : undefined;
  const describedBy = [helpId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>
      
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-invalid={hasError}
        aria-describedby={describedBy}
        className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
          hasError ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
        }`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600 mt-1">
          {helpText}
        </p>
      )}
      
      {hasError && (
        <p id={errorId} role="alert" className="text-sm text-red-600 mt-1">
          {error}
        </p>
      )}
    </div>
  );
}

// 9. SCREEN READER ONLY TEXT
// Utility for screen reader only content

interface ScreenReaderOnlyProps {
  children: React.ReactNode;
}

export function ScreenReaderOnly({ children }: ScreenReaderOnlyProps) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

// 10. ACCESSIBLE CARD COMPONENT
// Card with proper keyboard navigation

interface AccessibleCardProps {
  children: React.ReactNode;
  onClick?: () => void;
  title?: string;
  description?: string;
  className?: string;
}

export function AccessibleCard({
  children,
  onClick,
  title,
  description,
  className = ''
}: AccessibleCardProps) {
  const isInteractive = !!onClick;
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  if (isInteractive) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        aria-label={title}
        aria-describedby={description ? `${title}-desc` : undefined}
        className={`cursor-pointer focus:ring-2 focus:ring-blue-500 focus:outline-none ${className}`}
      >
        {children}
        {description && (
          <div id={`${title}-desc`} className="sr-only">
            {description}
          </div>
        )}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

// Usage Examples:

// Replace existing modals with:
// <AccessibleModal
//   isOpen={showModal}
//   onClose={() => setShowModal(false)}
//   title="Advanced Analytics"
//   description="Detailed analytics and insights"
// >
//   {modalContent}
// </AccessibleModal>

// Replace buttons with:
// <AccessibleButton
//   onClick={handleSubmit}
//   ariaLabel="Submit form"
//   variant="primary"
// >
//   Submit
// </AccessibleButton>

// Replace form inputs with:
// <AccessibleInput
//   id="query-input"
//   label="Query"
//   value={query}
//   onChange={setQuery}
//   required
//   helpText="Enter your question about parliament"
// />