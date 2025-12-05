# LayoutCraft Migration: Implementation Notes

This document records the key decisions, challenges, and discoveries made during the migration of the LayoutCraft vanilla JS application to Next.js.

## Phase 1: The "Safety Net" (Playwright Testing)

**Status:** Skipped

**Decision:** The initial plan was to create a comprehensive suite of Playwright E2E tests to lock in the behavior of the original application. However, we encountered persistent, unresolvable timeouts when running Playwright in the development environment.

**Justification:** After multiple failed attempts to diagnose the timeout issue (including trying different web servers, running in headed mode, and adjusting configurations), a decision was made to bypass this phase to avoid further delays. While this introduces some risk, the migration will proceed with careful manual testing and a focus on visual and functional parity.

## Phase 2-3: The Setup & "App" Migration

### State Management (`designer.js` -> `app/page.tsx`)

*   **Original:** The vanilla JS `designer.js` used a single, mutable `state` object to manage the entire application's state. UI updates were handled by manually calling `renderUI()` and other specific rendering functions.
*   **Next.js:** The application's state is now managed by a `useState` hook in the `DesignerPage` component, with a `DesignerState` interface defining the shape of the state. This provides type safety and aligns with React's declarative approach to UI development.

### Event Handling

*   **Original:** Event listeners were manually added and removed (e.g., `generateBtn.addEventListener('click', ...)`).
*   **Next.js:** Standard React event handlers (e.g., `onClick`, `onChange`) are used, which simplifies the code and reduces the risk of memory leaks from dangling event listeners.

### Componentization

*   **Original:** The entire application was a single HTML file with a monolithic JavaScript file managing everything.
*   **Next.js:** The UI has been broken down into smaller, reusable components (`Navigation`, `Footer`, `Dropdown`). This improves code organization, readability, and maintainability.

### Authentication Service (`authService.js` -> `lib/authService.ts`)

*   **Original:** The `authService.js` was a class-based service that was instantiated and exported as a singleton.
*   **Next.js:** The service has been ported to TypeScript, maintaining the class-based structure and singleton export. Type annotations have been added to improve code quality and catch potential errors. The API endpoints and core logic remain identical to the original.

### "Gotchas" & Discoveries

*   **Missing `layout.tsx`:** The `create-next-app` command, for unknown reasons, failed to create the `app/layout.tsx` file. This was unexpected and required manual creation of the file and its contents.
*   **Playwright Timeouts:** The persistent timeouts with Playwright remain a mystery. This could be an environment-specific issue, but it's a significant "gotcha" to be aware of for future development on this project.
