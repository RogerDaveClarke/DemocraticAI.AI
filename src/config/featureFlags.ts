// All Remote Config feature flag keys. Add new flags here before using them.
// Naming: ff_<scope>_<name>
export type FeatureFlag =
  | 'ff_access_analytics_page'
  | 'ff_access_feedback'
  | 'ff_quota_daily_limit';

export const featureFlagDefaults: Record<FeatureFlag, boolean> = {
  ff_access_analytics_page: false,
  ff_access_feedback: false,
  ff_quota_daily_limit: false,
};
