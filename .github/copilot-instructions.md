# LayoutCraft Frontend - AI Coding Agent Instructions

## Project Overview

LayoutCraft is an AI-powered marketing design tool. This is a **static vanilla JavaScript frontend** deployed to Vercel with no build process. It uses ES modules, centralized services, and SessionStorage/LocalStorage for state management.

**Tech Stack**: HTML5, Vanilla JS (ES modules), CSS (custom property-based design tokens), Backend: Python/Onrender

---

## Architecture Patterns

### 1. **Service Singleton Pattern**
The codebase uses singleton services exported from `/shared/js/`:

- **`authService`**: Handles auth state, token management, API calls
  - Stores JWT in `localStorage` with key `layoutcraft_access_token`
  - Provides `fetchAuthenticated(endpoint, options)` - use this for all backend calls
  - Implements token expiration checking via JWT payload decoding
  - Format errors with `formatAuthError()` for user-friendly messages

- **`subscriptionService`**: Manages user subscription tier (free/pro/pro-trial)
  - Lazily fetches from backend, caches in memory
  - Methods: `isPro()`, `isOnTrial()`, `isOnTrialOrPro()`
  - Used for feature gating throughout the app

### 2. **Multi-Page App with Dynamic Navigation**
- Each major section (home, app, account, pricing, etc.) has its own `index.html`
- Navigation bar injected via `navigation.js` into a `<div id="main-navigation"></div>` placeholder
- Page routing is server-side (Vercel rewrites), not client-side routing
- Auth state survives page navigation via `localStorage` and cross-domain events

### 3. **Component State Pattern**
- Pages manage local state as simple objects (e.g., `state` in `designer.js`)
- No global state manager - state is page-specific
- Session data passed via `sessionStorage` between pages (e.g., `layoutcraft_post_auth_prompt`)

---

## Critical Files & What They Control

| File | Purpose |
|------|---------|
| [`layoutcraft/shared/js/authService.js`](layoutcraft/shared/js/authService.js) | All auth/API logic; modify here for API changes |
| [`layoutcraft/shared/js/subscriptionService.js`](layoutcraft/shared/js/subscriptionService.js) | Subscription state & feature gating |
| [`layoutcraft/shared/js/navigation.js`](layoutcraft/shared/js/navigation.js) | Navigation UI, auth modal, signup/login flow |
| [`layoutcraft/app/js/designer.js`](layoutcraft/app/js/designer.js) | Main design generation engine (~900 lines) |
| [`layoutcraft/shared/css/tokens.css`](layoutcraft/shared/css/tokens.css) | All design tokens (colors, spacing, fonts); single source of truth |
| [`layoutcraft/shared/css/base.css`](layoutcraft/shared/css/base.css) | Global reset & button styles; imports tokens.css |
| [`layoutcraft/vercel.json`](layoutcraft/vercel.json) | URL rewrites & cache headers; critical for `/app` SPA behavior |

---

## Key Developer Workflows

### Backend Integration
All API calls follow this pattern:
```javascript
const data = await authService.fetchAuthenticated('/api/v1/generate', {
    method: 'POST',
    body: JSON.stringify({ prompt, theme, size_presets })
});
```

**Backend Base URL**: `https://layoutcraft-backend.onrender.com` (see [authService.js L13](layoutcraft/shared/js/authService.js#L13) for local dev options)

### Authentication Flow
1. User signs up/logs in via modal on homepage
2. `authService.register()` or `authService.login()` called
3. Token + user data stored in localStorage
4. User redirected to `/app/` with post-auth intent in sessionStorage
5. `designer.js` reads sessionStorage to initialize prompt/dimensions

### Design Generation Workflow
1. User enters prompt, selects dimensions, picks style
2. `performAction()` calls `/api/v1/generate` endpoint
3. Response includes `images_json` array with size_preset, image_url metadata
4. App enters 'editing' mode, user can refine with new prompt
5. Refinements call `/api/refine` endpoint instead of generate

### Subscription Gating
Feature access controlled via:
```javascript
if (!subscriptionService.isOnTrialOrPro()) {
    showUpgradeModal('Feature requires Pro');
    return;
}
```
Check [designer.js L580, L645](layoutcraft/app/js/designer.js#L580) for examples.

---

## Styling & Design Tokens

**All colors, spacing, fonts** defined once in [`tokens.css`](layoutcraft/shared/css/tokens.css):
- CSS custom properties: `--font-size-*`, `--spacing-*`, `--primary-gradient`, etc.
- Used throughout via `var(--token-name)`
- Never hardcode colors/sizes - add new token instead
- Gradients: `--primary-gradient`, `--secondary-gradient` (used in buttons, overlays)

**Responsive**: Uses `clamp()` for fluid sizing (e.g., `font-size: var(--font-size-hero)`).

---

## Critical Conventions & Gotchas

1. **Always use `authService.fetchAuthenticated()`** for protected endpoints - it handles auth headers, token expiry, and redirects

2. **Feature gating is per-user tier**, not just UI hiding:
   - "All Formats" dimension selection → Pro only
   - Design refinement/editing → Pro only
   - Check tier early, show upgrade modal if blocked

3. **Session Storage Bridge**:
   - Homepage CTA button stores data in `layoutcraft_post_auth_prompt`
   - Auth modal moves it to `layoutcraft_initial_data` post-signup
   - Designer reads this on init to pre-populate form
   - Always clean up after reading (see [designer.js L230](layoutcraft/app/js/designer.js#L230))

4. **Modal ID conflicts**: Always remove stale modals before creating new ones (see `showUpgradeModal()` [L91](layoutcraft/app/js/designer.js#L91))

5. **Error handling**: Uses `formatAuthError()` to convert backend messages to friendly UX text. Add patterns there if adding new error types.

6. **Token expiry**: JWT payload decoded in `isTokenExpired()`. Does NOT auto-refresh - must handle 401 and redirect.

7. **Subscription caching**: `subscriptionService` caches in memory. Call `clearSubscription()` after user pays (to force refetch), or implement `/users/refund-cancel` webhook handling.

---

## Testing & Deployment

- **No build step** - files served as-is from `/layoutcraft/` directory
- **Vercel rewrites** in `vercel.json` route `/app/*` to `/app/index.html` for SPA behavior
- **Static assets**: Images in `/layoutcraft/assets/`
- **Local dev**: Update `authService.apiBaseUrl` to `http://127.0.0.1:8000` for local backend

---

## Common Tasks

| Task | Where | Notes |
|------|-------|-------|
| Add new design endpoint | [`authService`](layoutcraft/shared/js/authService.js) | Add fetch call, handle response |
| Add feature gate | [`designer.js`](layoutcraft/app/js/designer.js) or page logic | Check `subscriptionService.isPro()` first |
| Update color scheme | [`tokens.css`](layoutcraft/shared/css/tokens.css) | One change propagates everywhere |
| Fix auth modal layout | [`navigation.js`](layoutcraft/shared/js/navigation.js#L150) | Styles in `navigation.css` |
| Handle new API error | [`authService.formatAuthError()`](layoutcraft/shared/js/authService.js#L103) | Add pattern matching for new error types |
