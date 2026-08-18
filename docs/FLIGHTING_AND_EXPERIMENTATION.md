# Flighting and Experimentation

## What was built

A feature flag system backed by Firebase Remote Config with a typed registry, enabling features to be toggled at runtime without redeployment. Supports admin-only access gates, percentage rollouts, and A/B experiments.

### Files

| File | Purpose |
|---|---|
| `src/config/featureFlags.ts` | Registry of all flag keys, their scope taxonomy, and default values |
| `src/config/firebase.ts` | Initialises Remote Config with `featureFlagDefaults` as fallback values |
| `src/hooks/useFeatureFlag.ts` | React hook � fetches Remote Config on mount, returns a boolean flag value |
| `src/hooks/useIsAdmin.ts` | React hook � returns `true` when the signed-in user matches `VITE_ADMIN_EMAIL` |

---

## Flag taxonomy

All flags are named with the prefix `ff_` followed by a scope and a descriptive name.

`
ff_<scope>_<name>
`

| Scope | Purpose | Example |
|---|---|---|
| `ff_access_*` | Admin or permission-gated feature | `ff_access_analytics_page` |
| `ff_exp_*` | Live experiment or A/B test | `ff_exp_new_voting_chart` |
| `ff_beta_*` | Gradual rollout to a % of users | `ff_beta_ai_compare` |
| `ff_nav_*` | Navigation item visibility | `ff_nav_show_fun` |

The `ff_` prefix makes all flags instantly scannable in the Firebase Console parameter list.

---

## The flag registry

All flags must be declared in `src/config/featureFlags.ts` before use. TypeScript will fail to compile if an undeclared key is passed to `useFeatureFlag()`.

`	ypescript
// src/config/featureFlags.ts

export type FeatureFlag =
  | 'ff_access_analytics_page'
  | 'ff_exp_new_voting_chart';    // add new flags here

export const featureFlagDefaults: Record<FeatureFlag, boolean> = {
  ff_access_analytics_page: false,
  ff_exp_new_voting_chart: false, // always false until explicitly enabled
};
`

Default values are used when Remote Config is unreachable (offline, quota exceeded, not yet fetched). Always default to `false` � features are off unless explicitly enabled.

---

## Using flags in components

### Toggle a feature on/off

`	ypescript
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

const showNewChart = useFeatureFlag('ff_exp_new_voting_chart');

return showNewChart ? <NewVotingChart /> : <LegacyVotingChart />;
`

### Admin-only access gate

`useIsAdmin()` is independent of Remote Config. It checks `currentUser.email` against the `VITE_ADMIN_EMAIL` env var immediately on auth state change.

`	ypescript
import { useIsAdmin } from '@/hooks/useIsAdmin';

const isAdmin = useIsAdmin();

return isAdmin ? <AdminPanel /> : <AccessDenied />;
`

Use `useIsAdmin` for hard access control. Use `useFeatureFlag` for rollouts and experiments.

---

## Environment variable

`
VITE_ADMIN_EMAIL=rogerdaveclarke@gmail.com
`

Add to `.env.local`. Without it, `useIsAdmin()` always returns `false`.

---

## Firebase Console setup (one-time)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) ? select project `your-project-id`
2. Left nav ? **Remote Config**
3. Click **Add parameter**
4. Parameter key: `ff_access_analytics_page`
5. Default value: `false`
6. Click **Save** ? **Publish changes**

Repeat for each flag in the registry.

---

## Switching a feature on or off

1. Firebase Console ? Remote Config
2. Find the flag by its `ff_` prefix
3. Edit the default value: `true` to enable, `false` to disable
4. Click **Publish changes**

Changes propagate to clients within the fetch interval:
- Development: ~10 seconds (configured in `firebase.ts`)
- Production: ~12 hours (standard Remote Config cache)

To force immediate pickup in production, call `fetchAndActivate(remoteConfig)` on demand, or reduce the fetch interval temporarily.

