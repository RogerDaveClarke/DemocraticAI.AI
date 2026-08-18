// Accessibility Hooks for React Components
import { useEffect, useRef } from 'react';

// Focus Management Hook
export function useFocusManagement(isOpen: boolean) {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const firstFocusableElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previousActiveElement.current = document.activeElement as HTMLElement;
      
      // Focus the first focusable element after a brief delay
      setTimeout(() => {
        if (firstFocusableElement.current) {
          firstFocusableElement.current.focus();
        }
      }, 100);
      
      // Prevent body scrolling
      document.body.style.overflow = 'hidden';
      
      return () => {
        document.body.style.overflow = 'unset';
        // Restore focus when modal closes
        if (previousActiveElement.current) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen]);

  return { firstFocusableElement };
}

// Route Change Announcer Hook
export function useRouteAnnouncer() {
  const announceRef = useRef<HTMLDivElement>(null);

  const announceRouteChange = (routeName: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = `Navigated to ${routeName}`;
      // Clear the announcement after a brief delay
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 2000);
    }
  };

  const AnnouncementRegion = () => (
    <div
      ref={announceRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );

  return { announceRouteChange, AnnouncementRegion };
}

// Loading State Announcer Hook
export function useLoadingAnnouncer() {
  const loadingRef = useRef<HTMLDivElement>(null);

  const announceLoading = (message: string = 'Loading content') => {
    if (loadingRef.current) {
      loadingRef.current.textContent = message;
    }
  };

  const announceComplete = (message: string = 'Content loaded') => {
    if (loadingRef.current) {
      loadingRef.current.textContent = message;
      setTimeout(() => {
        if (loadingRef.current) {
          loadingRef.current.textContent = '';
        }
      }, 1000);
    }
  };

  const LoadingAnnouncementRegion = () => (
    <div
      ref={loadingRef}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );

  return { announceLoading, announceComplete, LoadingAnnouncementRegion };
}

// Error Announcement Hook
export function useErrorAnnouncer() {
  const errorRef = useRef<HTMLDivElement>(null);

  const announceError = (message: string) => {
    if (errorRef.current) {
      errorRef.current.textContent = message;
    }
  };

  const clearError = () => {
    if (errorRef.current) {
      errorRef.current.textContent = '';
    }
  };

  const ErrorAnnouncementRegion = () => (
    <div
      ref={errorRef}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    />
  );

  return { announceError, clearError, ErrorAnnouncementRegion };
}