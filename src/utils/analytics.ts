// Standard taxonomy — single GA4 event 'feature_interaction' with structured params
export type Feature =
  | 'home' | 'enquire' | 'research-library' | 'saved-research'
  | 'officials' | 'personas' | 'debates' | 'voting' | 'qa'
  | 'ai-integrity' | 'advanced-ai-analytics' | 'attendance' | 'statistics'
  | 'platform-status' | 'architecture' | 'responsible-ai' | 'about'
  | 'analytics' | 'fun';

export type Control =
  | 'search' | 'filter' | 'tab' | 'sort' | 'view-toggle' | 'card-expand'
  | 'export' | 'nav' | 'pagination' | 'date-range' | 'modal-open' | 'modal-close'
  | 'prompt-select' | 'save' | 'share' | 'mode-switch';

export type TrackAction = 'click' | 'submit' | 'select' | 'toggle' | 'expand' | 'apply';

export function track(
  feature: Feature,
  control: Control,
  action: TrackAction,
  label?: string,
): void {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', 'feature_interaction', {
      feature,
      control,
      action,
      ...(label !== undefined && { label }),
    });
  }
}
declare global {
  interface Window {
    gtag?: (
      command: string,
      targetId: string,
      config?: Record<string, unknown>
    ) => void;
  }
}

const getMeasurementId = () => {
  return import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-XXXXXXXXXX';
};

export function pageView(path: string) {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('config', getMeasurementId(), {
      page_path: path,
    });
  }
}

export function event(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  }
}

export function trackWebVitals(metric: {
  name: string;
  value: number;
  id: string;
}) {
  if (typeof window.gtag !== 'undefined') {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }
}