---

## Admin-only flag (access gate)

To make a flag return `true` only for the admin account:

1. Firebase Console ? Remote Config ? select the flag
2. Click **Add condition** ? **Create new condition**
3. Name: `Admin user`
4. Condition: **User property** ? `admin_user` **equals** `true`
5. Value for this condition: `true`
6. Default value: `false`
7. Publish

Then in the app, set the user property on login:

`	ypescript
import { setUserProperties } from 'firebase/analytics';
import { analytics } from '../config/firebase'; // add analytics export if needed

if (currentUser?.email === import.meta.env.VITE_ADMIN_EMAIL) {
  setUserProperties(analytics, { admin_user: 'true' });
}
`

> Note: The current `useIsAdmin()` hook performs a direct email check and does not require this Firebase condition. The condition approach is useful if you want to gate flags for a small group of users without code changes.

---

## Running an A/B experiment

### 1. Declare the flag

In `src/config/featureFlags.ts`:

`	ypescript
export type FeatureFlag =
  | 'ff_access_analytics_page'
  | 'ff_exp_new_voting_chart';  // new

export const featureFlagDefaults = {
  ff_access_analytics_page: false,
  ff_exp_new_voting_chart: false,
};
`

### 2. Implement both variants in the component

`	ypescript
const useNewChart = useFeatureFlag('ff_exp_new_voting_chart');

return useNewChart ? <NewVotingChart /> : <LegacyVotingChart />;
`

### 3. Create the experiment in Firebase

1. Firebase Console ? **A/B Testing** (under Remote Config)
2. Click **Create experiment** ? **Remote Config**
3. Name: `New voting chart layout`
4. Target: All users (or restrict by platform, country, user property)
5. Variants:
   - **Control** (50%): `ff_exp_new_voting_chart = false`
   - **Treatment** (50%): `ff_exp_new_voting_chart = true`
6. Goal metric: connect a GA4 event (e.g., `feature_interaction` where `feature = voting`)
7. Click **Start experiment**

### 4. Monitor results

Firebase A/B Testing reports lift, confidence interval, and probability of improvement against the goal metric.

When the experiment concludes:
- **Roll out winner**: set the winning variant as the new default and remove the flag
- **Roll back**: set default to `false` and remove the flag from the registry and component

---

## Gradual rollout (beta)

To enable a feature for a percentage of users without a formal experiment:

1. Firebase Console ? Remote Config ? your `ff_beta_*` flag
2. Add condition: **Random percentile** ? **= 10** (10% of users)
3. Value for condition: `true`
4. Default value: `false`
5. Publish

Increase the percentile incrementally (10 ? 25 ? 50 ? 100) as you gain confidence.

---

## Fetch timing

Remote Config fetches are cached. The app will not reflect changes instantly on production.

| Environment | Minimum fetch interval | Configured in |
|---|---|---|
| Development (`import.meta.env.DEV`) | 10 seconds | `src/config/firebase.ts` |
| Production | 12 hours (43 200 000 ms) | `src/config/firebase.ts` |

To force a fresh fetch during testing, clear the Remote Config cache in the Firebase Console (Remote Config ? three-dot menu ? Force fetch on clients) or temporarily reduce the interval in `firebase.ts`.

---

## Currently flagged features

| Flag | Scope | Default | Description |
|---|---|---|---|
| `ff_access_analytics_page` | access | `false` | Analytics page visible only to admin |

---

## Adding a new flag � checklist

- [ ] Add key to `FeatureFlag` type in `src/config/featureFlags.ts`
- [ ] Add default (`false`) to `featureFlagDefaults`
- [ ] Add the parameter in Firebase Console ? Remote Config
- [ ] Add the condition(s) in Firebase Console
- [ ] Publish Remote Config changes
- [ ] Call `useFeatureFlag('ff_...')` in the component
- [ ] When the flag is fully rolled out, remove it from all of the above
